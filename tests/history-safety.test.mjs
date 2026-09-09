import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { webcrypto } from "node:crypto";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { normalizeHistory, SOURCE_KEYS } from "../public/shared/history.mjs";
import {
  newCode,
  PAIRING_KEY,
  encryptSnapshot,
  decryptSnapshot,
  getHistory,
} from "../public/shared/sync.mjs";
import { dashboard } from "../src/lib/scoring.mjs";
import { previewStrength } from "../src/lib/strength-comparison.mjs";

// All data in this suite are fabricated. No actual browser storage or network.
function rawFixtures() {
  return {
    bulgarian: {
      schemaVersion: 2,
      settings: { units: "lb", notes: "Keep this tracker setting" },
      undoSnapshot: { marker: "Keep original undo data" },
      lifts: Object.fromEntries(
        ["backSquat", "benchPress", "deadlift"].map((lift, i) => [
          lift,
          {
            currentTopWeight: 400 + i,
            history: [
              {
                id: `${lift}-new`,
                actualResultDate: "2026-09-09",
                topWeight: 300 + i * 20,
                result: "completed",
                topSingleCompleted: true,
                backoffWorkCompleted: true,
                backoffWeight: 280 + i * 20,
                backoffSets: 3,
                backoffReps: 5,
                notes: "Keep the original record",
              },
              {
                id: `${lift}-old`,
                actualResultDate: "2026-09-07",
                topWeight: 290 + i * 20,
                result: "failed",
                topSingleCompleted: false,
              },
            ],
          },
        ]),
      ),
    },
    accessory: {
      version: 4,
      settings: { marker: "Keep accessory settings" },
      exercises: [{ id: "curl", name: "Curl", nextWeight: "40 lb" }],
      sessions: [
        {
          id: "new",
          date: "2026-09-09",
          notes: "Keep session notes",
          exercises: [
            {
              exerciseId: "curl",
              name: "Curl",
              weight: "20 kg",
              sets: 3,
              reps: 10,
              outcome: "success",
            },
          ],
        },
        {
          id: "old",
          date: "2026-09-08",
          exercises: [
            {
              exerciseId: "hold",
              name: "Hold",
              weight: "30 seconds",
              sets: 2,
              reps: 1,
              outcome: "skipped",
            },
          ],
        },
      ],
    },
  };
}
function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

test("normalization, ranks, profile changes and previews never mutate either original history", () => {
  const raw = rawFixtures(),
    original = JSON.stringify(raw);
  freeze(raw);
  const snapshots = Object.fromEntries(
    Object.entries(raw).map(([source, value]) => [
      source,
      normalizeHistory(source, value),
    ]),
  );
  const before = JSON.stringify(snapshots);
  freeze(snapshots);
  for (const profile of [
    {},
    { comparisonMode: "relative", referenceCategory: "M", bodyweightKg: 80 },
    { comparisonMode: "relative", referenceCategory: "F", bodyweightKg: 60 },
  ]) {
    for (const target of [2, 4, 7]) {
      const view = dashboard(snapshots, "2026-09-09", target, profile);
      assert.ok(view.strength.potential.progression);
      for (const lift of Object.keys(view.strength.records))
        previewStrength(view.strength.records, profile, lift, 25);
    }
  }
  assert.equal(JSON.stringify(raw), original);
  assert.equal(JSON.stringify(snapshots), before);
});

test("invalid source histories are rejected without repairing, resetting or partially rewriting them", () => {
  for (const source of ["bulgarian", "accessory"]) {
    const raw = rawFixtures()[source];
    if (source === "bulgarian")
      raw.lifts.deadlift.history[1].actualResultDate = "invalid";
    else raw.sessions[1].exercises[0].outcome = "invalid";
    const before = JSON.stringify(raw);
    freeze(raw);
    assert.throws(() => normalizeHistory(source, raw), /invalid/);
    assert.equal(JSON.stringify(raw), before);
  }
});

test("dashboard history fetches are read-only, including missing, offline and damaged responses", async () => {
  const code = newCode();
  for (const [source, raw] of Object.entries(rawFixtures())) {
    const snapshot = freeze(normalizeHistory(source, raw)),
      before = JSON.stringify(snapshot);
    const envelope = await encryptSnapshot(code, snapshot);
    for (const mode of ["success", "missing", "offline", "damaged"]) {
      const requests = [];
      const fetcher = async (url, options) => {
        requests.push({
          url,
          method: options.method || "GET",
          body: options.body,
        });
        if (mode === "offline") throw new Error("Offline fixture");
        if (mode === "missing") return new Response(null, { status: 404 });
        const body =
          mode === "damaged"
            ? { ...envelope, ciphertext: "invalid" }
            : envelope;
        return new Response(JSON.stringify(body), {
          headers: { "X-Synced-At": "2026-09-09T12:00:00Z" },
        });
      };
      const request = getHistory(code, source, {
        endpoint: "https://fixture.invalid",
        fetcher,
      });
      if (mode === "offline" || mode === "damaged")
        await assert.rejects(request);
      else if (mode === "missing") assert.equal(await request, null);
      else assert.deepEqual((await request).snapshot, snapshot);
      assert.deepEqual(requests, [
        {
          url: `https://fixture.invalid/api/history/${source}`,
          method: "GET",
          body: undefined,
        },
      ]);
      assert.equal(JSON.stringify(snapshot), before);
    }
  }
});

