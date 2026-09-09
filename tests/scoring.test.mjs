import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeHistory,
  shiftDate,
  monday,
  validateSnapshot,
} from "../public/shared/history.mjs";
import {
  dashboard,
  consistency,
  strength,
  RANKS,
} from "../src/lib/scoring.mjs";
import {
  newCode,
  cleanCode,
  encryptSnapshot,
  decryptSnapshot,
  authFor,
} from "../public/shared/sync.mjs";
const today = "2026-09-09";
function entry(exercise, weight, date = today, extra = {}) {
  return {
    id: `${exercise}-${date}`,
    source: "bulgarian",
    date,
    exercise,
    name: exercise,
    success: true,
    singleCompleted: true,
    weight,
    unit: "lb",
    sets: 1,
    reps: 1,
    outcome: "completed",
    countsDay: true,
    ...extra,
  };
}
const three = [
  entry("backSquat", 315),
  entry("benchPress", 225),
  entry("deadlift", 360),
];
function rawBulgarian() {
  return {
    schemaVersion: 2,
    lifts: Object.fromEntries(
      three.map((e) => [
        e.exercise,
        {
          history: [
            {
              id: e.id,
              actualResultDate: e.date,
              topWeight: e.weight,
              result: "completed",
            },
          ],
        },
      ]),
    ),
  };
}
function snapshot(events = three, source = "bulgarian") {
  return { schema: 1, source, events };
}
test("reads actual Auto Bulgarian v2 export and singles", () => {
  const s = normalizeHistory("bulgarian", rawBulgarian());
  assert.equal(s.events.length, 3);
  assert.equal(strength(s.events).total, 900);
});
test("ignores prescribed next weights and undo state", () => {
  const raw = rawBulgarian();
  raw.lifts.backSquat.currentTopWeight = 9999;
  raw.undoSnapshot = { lifts: { backSquat: { history: [{}] } } };
  assert.equal(strength(normalizeHistory("bulgarian", raw).events).total, 900);
});
test("does not count failed top single toward strength", () =>
  assert.equal(
    strength([
      ...three,
      entry("deadlift", 900, today, {
        id: "fail",
        success: false,
        singleCompleted: false,
      }),
    ]).total,
    900,
  ));
test("completed single with failed backoffs still counts", () => {
  const raw = rawBulgarian();
  raw.lifts.deadlift.history[0] = {
    ...raw.lifts.deadlift.history[0],
    result: "failed",
    topSingleCompleted: true,
    topWeight: 400,
  };
  assert.equal(strength(normalizeHistory("bulgarian", raw).events).total, 940);
});
test("three actual lift records required before awarding a form", () => {
  const s = strength(three.slice(0, 2));
  assert.equal(s.complete, false);
  assert.equal(s.progression.calibrated, false);
  assert.equal(s.progression.powerLevel, 5);
});
test("same-day logging across trackers earns one training day", () =>
  assert.equal(
    consistency(
      [...three, entry("curl", 20, today, { source: "accessory" })],
      today,
    ).totalDays,
    1,
  ));
