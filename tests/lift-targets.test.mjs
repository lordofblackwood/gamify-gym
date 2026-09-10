import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { dashboard } from "../src/lib/scoring.mjs";
import { demoSnapshots } from "../src/lib/demo.mjs";
import { POWER_CALIBRATION } from "../src/data/power-calibration.mjs";
import { LIFT_RECORD_LIMITS } from "../src/data/lift-record-limits.mjs";
import {
  compareStrength,
  STRENGTH_REFERENCES,
} from "../src/lib/strength-comparison.mjs";
import { POWER_BANDS, TRANSFORMATIONS } from "../src/lib/progression.mjs";
import {
  liftTargets,
  targetSummary,
  targetWeight,
  recordTargetCaps,
  MAX_SINGLE_INCREASE,
} from "../src/lib/lift-targets.mjs";

const today = "2026-09-09";
const demo = (profile = {}) =>
  dashboard(demoSnapshots(today), today, 4, profile).strength;
const recordRoute = (s, route, delta = 0) => ({
  ...s.records,
  [route.id]: { ...s.records[route.id], weight: route.targetLb + delta },
});

test("the public reference data and power anchors stay frozen at the agreed September edition", () => {
  const hash = createHash("sha256")
    .update(
      JSON.stringify({
        data: STRENGTH_REFERENCES,
        calibration: POWER_CALIBRATION,
        limits: LIFT_RECORD_LIMITS,
      }),
    )
    .digest("hex");
  assert.equal(
    hash,
    "16183b681f116edc724d8c4daa4a0227b8dfbfea8668d1935b701c9268f97afa",
    "Changing the frozen reference needs an explicit user request",
  );
});
test("next benchmark shows the correct pounds and route-specific totals", () => {
  const s = demo(),
    result = liftTargets(s, s.progression.next.powerLevel);
  assert.deepEqual(
    result.routes.map((r) => [r.id, r.targetLb, r.deltaLb, r.totalLb]),
    [
      ["backSquat", 317.5, 2.5, 902.5],
      ["benchPress", 227.5, 2.5, 902.5],
      ["deadlift", 362.5, 2.5, 902.5],
    ],
  );
  assert.equal(targetSummary(result), "902.5 lb total via squat 317.5 lb");
});
test("every displayed target reaches its benchmark, and one load step below does not", () => {
  for (const profile of [
    {},
    { comparisonMode: "relative", referenceCategory: "M", bodyweightKg: 80 },
    { comparisonMode: "relative", referenceCategory: "F", bodyweightKg: 65 },
  ]) {
    const s = demo(profile);
    for (const unit of ["lb", "kg"]) {
      const powerValues = [
        ...new Set([
          ...POWER_BANDS.map((b) => b.powerLevel),
          ...TRANSFORMATIONS.map((f) => f.powerLevel),
        ]),
      ].filter((p) => p > s.progression.powerLevel);
      for (const power of powerValues) {
        const result = liftTargets(s, power, unit);
        const caps = recordTargetCaps(unit);
        if (result.status === "beyond-records") {
          const maximum = compareStrength(
            Object.fromEntries(
              Object.entries(caps).map(([id, cap]) => [
                id,
                {
                  weight: Math.max(s.records[id].weight, cap.capLb),
                },
              ]),
            ),
            profile,
          ).progression.powerLevel;
          assert.ok(maximum < power);
          assert.equal(result.balanced, null);
          assert.deepEqual(result.routes, []);
          continue;
        }
        assert.equal(result.status, "available");
        assert.ok(result.routes.length <= 3);
        const balancedRecords = Object.fromEntries(
          result.balanced.lifts.map((lift) => [
            lift.id,
            { weight: lift.targetLb },
          ]),
        );
        assert.ok(
          compareStrength(balancedRecords, profile).progression.powerLevel >=
            power * (1 - 1e-12),
        );
        assert.ok(result.balanced.lifts.some((lift) => lift.deltaLb > 0));
        assert.ok(result.balanced.lifts.every((lift) => lift.deltaLb >= 0));
        for (const lift of result.balanced.lifts)
          if (lift.deltaLb > 0)
            assert.ok(lift.targetLb <= caps[lift.id].recordLb);
        for (const route of result.routes) {
          const projected = compareStrength(
            recordRoute(s, route),
            profile,
          ).progression;
          assert.ok(projected.powerLevel >= power * (1 - 1e-12));
          const stepLb = unit === "kg" ? 2.2046226218 : 2.5;
          const below = compareStrength(
            recordRoute(s, route, -stepLb),
            profile,
          ).progression;
          assert.ok(below.powerLevel < power * (1 + 1e-12));
          assert.ok(route.deltaLb > 0);
          assert.ok(route.targetLb <= caps[route.id].recordLb);
          assert.ok(
            route.deltaLb <=
              Math.max(stepLb, route.currentLb * MAX_SINGLE_INCREASE) + 1e-9,
          );
        }
      }
    }
  }
});
test("distant goals use comparable lift strengths and never extrapolate an insane bench", () => {
  const s = demo();
  const p = TRANSFORMATIONS.find((f) => f.id === "super-saiyan").powerLevel;
  const result = liftTargets(s, p);
  assert.deepEqual(result.routes, []);
  assert.equal(result.preferBalanced, true);
  assert.deepEqual(
    result.balanced.lifts.map((lift) => lift.targetLb),
    [420, 285, 482.5],
  );
  const next = liftTargets(
    s,
    TRANSFORMATIONS.find((f) => f.id === "super-saiyan-2").powerLevel,
  );
  assert.deepEqual(
    next.balanced.lifts.map((lift) => lift.targetLb),
    [520, 345, 582.5],
  );
});
test("a strong bench is retained while weaker lifts catch up instead of scaling the bench again", () => {
  const snapshots = demoSnapshots(today);
  for (const event of snapshots.bulgarian.events)
    if (event.exercise === "benchPress") event.weight = 500;
  const s = dashboard(snapshots, today).strength;
  const power = TRANSFORMATIONS.find(
    (f) => f.id === "super-saiyan-2",
  ).powerLevel;
  const result = liftTargets(s, power);
  const bench = result.balanced.lifts.find((lift) => lift.id === "benchPress");
  assert.equal(bench.targetLb, 500);
  assert.equal(bench.deltaLb, 0);
  assert.ok(
    result.balanced.lifts
      .filter((lift) => lift.id !== "benchPress")
      .every((lift) => lift.deltaLb > 0),
  );
});
test("record ceilings round down in both units and impossible cosmic goals have no fake loads", () => {
  for (const unit of ["lb", "kg"]) {
    const caps = recordTargetCaps(unit);
    const stepLb = unit === "kg" ? 2.2046226218 : 2.5;
    for (const cap of Object.values(caps)) {
      assert.ok(cap.capLb <= cap.recordLb);
      assert.ok(cap.capLb + stepLb > cap.recordLb);
    }
    const result = liftTargets(demo(), 1e22, unit);
    assert.equal(result.status, "beyond-records");
    assert.equal(targetSummary(result), "Beyond American raw record limits");
    assert.equal(result.balanced, null);
    assert.deepEqual(result.routes, []);
  }
});
test("existing singles above a record ceiling remain proven without inventing higher goals", () => {
  const snapshots = demoSnapshots(today);
  for (const event of snapshots.bulgarian.events)
    if (event.exercise === "benchPress") event.weight = 800;
  const s = dashboard(snapshots, today).strength;
  const before = JSON.stringify(s.records);
  const result = liftTargets(s, TRANSFORMATIONS.at(-1).powerLevel);
  assert.equal(result.status, "available");
  const bench = result.balanced.lifts.find((lift) => lift.id === "benchPress");
  assert.equal(bench.targetLb, 800);
  assert.equal(bench.deltaLb, 0);
  assert.ok(!result.routes.some((route) => route.id === "benchPress"));
  assert.equal(JSON.stringify(s.records), before);
});
test("the last achievable goal reaches the record grid boundary without rounding past it", () => {
  for (const unit of ["lb", "kg"]) {
    const caps = recordTargetCaps(unit);
    const stepLb = unit === "kg" ? 2.2046226218 : 2.5;
    const snapshots = demoSnapshots(today);
    for (const event of snapshots.bulgarian.events)
      event.weight = caps[event.exercise].capLb - stepLb;
    const s = dashboard(snapshots, today).strength;
    const maximum = Object.fromEntries(
      Object.entries(caps).map(([id, cap]) => [id, { weight: cap.capLb }]),
    );
    const power = compareStrength(maximum).progression.powerLevel;
    const result = liftTargets(s, power, unit);
    assert.equal(result.status, "available");
    for (const lift of result.balanced.lifts) {
      assert.ok(Math.abs(lift.targetLb - caps[lift.id].capLb) < 1e-8);
      assert.ok(lift.targetLb <= caps[lift.id].recordLb);
    }
    const projected = Object.fromEntries(
      result.balanced.lifts.map((lift) => [lift.id, { weight: lift.targetLb }]),
    );
    assert.ok(
      compareStrength(projected).progression.powerLevel >= power * (1 - 1e-12),
    );
  }
});
test("distant transformations offer a balanced goal instead of requiring one implausibly large lift", () => {
  const s = demo();
  const result = liftTargets(
    s,
    TRANSFORMATIONS.find((f) => f.id === "blue-evolution").powerLevel,
  );
  assert.equal(result.preferBalanced, true);
  assert.ok(result.balanced.totalLb > 2100 && result.balanced.totalLb < 2400);
  assert.ok(
    result.balanced.deltaLb < Math.min(...result.routes.map((r) => r.deltaLb)),
  );
  assert.match(targetSummary(result), /lb total across all three lifts$/);
  assert.equal(
    liftTargets(s, s.progression.next.powerLevel).preferBalanced,
    false,
  );
});
test("profile-specific targets use the selected references, without mutating records", () => {
  const s = demo(),
    before = JSON.stringify(s);
  Object.values(s.records).forEach(Object.freeze);
  Object.freeze(s.records);
  const adjusted = demo({
    comparisonMode: "relative",
    referenceCategory: "M",
    bodyweightKg: 80,
  });
  const power = s.progression.next.powerLevel;
  const a = liftTargets(s, power),
    b = liftTargets(adjusted, power);
  assert.notDeepEqual(
    a.routes.map((r) => r.targetLb),
    b.routes.map((r) => r.targetLb),
  );
  assert.equal(JSON.stringify(s), before);
});
test("estimated 1RM never reduces earned lift targets", () => {
  const snapshots = demoSnapshots(today);
  const withEvidence = dashboard(snapshots, today).strength;
  const stripped = structuredClone(snapshots);
  for (const snapshot of Object.values(stripped))
    for (const event of snapshot.events) delete event.repSet;
  const without = dashboard(stripped, today).strength;
  assert.ok(withEvidence.potential.hasPotential);
  assert.deepEqual(
    liftTargets(withEvidence, withEvidence.progression.next.powerLevel),
    liftTargets(without, without.progression.next.powerLevel),
  );
});
test("reached, missing-record and invalid milestones never invent load requirements", () => {
  const s = demo();
  assert.equal(
    liftTargets(s, s.progression.current.powerLevel).status,
    "reached",
  );
  const missing = demoSnapshots(today);
  missing.bulgarian.events = missing.bulgarian.events.filter(
    (e) => e.exercise !== "deadlift",
  );
  assert.equal(
    liftTargets(dashboard(missing, today).strength, 1e6).status,
    "incomplete",
  );
  for (const power of [NaN, Infinity, -1])
    assert.equal(liftTargets(s, power).status, "unavailable");
  assert.equal(targetWeight(0.01, "lb", { upward: true }), "0.1");
});
test("equal-threshold Blue variants unlock together without an artificial intermediate step", () => {
  const forms = TRANSFORMATIONS.filter((f) => f.powerLevel === 160000000000000);
  assert.deepEqual(
    forms.map((f) => f.name),
    ["Super Saiyan Blue Kaioken ×20", "Super Saiyan Blue Evolution"],
  );
});
