import test from "node:test";
import assert from "node:assert/strict";
import { estimatedOneRepMax } from "../src/lib/potential.mjs";
import { strength, dashboard } from "../src/lib/scoring.mjs";
import { normalizeHistory, validateSnapshot } from "../public/shared/history.mjs";
import { encryptSnapshot, decryptSnapshot, newCode } from "../public/shared/sync.mjs";

const today = "2026-09-09";
const fixture = () => ({ schemaVersion: 2, lifts: Object.fromEntries(
  [["backSquat", 350], ["benchPress", 300], ["deadlift", 395]].map(([id, topWeight]) => [id, {
    currentTopWeight: 9999,
    history: [{ id, actualResultDate: today, topWeight, result: "completed",
      topSingleCompleted: true, backoffWorkCompleted: true,
      backoffWeight: topWeight - 50, backoffSets: 3, backoffReps: 5,
      totalBackoffReps: 15 }],
  }]),
) });
const normalized = (raw = fixture()) => normalizeHistory("bulgarian", raw);
const withoutEvidence = (snapshot) => ({ ...snapshot,
  events: snapshot.events.map(({ repSet, ...event }) => event),
});

test("Epley uses reps in one set and rejects non-evidence ranges", () => {
  assert.equal(estimatedOneRepMax(300, 5), 350);
  for (const reps of [0, 1, 11, 30, 2.5, Infinity, undefined, "5"])
    assert.equal(estimatedOneRepMax(300, reps), null);
  for (const weight of [0, -1, Infinity, NaN, null, "300"])
    assert.equal(estimatedOneRepMax(weight, 5), null);
});
test("normalization syncs completed backoff evidence without creating extra events", () => {
  const s = normalized();
  assert.equal(s.events.length, 3);
  assert.deepEqual(s.events.find((e) => e.exercise === "deadlift").repSet, { weight: 345, reps: 5 });
  assert.equal(s.events.find((e) => e.exercise === "deadlift").reps, 1);
  validateSnapshot(s, "bulgarian");
});
test("higher e1RM reveals an unrealized transformation without earning actual power", () => {
  const s = normalized(), baseline = strength(withoutEvidence(s).events);
  const actual = strength(s.events);
  assert.equal(actual.total, 1045);
  assert.deepEqual(actual.progression, baseline.progression);
  assert.equal(actual.progression.transformation.name, "Crimson Drive XX");
  assert.equal(actual.potential.progression.transformation.name, "Radiant Ascension I");
  assert.ok(actual.potential.progression.powerLevel > actual.progression.powerLevel);
  assert.equal(actual.potential.lifts.find((e) => e.id === "benchPress").projected, 300);
  assert.ok(Math.abs(actual.potential.total - 1052.5) < 1e-8);
  assert.ok(!actual.progression.unlockedTransformations.some((f) => f.name === "Radiant Ascension I"));
  assert.deepEqual(dashboard({bulgarian:s},today).consistency, dashboard({bulgarian:withoutEvidence(s)},today).consistency);
});
test("estimates below actual do not reduce totals, add power or reveal a false gap", () => {
  const raw = fixture();
  for (const lift of Object.values(raw.lifts)) lift.history[0].backoffWeight = 45;
  const s = strength(normalized(raw).events);
  assert.equal(s.potential.total, s.total);
  assert.equal(s.potential.hasPotential, false);
  assert.equal(s.potential.progression, null);
});
test("a gap within the current transformation still has continuously higher potential power", () => {
  const raw = fixture();
  raw.lifts.deadlift.history[0].backoffWeight = 339;
  const s = strength(normalized(raw).events);
  assert.ok(s.potential.hasPotential);
  assert.equal(s.potential.progression.transformation.id, s.progression.transformation.id);
  assert.ok(s.potential.progression.powerLevel > s.progression.powerLevel);
});
test("successful singles realize the estimate and remove the unrealized gap", () => {
  const s = normalized();
  const p = strength(s.events).potential;
  const updated = [...s.events, ...p.lifts.map((lift) => ({
    ...s.events.find((e) => e.exercise === lift.id), id:`proven-${lift.id}`,
    weight: lift.projected, repSet: undefined,
  }))];
  const result = strength(updated);
  assert.equal(result.potential.hasPotential, false);
  assert.equal(result.potential.progression, null);
  assert.equal(result.progression.transformation.name, "Radiant Ascension I");
});
test("failed, incomplete, unsupported and missing rep sets never become evidence", () => {
  for (const change of [
    {result:"failed",topSingleCompleted:true}, {backoffWorkCompleted:false},
    {backoffSets:0}, {backoffSets:1.5}, {backoffReps:11},
    {backoffReps:null}, {backoffReps:1}, {backoffWeight:Infinity},
  ]) {
    const raw = fixture();
    for (const lift of Object.values(raw.lifts)) Object.assign(lift.history[0], change);
    const s = normalized(raw);
    assert.ok(s.events.every((e) => !e.repSet));
    assert.equal(strength(s.events).potential.hasEvidence, false);
  }
});
test("legacy encrypted snapshots remain usable but never invent rep-set estimates", async () => {
  const s = withoutEvidence(normalized());
  const code = newCode();
  const result = await decryptSnapshot(code, await encryptSnapshot(code, s), "bulgarian");
  const actual = strength(result.events);
  assert.equal(actual.total,1045);
  assert.equal(actual.potential.hasEvidence,false);
});
test("new rep-set evidence survives encrypted sync and malformed evidence is rejected", async () => {
  const s = normalized(), code = newCode();
  assert.deepEqual(await decryptSnapshot(code, await encryptSnapshot(code,s),"bulgarian"),s);
  for (const change of [{repSet:null},{repSet:{weight:300,reps:100}}, {success:false}, {singleCompleted:false}, {outcome:"failed"}]) {
    const bad = structuredClone(s);
    Object.assign(bad.events[0],change);
    assert.throws(()=>validateSnapshot(bad,"bulgarian"),/rep-set/);
  }
});
test("accessory and bodyweight cannot grant potential even when named like main lifts", () => {
  const s = normalized();
  for (const source of ["accessory","bodyweight"]) {
    const other = s.events.map((e)=>({...e,source,repSet:{weight:999,reps:10}}));
    const actual = strength([...withoutEvidence(s).events,...other]);
    assert.equal(actual.potential.hasPotential,false);
    assert.equal(actual.total,1045);
  }
});
test("future evidence is ignored and source corrections can remove potential", () => {
  const s = normalized();
  const future = s.events.map((e)=>({...e,id:`future-${e.id}`,date:"2026-09-10"}));
  const old = withoutEvidence(s);
  assert.equal(dashboard({bulgarian:{...s,events:[...old.events,...future]}},today).strength.potential.hasPotential,false);
  assert.equal(dashboard({bulgarian:s},today).strength.potential.hasPotential,true);
  assert.equal(dashboard({bulgarian:old},today).strength.potential.hasPotential,false);
});
test("missing actual singles cannot be substituted with estimates to calibrate power", () => {
  const s = normalized();
  const actual = strength(s.events.filter((e)=>e.exercise!=="benchPress"));
  assert.equal(actual.progression.powerLevel,5);
  assert.equal(actual.complete,false);
  assert.equal(actual.potential.calibrated,false);
  assert.equal(actual.potential.progression,null);
});
