import test from "node:test";
import assert from "node:assert/strict";
import {
  compareStrength,
  comparisonContext,
  curveAtBodyweight,
  referencePosition,
  percentileLabel,
  previewStrength,
  STRENGTH_REFERENCES as DATA,
  LB_PER_KG,
} from "../src/lib/strength-comparison.mjs";
import { normalizeProfile } from "../src/lib/profile.mjs";
import { strength, dashboard } from "../src/lib/scoring.mjs";
const ids = ["backSquat", "benchPress", "deadlift"];
const records = (kg) =>
  Object.fromEntries(ids.map((id, i) => [id, { weight: kg[i] * LB_PER_KG }]));
const male80 = {
  comparisonMode: "relative",
  referenceCategory: "M",
  bodyweightKg: 80,
};
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} ≈ ${b}`);

test("source snapshot has traceable licenses, sample counts and ordered curves", () => {
  assert.equal(DATA.hardy.license, "CC BY 4.0");
  assert.equal(DATA.hardy.lifts.benchPress.n, 6500);
  assert.equal(DATA.openpowerlifting.license, "Public domain");
  assert.equal(DATA.openpowerlifting.absolute.backSquat.n, 242453);
  assert.match(DATA.openpowerlifting.sha256, /^[0-9a-f]{64}$/);
  assert.match(DATA.openpowerlifting.file, /b8b9bf6e/);
  const curves = [
    ...Object.values(DATA.hardy.lifts),
    ...Object.values(DATA.openpowerlifting.absolute),
  ];
  for (const categories of Object.values(DATA.openpowerlifting.categories))
    for (const rows of Object.values(categories)) curves.push(...rows);
  for (const lift of Object.values(DATA.strengthlog.lifts))
    for (const category of Object.values(lift.categories))
      curves.push(...category.rows);
  for (const curve of curves) {
    assert.ok(
      curve.kg.every(
        (v, i, a) => Number.isFinite(v) && v > 0 && (!i || a[i - 1] < v),
      ),
    );
    if (curve.n) assert.ok(curve.n >= 200);
  }
});
test("public Hardy medians reproduce P50 for gym lifters without inventing a pooled percentile", () => {
  const c = compareStrength(records([93.3, 77.4, 110.5]));
  for (const lift of c.lifts) near(lift.community.percentile, 50);
  assert.equal(c.communitySource, "Hardy");
  assert.equal(c.context.mode, "absolute");
  assert.ok(c.score < 50);
  assert.equal(c.percentile, undefined);
  near(
    c.score,
    c.lifts.reduce(
      (sum, l) => sum + (l.community.index + l.competition.index) / 2,
      0,
    ) / 3,
  );
});
test("published 80 kg male StrengthLog medians reproduce P50", () => {
  const c = compareStrength(records([112, 90, 142]), male80);
  assert.equal(c.communitySource, "StrengthLog");
  for (const lift of c.lifts) near(lift.community.percentile, 50);
  assert.ok(c.lifts.every((l) => l.competitionSampleRange[0] >= 200));
});
test("bodyweight curves interpolate and reject unsupported extrapolation", () => {
  const rows = DATA.strengthlog.lifts.benchPress.categories.M.rows;
  assert.equal(curveAtBodyweight(rows, 82.5).kg[2], 93);
  assert.throws(() => curveAtBodyweight(rows, 49), RangeError);
  assert.throws(() => curveAtBodyweight(rows, 141), RangeError);
  const c = compareStrength(records([67, 42, 81]), {
    ...male80,
    referenceCategory: "F",
    bodyweightKg: 60,
  });
  for (const l of c.lifts) near(l.community.percentile, 50);
});
test("OPL best-per-lifter median reproduces competition P50", () => {
  const c = compareStrength(
    records(ids.map((id) => DATA.openpowerlifting.absolute[id].kg[4])),
  );
  for (const l of c.lifts) near(l.competition.percentile, 50);
});
test("published tails show bounds, with continuous game growth on either side", () => {
  const curve = DATA.hardy.lifts.benchPress.kg,
    ps = DATA.hardy.percentiles;
  assert.equal(percentileLabel(referencePosition(1, curve, ps)), "Below P10");
  assert.equal(percentileLabel(referencePosition(200, curve, ps)), "Above P99");
  assert.equal(referencePosition(200, curve, ps).percentile, null);
  for (const w of curve) {
    const a = referencePosition(w - 1e-6, curve, ps),
      b = referencePosition(w + 1e-6, curve, ps);
    assert.ok(b.index > a.index);
    assert.ok(b.index - a.index < 0.001);
  }
  const elite = referencePosition(
    1000,
    DATA.openpowerlifting.absolute.benchPress.kg,
    DATA.openpowerlifting.percentiles,
    { competition: true },
  );
  assert.ok(elite.index > 100);
  assert.equal(elite.percentile, null);
  assert.equal(percentileLabel(elite), "Above P99.9");
});
test("every positive PR grows power across both reference modes, including the elite tail", () => {
  for (const profile of [
    {},
    male80,
    { ...male80, referenceCategory: "F", bodyweightKg: 65 },
  ]) {
    for (let n = 1; n <= 400; n += 5) {
      const r = records([n, n * 0.7, n * 1.2]);
      const current = compareStrength(r, profile).progression;
      for (const id of ids)
        assert.ok(
          previewStrength(r, profile, id, 0.1).powerLevel > current.powerLevel,
        );
    }
  }
});
test("same total with different lift balance gets different evidence-based scores", () => {
  const a = compareStrength(records([150, 100, 180]));
  const b = compareStrength(records([130, 120, 180]));
  assert.notEqual(a.score, b.score);
  const original = records([150, 100, 180]);
  const before = structuredClone(original);
  assert.notEqual(
    previewStrength(original, male80, "benchPress", 10).score,
    previewStrength(original, male80, "deadlift", 10).score,
  );
  assert.deepEqual(original, before);
});
test("missing profile or unsupported references fall back explicitly without guessing", () => {
  const normalized = normalizeProfile({ name: "Nova" });
  assert.equal(normalized.referenceCategory, "");
  assert.equal(normalized.bodyweightKg, null);
  for (const profile of [
    { comparisonMode: "relative" },
    { ...male80, bodyweightKg: 49 },
    { ...male80, bodyweightKg: 141 },
    { ...male80, referenceCategory: "Mx" },
    { ...male80, bodyweightKg: NaN },
  ]) {
    const c = comparisonContext(profile);
    assert.equal(c.mode, "absolute");
    assert.equal(c.fallback, true);
  }
  for (const kg of [50, 140])
    assert.equal(
      comparisonContext({ ...male80, bodyweightKg: kg }).mode,
      "relative",
    );
  const r = records([100, 80, 120]);
  delete r.benchPress;
  assert.equal(compareStrength(r, male80).progression.powerLevel, 5);
  assert.equal(compareStrength(r, male80).lifts[1].community, null);
});
test("profile cosmetics and display units cannot change comparison power", () => {
  const r = records([150, 100, 180]);
  assert.deepEqual(
    compareStrength(r, male80),
    compareStrength(r, { ...male80, name: "Other", aura: "blue", unit: "kg" }),
  );
  const canonical = normalizeProfile({
    ...male80,
    bodyweightKg: 176.369809744 / LB_PER_KG,
  });
  near(compareStrength(r, canonical).score, compareStrength(r, male80).score);
});
test("an estimated transformation stays unearned, and uses the selected public reference", () => {
  const events = Object.entries({
    backSquat: 350,
    benchPress: 300,
    deadlift: 395,
  }).map(([exercise, weight]) => ({
    id: exercise,
    date: "2026-09-09",
    source: "bulgarian",
    exercise,
    weight,
    unit: "lb",
    singleCompleted: true,
    success: true,
    outcome: "completed",
    countsDay: true,
    repSet: {
      weight: exercise === "deadlift" ? 340 : weight - 50,
      reps: exercise === "deadlift" ? 10 : 5,
    },
  }));
  const s = strength(events);
  assert.equal(s.progression.transformation.name, "Divine Awakening");
  assert.equal(s.potential.progression.transformation.name, "Azure Ascension");
  assert.ok(
    !s.progression.unlockedTransformations.some(
      (f) => f.name === "Azure Ascension",
    ),
  );
  const adjusted = strength(events, male80);
  assert.notEqual(
    adjusted.potential.progression.score,
    s.potential.progression.score,
  );
  const projected = Object.fromEntries(
    adjusted.potential.lifts.map((l) => [l.id, { weight: l.projected }]),
  );
  near(
    adjusted.potential.progression.score,
    compareStrength(projected, male80).score,
  );
  const without = events.map(({ repSet, ...event }) => event);
  assert.deepEqual(strength(without, male80).progression, adjusted.progression);
  assert.deepEqual(
    dashboard({ bulgarian: { events } }, "2026-09-09", 4, male80).consistency,
    dashboard({ bulgarian: { events } }, "2026-09-09", 4).consistency,
  );
});