let widgetBundle;
async function compiledWidget() {
  widgetBundle ||= build({
    configFile: false,
    logLevel: "silent",
    build: {
      write: false,
      minify: false,
      lib: {
        entry: fileURLToPath(
          new URL("../public/shared/widget.mjs", import.meta.url),
        ),
        name: "TrackerSync",
        formats: ["iife"],
      },
    },
  }).then(
    (result) =>
      (Array.isArray(result) ? result : [result])
        .flatMap((bundle) => bundle.output)
        .find((item) => item.type === "chunk").code,
  );
  return widgetBundle;
}
function element() {
  return {
    style: {},
    value: "",
    hidden: false,
    handlers: {},
    addEventListener(name, fn) {
      this.handlers[name] = fn;
    },
  };
}
async function trackerHarness(source, mode) {
  const code = newCode();
  const histories = Object.fromEntries(
    Object.entries(rawFixtures()).map(([id, raw]) => [
      SOURCE_KEYS[id],
      JSON.stringify(raw),
    ]),
  );
  if (mode === "invalid") histories[SOURCE_KEYS[source]] = "{damaged fixture";
  const initial = new Map([
    ...Object.entries(histories),
    [PAIRING_KEY, code],
    ["unrelated-app-key", "must survive"],
  ]);
  const storage = new Map(initial),
    writes = [],
    requests = [],
    pending = [];
  const controls = Object.fromEntries(
    [
      "[data-pl-status]",
      "input",
      "[data-pl-disconnect]",
      "[data-pl-dot]",
      "form",
    ].map((key) => [key, element()]),
  );
  const section = { ...element(), querySelector: (key) => controls[key] };
  const document = {
    ...element(),
    visibilityState: "visible",
    head: { append() {} },
    body: { append() {} },
    querySelector: () => ({ content: source }),
    createElement: (tag) => (tag === "details" ? section : element()),
  };
  const window = element();
  const context = vm.createContext({
    document,
    window,
    crypto: webcrypto,
    TextEncoder,
    TextDecoder,
    Uint8Array,
    btoa,
    atob,
    AbortSignal,
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem(key, value) {
        writes.push(["set", key]);
        assert.equal(
          key,
          PAIRING_KEY,
          "Sync must never overwrite a workout storage key",
        );
        storage.set(key, value);
      },
      removeItem(key) {
        writes.push(["remove", key]);
        assert.equal(
          key,
          PAIRING_KEY,
          "Disconnect must never delete workout storage",
        );
        storage.delete(key);
      },
      clear() {
        writes.push(["clear"]);
        throw new Error("Sync must never clear app storage");
      },
    },
    setInterval(fn) {
      pending.push(fn);
      return 1;
    },
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (mode === "offline") throw new Error("Offline fixture");
      return new Response(JSON.stringify({ ok: true }));
    },
  });
  new vm.Script(await compiledWidget()).runInContext(context);
  async function settled() {
    for (let i = 0; i < 200; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2));
      if (
        controls["[data-pl-status]"].textContent &&
        !controls["[data-pl-status]"].textContent.startsWith("Syncing")
      )
        return;
    }
    assert.fail("Fixture sync did not settle");
  }
  await settled();
  return {
    code,
    storage,
    initial,
    writes,
    requests,
    controls,
    window,
    pending,
    settled,
  };
}

for (const source of ["bulgarian", "accessory"]) {
  for (const mode of ["success", "offline", "invalid"]) {
    test(`${source} sync, retry, pairing and disconnect preserve both original histories (${mode})`, async () => {
      const h = await trackerHarness(source, mode);
      if (mode === "invalid") assert.equal(h.requests.length, 0);
      else {
        assert.ok(h.requests.length > 0);
        for (const { url, options } of h.requests) {
          assert.ok(url.endsWith(`/api/history/${source}`));
          assert.equal(options.method, "PUT");
          const uploaded = await decryptSnapshot(
            h.code,
            JSON.parse(options.body),
            source,
          );
          assert.deepEqual(
            uploaded,
            normalizeHistory(source, h.initial.get(SOURCE_KEYS[source])),
          );
        }
      }
      assert.deepEqual(h.writes, []);
      h.window.handlers.online();
      await h.settled();
      h.pending.forEach((tick) => tick());
      await h.settled();
      h.controls.input.value = h.code;
      h.controls.form.handlers.submit({ preventDefault() {} });
      await h.settled();
      h.controls["[data-pl-disconnect]"].handlers.click();
      for (const [key, value] of h.initial)
        if (key !== PAIRING_KEY) assert.equal(h.storage.get(key), value);
      assert.deepEqual(h.writes, [
        ["set", PAIRING_KEY],
        ["remove", PAIRING_KEY],
      ]);
      assert.equal(h.storage.has(PAIRING_KEY), false);
    });
  }
}