test("all skipped accessory sessions do not count", () => {
  const s = normalizeHistory("accessory", {
    version: 4,
    exercises: [],
    sessions: [
      {
        id: "x",
        date: today,
        exercises: [
          {
            exerciseId: "curl",
            name: "Curl",
            weight: "20 lb",
            sets: 1,
            reps: 5,
            outcome: "skipped",
          },
        ],
      },
    ],
  });
  assert.equal(consistency(s.events, today).totalDays, 0);
});
test("accessory units and successful records stay separate", () => {
  const s = normalizeHistory("accessory", {
    version: 4,
    exercises: [],
    sessions: [
      {
        id: "x",
        date: today,
        exercises: [
          { name: "Hold", weight: "30 seconds", outcome: "success" },
          { name: "Curl", weight: "20 kg", outcome: "success" },
        ],
      },
    ],
  });
  assert.equal(s.events[0].unit, "sec");
  assert.equal(s.events[1].unit, "kg");
  assert.equal(strength(s.events).total, 0);
});
test("current partial week never lowers completed-week rank", () => {
  const events = [];
  const week = monday(today);
  for (let i = 1; i <= 12; i++)
    for (let j = 0; j < 4; j++)
      events.push(entry("backSquat", 100, shiftDate(week, -i * 7 + j)));
  assert.equal(consistency(events, today, 4).score, 100);
  assert.equal(consistency(events, shiftDate(today, 2), 4).score, 100);
});
test("extra days beyond target do not inflate rank", () => {
  const days = Array.from({ length: 84 }, (_, i) =>
    entry("x", 100, shiftDate(monday(today), -i - 1)),
  );
  assert.equal(consistency(days, today, 4).score, 100);
  assert.equal(consistency(days, today, 4).rank.name, "Challenger");
});
test("rank decays as missed completed weeks replace active weeks", () => {
  const days = Array.from({ length: 84 }, (_, i) =>
    entry("x", 100, shiftDate(monday(today), -i - 1)),
  );
  assert.ok(consistency(days, shiftDate(today, 7), 4).score < 100);
});
test("future dates never inflate scores or records", () => {
  const s = dashboard(
    {
      bulgarian: snapshot([
        ...three,
        entry("deadlift", 999, shiftDate(today, 1)),
      ]),
    },
    today,
  );
  assert.equal(s.strength.total, 900);
  assert.equal(s.future, 1);
});
test("invalid dates are rejected rather than silently skipped", () => {
  const raw = rawBulgarian();
  raw.lifts.backSquat.history[0].actualResultDate = "2026-02-30";
  assert.throws(() => normalizeHistory("bulgarian", raw), /invalid/);
});
test("duplicate histories cannot inflate scores", () => {
  const raw = rawBulgarian();
  raw.lifts.backSquat.history.push(raw.lifts.backSquat.history[0]);
  assert.equal(normalizeHistory("bulgarian", raw).events.length, 3);
});
test("replacement snapshots reflect undo and corrections", () => {
  const before = dashboard(
    {
      bulgarian: snapshot([
        ...three,
        entry("deadlift", 400, shiftDate(today, -1)),
      ]),
    },
    today,
  );
  const after = dashboard({ bulgarian: snapshot(three) }, today);
  assert.equal(before.strength.total - after.strength.total, 40);
  assert.ok(before.strength.progression.powerLevel > after.strength.progression.powerLevel);
});
test("consistency rank thresholds are strictly increasing", () => {
  RANKS.slice(1).forEach((r, i) => assert.ok(r.min > RANKS[i].min));
});
test("900 lb total maps to recovered Namek Goku without changing identity", () => {
  const s = strength(three);
  assert.equal(s.progression.powerLevel, 3000000);
  assert.equal(s.progression.current.id, "goku-namek-recovered");
  assert.equal(s.progression.transformation.name, "Crimson Drive XX");
  assert.equal(s.progression.progress, 0);
});
test("connection code has 256 bits and rejects invalid input", () => {
  const code = newCode();
  assert.equal(code.length, 47);
  assert.equal(cleanCode(code), code);
  assert.throws(() => cleanCode("abc"));
});
test("encryption round trips real normalized history without plaintext", async () => {
  const code = newCode();
  const encrypted = await encryptSnapshot(code, snapshot());
  assert.ok(!JSON.stringify(encrypted).includes("backSquat"));
  assert.deepEqual(
    await decryptSnapshot(code, encrypted, "bulgarian"),
    snapshot(),
  );
  assert.equal((await authFor(code)).length, 64);
});
test("wrong key, tampering and wrong source cannot decrypt", async () => {
  const code = newCode(),
    envelope = await encryptSnapshot(code, snapshot());
  await assert.rejects(() => decryptSnapshot(newCode(), envelope, "bulgarian"));
  await assert.rejects(() => decryptSnapshot(code, envelope, "accessory"));
  await assert.rejects(() =>
    decryptSnapshot(
      code,
      {
        ...envelope,
        ciphertext:
          (envelope.ciphertext[0] === "A" ? "B" : "A") +
          envelope.ciphertext.slice(1),
      },
      "bulgarian",
    ),
  );
});
test("large history encrypts without stack overflow", async () => {
  const events = Array.from({ length: 5000 }, (_, i) => ({
    ...three[0],
    id: `large-${i}`,
  }));
  const code = newCode();
  const envelope = await encryptSnapshot(code, snapshot(events));
  assert.equal(
    (await decryptSnapshot(code, envelope, "bulgarian")).events.length,
    5000,
  );
});
test("a payload claiming the wrong source is rejected", () =>
  assert.throws(() => validateSnapshot(snapshot(), "accessory")));
