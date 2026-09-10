import test from "node:test";
import assert from "node:assert/strict";
import {
  initialBodyweightState,
  prescription,
  nextLevel,
  maxLevel,
  updateBodyweight,
  entryFor,
  validateBodyweightState,
} from "../public/shared/bodyweight.mjs";
import {
  normalizeHistory,
  validateSnapshot,
} from "../public/shared/history.mjs";
import { dashboard } from "../src/lib/scoring.mjs";
import {
  encryptSnapshot,
  decryptSnapshot,
  newCode,
  putHistory,
  getHistory,
} from "../public/shared/sync.mjs";
const date = "2026-09-09",
  exerciseId = "air-squat";
const act = (state, action) =>
  updateBodyweight(state, { date, exerciseId, ...action }, date);
function complete(
  state,
  id = exerciseId,
  outcome = "comfortable",
  onDate = date,
) {
  const p = state.programs[id],
    lane = p.lanes[p.variant],
    count = prescription(lane.level, lane.baseReps);
  for (let n = 0; n < count.sets; n++)
    state = updateBodyweight(
      state,
      { type: "log", exerciseId: id, date: onDate, reps: count.reps },
      onDate,
    );
  return updateBodyweight(
    state,
    { type: "finish", exerciseId: id, date: onDate, outcome },
    onDate,
  );
}
test("default ladder follows 10-rep sets, resets to 12, and caps at 3×20", () => {
  assert.deepEqual(
    Array.from({ length: 6 }, (_, i) => prescription(i + 1)),
    [
      { sets: 1, reps: 10 },
      { sets: 2, reps: 10 },
      { sets: 3, reps: 10 },
      { sets: 1, reps: 12 },
      { sets: 2, reps: 12 },
      { sets: 3, reps: 12 },
    ],
  );
  assert.deepEqual(prescription(maxLevel()), { sets: 3, reps: 20 });
  assert.equal(nextLevel(maxLevel(), 10, "comfortable"), maxLevel());
});
test("every short-session reset reduces total reps or stays at the first level", () => {
  for (const base of [2, 4, 6, 8, 10])
    for (let level = 1; level <= maxLevel(base); level++) {
      const before = prescription(level, base),
        after = prescription(nextLevel(level, base, "short"), base);
      assert.ok(after.sets * after.reps <= before.sets * before.reps);
      if (level > 1)
        assert.ok(after.sets * after.reps < before.sets * before.reps);
    }
  assert.deepEqual(prescription(nextLevel(4, 10, "short")), {
    sets: 1,
    reps: 10,
  });
});
test("comfortable, hard, and skipped results progress independently", () => {
  let s = complete(initialBodyweightState());
  s = complete(s, "push-up", "hard");
  s = act(s, {
    type: "finish",
    exerciseId: "glute-bridge",
    outcome: "skipped",
  });
  assert.equal(s.programs[exerciseId].lanes.Standard.level, 2);
  assert.equal(s.programs["push-up"].lanes.Floor.level, 1);
  assert.equal(s.programs["glute-bridge"].lanes.Standard.level, 1);
  assert.equal(s.sessions.length, 1);
  assert.throws(
    () => act(s, { type: "finish", outcome: "comfortable" }),
    /already finished/,
  );
});
test("partial sets save actual reps and cannot be passed off as a full completion", () => {
  let s = act(initialBodyweightState(), { type: "log", reps: 6 });
  assert.deepEqual(entryFor(s, date, exerciseId).actualReps, [6]);
  assert.throws(
    () => act(s, { type: "finish", outcome: "comfortable" }),
    /missing its prescribed reps/,
  );
  s = act(s, { type: "finish", outcome: "short" });
  assert.equal(s.programs[exerciseId].lanes.Standard.level, 1);
  assert.equal(entryFor(s, date, exerciseId).outcome, "short");
});
test("undo restores progression and then removes saved reps without changing other exercises", () => {
  let s = complete(complete(initialBodyweightState()), "push-up");
  s = act(s, { type: "undo" });
  assert.equal(s.programs[exerciseId].lanes.Standard.level, 1);
  assert.equal(entryFor(s, date, exerciseId).outcome, null);
  assert.deepEqual(entryFor(s, date, exerciseId).actualReps, [10]);
  s = act(s, { type: "undo" });
  assert.equal(entryFor(s, date, exerciseId), undefined);
  assert.equal(s.programs["push-up"].lanes.Floor.level, 2);
});
test("editing older sessions cannot overwrite newer progression", () => {
  let s = complete(initialBodyweightState());
  s = complete(s, exerciseId, "comfortable", "2026-09-11");
  assert.throws(
    () => updateBodyweight(s, { type: "undo", exerciseId, date }, "2026-09-11"),
    /newer workout/,
  );
});
test("rest days and skips do not count; actual partial work does", () => {
  const rest = act(initialBodyweightState(), { type: "rest" });
  assert.equal(normalizeHistory("bodyweight", rest).events.length, 0);
  assert.throws(() => act(rest, { type: "log", reps: 10 }), /Resume training/);
  const skip = act(initialBodyweightState(), {
    type: "finish",
    outcome: "skipped",
  });
  assert.equal(normalizeHistory("bodyweight", skip).events[0].countsDay, false);
  let partial = act(initialBodyweightState(), { type: "log", reps: 4 });
  assert.equal(
    normalizeHistory("bodyweight", partial).events[0].countsDay,
    true,
  );
  const zero = act(initialBodyweightState(), { type: "log", reps: 0 });
  assert.equal(normalizeHistory("bodyweight", zero).events[0].countsDay, false);
  partial = act(partial, { type: "undo" });
  assert.equal(normalizeHistory("bodyweight", partial).events.length, 0);
});
test("variations have separate levels and support lower starting reps", () => {
  let s = act(initialBodyweightState(), {
    type: "adjust",
    exerciseId: "push-up",
    variant: "Wall",
    baseReps: 4,
    level: 2,
  });
  s = complete(s, "push-up");
  assert.equal(s.programs["push-up"].lanes.Wall.level, 3);
  assert.equal(s.programs["push-up"].lanes.Floor.level, 1);
  assert.throws(
    () =>
      act(s, {
        type: "adjust",
        exerciseId: "push-up",
        variant: "Floor",
        baseReps: 10,
        level: 1,
      }),
    /Undo this exercise/,
  );
});
test("future dates, malformed reps, excess sets, and corrupt backups are rejected", () => {
  assert.throws(
    () =>
      act(initialBodyweightState(), {
        type: "log",
        reps: 10,
        date: "2026-09-10",
      }),
    /Future/,
  );
  for (const reps of [NaN, Infinity, -1, 2.5, "10", 100])
    assert.throws(
      () => act(initialBodyweightState(), { type: "log", reps }),
      /actual reps/,
    );
  let s = act(initialBodyweightState(), { type: "log", reps: 10 });
  assert.throws(
    () => act(s, { type: "log", reps: 10 }),
    /already been recorded/,
  );
  const roundtrip = JSON.parse(JSON.stringify(s));
  assert.deepEqual(validateBodyweightState(roundtrip), s);
  roundtrip.sessions.push(structuredClone(roundtrip.sessions[0]));
  assert.throws(() => validateBodyweightState(roundtrip), /identifier/);
  assert.throws(() => validateBodyweightState({ version: 999 }), /supported/);
  assert.throws(() => prescription(1, 9), /Starting reps/);
});
test("bodyweight records count once per day without inflating barbell strength", () => {
  let s = complete(initialBodyweightState());
  s = complete(s, "push-up");
  s = complete(s, "glute-bridge");
  const snapshot = normalizeHistory("bodyweight", s);
  const data = dashboard({ bodyweight: snapshot }, date, 4);
  assert.equal(data.consistency.totalDays, 1);
  assert.equal(data.strength.total, 0);
  assert.equal(data.bodyweight.length, 3);
  assert.equal(data.bodyweight[0].totalReps, 10);
  assert.equal(data.accessories.length, 0);
  assert.deepEqual(validateSnapshot(snapshot, "bodyweight"), snapshot);
  snapshot.events[0].weight = 999;
  assert.throws(
    () => validateSnapshot(snapshot, "bodyweight"),
    /bodyweight record/,
  );
});
test("third source encrypts, decrypts, and rejects cross-source reuse", async () => {
  const snapshot = normalizeHistory(
      "bodyweight",
      complete(initialBodyweightState()),
    ),
    code = newCode();
  const encrypted = await encryptSnapshot(code, snapshot);
  assert.deepEqual(
    await decryptSnapshot(code, encrypted, "bodyweight"),
    snapshot,
  );
  await assert.rejects(
    () => decryptSnapshot(code, encrypted, "accessory"),
    /unlocked/,
  );
});
test("a comfortable repeat counts as completed work without advancing", () => {
  const state = complete(initialBodyweightState(), "push-up", "repeat");
  const snapshot = normalizeHistory("bodyweight", state);
  assert.equal(state.programs["push-up"].lanes.Floor.level, 1);
  assert.equal(snapshot.events[0].success, true);
  assert.equal(
    validateSnapshot(snapshot, "bodyweight").events[0].countsDay,
    true,
  );
});
test("sync transport uploads encrypted bodyweight snapshots and applies corrections", async () => {
  const code = newCode(),
    bodies = new Map();
  const fetcher = async (url, options) => {
    assert.match(url, /\/api\/history\/bodyweight$/);
    assert.match(options.headers.Authorization, /^Bearer [a-f0-9]{64}$/);
    if (options.method === "PUT") {
      const body = JSON.parse(options.body);
      assert.deepEqual(Object.keys(body).sort(), [
        "ciphertext",
        "iv",
        "version",
      ]);
      bodies.set(url, body);
      return new Response(
        JSON.stringify({ ok: true, updatedAt: "2026-09-09T12:00:00Z" }),
      );
    }
    return bodies.has(url)
      ? new Response(JSON.stringify(bodies.get(url)), {
          headers: { "X-Synced-At": "2026-09-09T12:00:00Z" },
        })
      : new Response("{}", { status: 404 });
  };
  let state = complete(initialBodyweightState());
  const first = normalizeHistory("bodyweight", state);
  await putHistory(code, first, { fetcher });
  assert.deepEqual(
    (await getHistory(code, "bodyweight", { fetcher })).snapshot,
    first,
  );
  state = act(act(state, { type: "undo" }), { type: "undo" });
  await putHistory(code, normalizeHistory("bodyweight", state), { fetcher });
  assert.equal(
    (await getHistory(code, "bodyweight", { fetcher })).snapshot.events.length,
    0,
  );
});
