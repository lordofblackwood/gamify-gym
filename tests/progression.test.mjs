import test from "node:test";
import assert from "node:assert/strict";
import {
  BENCHMARKS,
  BENCHMARK_BY_ID as B,
  TRANSFORMATIONS,
  POWER_ANCHORS,
  POWER_BANDS,
  benchmarkPosition,
  progressionFromScore,
  powerFromScore,
  scoreForPower,
  powerLabel,
  exactPowerLabel,
  findBenchmarks,
} from "../src/lib/progression.mjs";
import { SOURCES, TIERS } from "../src/data/benchmarks.mjs";
import { normalizeProfile, profileInitials } from "../src/lib/profile.mjs";
const close = (a, b) =>
  assert.ok(
    Math.abs(a - b) <= Math.max(1e-7, Math.abs(b) * 1e-10),
    `${a} ≈ ${b}`,
  );
test("central dataset covers early DB through cosmic authority with stable IDs and evidence", () => {
  assert.ok(BENCHMARKS.length >= 150);
  assert.equal(new Set(BENCHMARKS.map((b) => b.id)).size, BENCHMARKS.length);
  assert.equal(BENCHMARKS[0].id, "farmer");
  assert.equal(BENCHMARKS[0].powerLevel, 5);
  assert.equal(BENCHMARKS.at(-1).id, "zeno");
  for (const b of BENCHMARKS) {
    assert.ok(Number.isFinite(b.powerLevel) && b.powerLevel >= 5);
    assert.ok(TIERS.some((t) => t.id === b.tier));
    assert.ok(b.description && b.character && b.era && b.form);
    if (b.canonicalPowerLevelKnown)
      assert.ok(
        SOURCES[b.sourceId] && ["stated", "guide"].includes(b.powerLevelKind),
      );
  }
  assert.equal(B.zeno.canonicalPowerLevelKnown, false);
  assert.equal(B.zeno.powerLevelKind, "symbolic");
  assert.match(B.zeno.description, /authority/);
});
test("landmark order respects major story outcomes without mixing identities", () => {
  for (const path of [
    [
      "farmer",
      "goku-kid",
      "goku-king-kai",
      "vegeta-saiyan",
      "ginyu",
      "frieza-first",
      "frieza-third",
      "goku-namek-recovered",
      "frieza-full",
      "goku-ssj-namek",
    ],
    [
      "cell-imperfect",
      "cell-semi",
      "cell-perfect",
      "cell-super-perfect",
      "gohan-ssj2",
    ],
    ["buu-kid", "buu-super", "buuhan", "vegito-super"],
    ["broly-base", "broly-wrathful", "broly-ssj", "broly-full", "gogeta-blue"],
    [
      "goku-god",
      "goku-blue-rf",
      "goku-blue-kk20",
      "goku-ui-sign",
      "goku-mui",
      "frieza-black",
      "beerus",
      "whis",
      "grand-priest",
      "zeno",
    ],
  ])
    path
      .slice(1)
      .forEach((id, i) =>
        assert.ok(
          B[path[i]].powerLevel < B[id].powerLevel,
          `${path[i]} precedes ${id}`,
        ),
      );
});
test("every anchor is exact, and its inverse recovers the strength score", () => {
  for (const a of POWER_ANCHORS) {
    assert.equal(powerFromScore(a.score), a.power);
    close(scoreForPower(a.power), a.score);
  }
});
test("power grows continuously across every anchor, including the final milestone", () => {
  let previous = 0;
  for (let score = 0; score <= 150; score += 0.025) {
    const power = powerFromScore(score);
    assert.ok(power > previous);
    close(scoreForPower(power), score);
    previous = power;
  }
  for (const a of POWER_ANCHORS.slice(1)) {
    assert.ok(powerFromScore(a.score - 0.00001) < a.power);
    assert.ok(powerFromScore(a.score + 0.00001) > a.power);
  }
});
test("every band has finite progress and exact boundary promotion", () => {
  for (const band of POWER_BANDS) {
    const at = benchmarkPosition(band.powerLevel);
    assert.ok(at.comparable.some((b) => b.id === band.benchmarks[0].id));
    assert.equal(at.progress, at.isMax ? 100 : 0);
    if (band.powerLevel > 5) {
      const before = benchmarkPosition(band.powerLevel * (1 - 1e-7));
      assert.ok(before.current.powerLevel < band.powerLevel);
    }
  }
});
test("intermediate progress is continuous in strength score, not just the named rank", () => {
  const a = scoreForPower(3000000),
    b = scoreForPower(4000000);
  const p = progressionFromScore(a + (b - a) * 0.82);
  assert.equal(p.current.id, "goku-namek-recovered");
  close(p.progress, 82);
  assert.ok(p.powerLevel > 3000000 && p.powerLevel < 4000000);
  assert.equal(p.next.id, "frieza-final-restrained");
  assert.ok(progressionFromScore(a + (b - a) * 0.83).powerLevel > p.powerLevel);
});
test("tied fighters share a band and never become each other’s next benchmark", () => {
  const p = benchmarkPosition(40000);
  assert.deepEqual(
    p.comparable.map((b) => b.id),
    ["recoome", "burter", "jeice"],
  );
  assert.equal(p.next.id, "nail");
  assert.ok(p.previous.powerLevel < 40000);
  assert.equal(p.progress, 0);
  const angels = benchmarkPosition(B.whis.powerLevel);
  assert.ok(angels.comparable.some((b) => b.id === "vados"));
  assert.equal(angels.next.id, "grand-priest");
});
test("incomplete lift data remains an explicit starting profile", () => {
  const p = progressionFromScore(1800, { calibrated: false });
  assert.equal(p.powerLevel, 5);
  assert.equal(p.current.id, "farmer");
  assert.equal(p.transformation.id, "base");
  assert.equal(p.calibrated, false);
  assert.equal(p.progress, 0);
});
test("personal transformations advance separately from benchmark names", () => {
  assert.equal(
    progressionFromScore(30).transformation.name,
    "Crimson Drive XX",
  );
  assert.equal(
    progressionFromScore(40).transformation.name,
    "Radiant Ascension I",
  );
  for (const f of TRANSFORMATIONS)
    assert.ok(
      !["Goku", "Vegeta", "Frieza", "Gohan", "Piccolo", "Zeno"].some((name) =>
        f.name.includes(name),
      ),
    );
  TRANSFORMATIONS.slice(1).forEach((f, i) =>
    assert.ok(f.powerLevel > TRANSFORMATIONS[i].powerLevel),
  );
});
test("summit has no fabricated next opponent but allows further numerical growth", () => {
  const p = progressionFromScore(100),
    after = progressionFromScore(101);
  assert.equal(p.current.id, "zeno");
  assert.equal(p.previous.id, "grand-priest");
  assert.equal(p.next, null);
  assert.equal(p.progress, 100);
  assert.ok(after.powerLevel > p.powerLevel);
  assert.equal(after.scoreToNext, 0);
});
test("invalid and negative scores are safely bounded at the starting power", () => {
  for (const v of [NaN, Infinity, -100, undefined, null])
    assert.equal(powerFromScore(v), 5);
});
test("large power values are readable and never compact to zero", () => {
  assert.equal(powerLabel(3000000), "3,000,000");
  assert.notEqual(powerLabel(1e22, { compact: true }), "0");
  assert.match(powerLabel(1e22), /10\^22/);
  assert.equal(exactPowerLabel(1e22), "10,000,000,000,000,000,000,000");
});
test("search includes character versions, forms and eras and filters reached states", () => {
  assert.ok(findBenchmarks({ query: "Goku" }).length >= 15);
  assert.ok(findBenchmarks({ query: "Namek" }).length >= 20);
  assert.ok(
    findBenchmarks({ query: "Ultra Ego" }).some((b) => b.id === "vegeta-ego"),
  );
  assert.ok(
    findBenchmarks({ state: "reached", powerLevel: 5 }).every(
      (b) => b.powerLevel <= 5,
    ),
  );
  assert.equal(findBenchmarks({ query: "unknownxyz" }).length, 0);
});
test("profile normalization migrates absent data without using benchmark identities", () => {
  assert.deepEqual(normalizeProfile(), {
    name: "Your fighter",
    aura: "#d7fb79",
    avatar: "orbit",
    comparisonMode: "absolute",
    referenceCategory: "",
    bodyweightKg: null,
  });
  assert.equal(normalizeProfile({ name: "  Nova  " }).name, "Nova");
  assert.equal(normalizeProfile({ name: "x".repeat(50) }).name.length, 32);
  assert.equal(profileInitials("Nova Prime"), "NP");
  assert.equal(
    normalizeProfile({ aura: "url(evil)", avatar: "goku" }).avatar,
    "orbit",
  );
});
