import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { dashboard } from "../src/lib/scoring.mjs";
import { demoSnapshots } from "../src/lib/demo.mjs";
import {
  compareStrength,
  STRENGTH_REFERENCES,
} from "../src/lib/strength-comparison.mjs";
import {
  POWER_ANCHORS,
  POWER_BANDS,
  TRANSFORMATIONS,
} from "../src/lib/progression.mjs";
import {
  liftTargets,
  targetSummary,
  targetWeight,
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
      JSON.stringify({ data: STRENGTH_REFERENCES, anchors: POWER_ANCHORS }),
    )
    .digest("hex");
  assert.equal(
    hash,
    "94f32d2e73246119da87cc28a8d9756a75d27304c86ed0efab4ee58cf341cf0b",
    "Changing the frozen reference needs an explicit user request",
  );
});
test("next benchmark shows the correct pounds and route-specific totals", () => {
  const s = demo(),
    result = liftTargets(s, s.progression.next.powerLevel);
  assert.deepEqual(
    result.routes.map((r) => [r.id, r.targetLb, r.deltaLb, r.totalLb]),
    [
      ["backSquat", 320, 5, 905],
      ["benchPress", 227.5, 2.5, 902.5],
      ["deadlift", 365, 5, 905],
    ],
  );
  assert.equal(targetSummary(result), "902.5 lb total via bench 227.5 lb");
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
        assert.equal(result.status, "available");
        assert.equal(result.routes.length, 3);
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
        assert.ok(result.balanced.lifts.every((lift) => lift.deltaLb > 0));
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
        }
      }
    }
  }
});
test("distant transformations offer a balanced goal instead of requiring one implausibly large lift", () => {
  const s = demo();
  const result = liftTargets(
    s,
    TRANSFORMATIONS.find((f) => f.id === "blue-evolution").powerLevel,
  );
  assert.equal(result.preferBalanced, true);
  assert.ok(result.balanced.totalLb < 2000);
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
