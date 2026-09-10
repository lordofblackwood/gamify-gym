import test from "node:test";
import assert from "node:assert/strict";
import { POWER_CALIBRATION as CAL } from "../src/data/power-calibration.mjs";
import { compareStrength, LB_PER_KG } from "../src/lib/strength-comparison.mjs";
import { TRANSFORMATIONS, SCALE_VERSION } from "../src/lib/progression.mjs";
import { liftTargets } from "../src/lib/lift-targets.mjs";
import { dashboard } from "../src/lib/scoring.mjs";
import { demoSnapshots } from "../src/lib/demo.mjs";

const records = (weights) =>
  Object.fromEntries(
    ["backSquat", "benchPress", "deadlift"].map((id, i) => [
      id,
      { weight: weights[i] },
    ]),
  );
const calibrationRecords = (totalLb) =>
  records(
    Object.values(CAL.record.liftsKg).map(
      (kg) => (kg * totalLb) / CAL.record.totalKg,
    ),
  );

test("record provenance and every frozen anchor reproduce the unchanged public comparison", () => {
  assert.equal(CAL.version, SCALE_VERSION);
  assert.equal(
    Object.values(CAL.record.liftsKg).reduce((a, b) => a + b),
    1153.5,
  );
  assert.equal(CAL.record.date, "2025-11-22");
  for (const [i, anchor] of CAL.anchors.entries()) {
    const actual = compareStrength(calibrationRecords(anchor.referenceTotalLb));
    assert.ok(Math.abs(actual.score - anchor.score) < 1e-10);
    if (i) assert.ok(anchor.score > CAL.anchors[i - 1].score);
  }
});

test("1,550 lb stays in the Super Saiyan tiers instead of granting endgame forms", () => {
  for (const weights of [
    [550, 350, 650],
    [600, 400, 550],
  ]) {
    const p = compareStrength(records(weights)).progression;
    assert.equal(p.transformation.id, "super-saiyan-2");
    assert.ok(
      !p.unlockedTransformations.some((f) => f.id === "super-saiyan-god"),
    );
  }
  // Vary lift balance widely: an extreme allocation must not bypass the harder scale.
  const divine = TRANSFORMATIONS.find(
    (f) => f.id === "super-saiyan-god",
  ).powerLevel;
  for (let squat = 50; squat < 1450; squat += 50)
    for (let bench = 50; bench < 1550 - squat; bench += 50)
      assert.ok(
        compareStrength(records([squat, bench, 1550 - squat - bench]))
          .progression.powerLevel < divine,
      );
});

test("the American raw record unlocks the final form; cosmic milestones remain beyond it", () => {
  const total = CAL.record.totalKg * LB_PER_KG;
  const below = compareStrength(calibrationRecords(total - 2.5)).progression;
  const at = compareStrength(calibrationRecords(total)).progression;
  const above = compareStrength(calibrationRecords(total + 2.5)).progression;
  assert.notEqual(below.transformation.id, "black-frieza");
  assert.equal(at.transformation.id, "black-frieza");
  assert.ok(above.powerLevel > at.powerLevel);
  assert.ok(at.next);
  assert.notEqual(at.current.id, "zeno");
});

test("all forms require more strength than the retired scale, with record-level final targets", () => {
  const oldScores = [
    0, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 85, 90, 95, 98, 99.5, 100,
  ];
  CAL.anchors.slice(1).forEach((a, i) => assert.ok(a.score > oldScores[i + 1]));
  const s = dashboard(demoSnapshots("2026-09-09"), "2026-09-09").strength;
  const f = TRANSFORMATIONS.at(-1);
  const target = liftTargets(s, f.powerLevel);
  assert.ok(target.preferBalanced);
  assert.ok(target.balanced.totalLb >= 2500 && target.balanced.totalLb < 2600);
  assert.deepEqual(target.routes, []);
});
