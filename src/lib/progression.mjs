import {
  BENCHMARKS,
  BENCHMARK_BY_ID,
  SCALE_VERSION,
} from "../data/benchmarks.mjs";
import { TRANSFORMATIONS } from "../data/transformations.mjs";
import { POWER_CALIBRATION } from "../data/power-calibration.mjs";
export { BENCHMARKS, BENCHMARK_BY_ID, SCALE_VERSION, TRANSFORMATIONS };

// Reference score blends community and competition comparisons, equally per lift.
// The final form is anchored to American raw record performance. Percentile
// landmarks stay intact; the fantasy translation now reserves room for elites.
export const POWER_ANCHORS = POWER_CALIBRATION.anchors;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
function finiteNonnegative(value) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
export function powerFromScore(input) {
  const score = finiteNonnegative(input);
  const last = POWER_ANCHORS.at(-1);
  if (score >= last.score)
    return (
      last.power * Math.exp(Math.min(100, (score - last.score) / 5) * Math.LN10)
    );
  const upper = POWER_ANCHORS.findIndex((a) => a.score > score);
  const a = POWER_ANCHORS[upper - 1],
    b = POWER_ANCHORS[upper];
  if (score === a.score) return a.power;
  return Math.exp(
    Math.log(a.power) +
      ((score - a.score) / (b.score - a.score)) * Math.log(b.power / a.power),
  );
}
export function scoreForPower(input) {
  const power = Math.max(5, finiteNonnegative(input));
  const last = POWER_ANCHORS.at(-1);
  if (power >= last.power)
    return last.score + 5 * Math.log10(power / last.power);
  const upper = POWER_ANCHORS.findIndex((a) => a.power > power);
  const a = POWER_ANCHORS[upper - 1],
    b = POWER_ANCHORS[upper];
  if (power === a.power) return a.score;
  return (
    a.score +
    ((b.score - a.score) * Math.log(power / a.power)) /
      Math.log(b.power / a.power)
  );
}
export const POWER_BANDS = Object.freeze(
  [...new Set(BENCHMARKS.map((b) => b.powerLevel))].map((powerLevel) =>
    Object.freeze({
      powerLevel,
      benchmarks: Object.freeze(
        BENCHMARKS.filter((b) => b.powerLevel === powerLevel),
      ),
      score: scoreForPower(powerLevel),
    }),
  ),
);
export function benchmarkPosition(input) {
  const powerLevel = Math.max(5, finiteNonnegative(input));
  // Floating-point tolerance only repairs mathematical boundary noise.
  const index = POWER_BANDS.findLastIndex(
    (b) => b.powerLevel <= powerLevel * (1 + 1e-12),
  );
  const band = POWER_BANDS[Math.max(0, index)],
    previousBand = POWER_BANDS[index - 1] || null,
    nextBand = POWER_BANDS[index + 1] || null;
  const progress = nextBand
    ? clamp(
        ((scoreForPower(powerLevel) - band.score) /
          (nextBand.score - band.score)) *
          100,
        0,
        100,
      )
    : 100;
  return {
    powerLevel,
    current: band.benchmarks[0],
    previous: previousBand?.benchmarks[0] || null,
    next: nextBand?.benchmarks[0] || null,
    comparable: band.benchmarks,
    previousBenchmarks: previousBand?.benchmarks || [],
    nextBenchmarks: nextBand?.benchmarks || [],
    progress,
    bandIndex: index,
    bandCount: POWER_BANDS.length,
    isMax: !nextBand,
    surpassed: BENCHMARKS.filter((b) => b.powerLevel < band.powerLevel).length,
    reached: BENCHMARKS.filter((b) => b.powerLevel <= band.powerLevel).length,
    nextScore: nextBand?.score ?? null,
  };
}
export function progressionFromScore(input, { calibrated = true } = {}) {
  const score = calibrated ? finiteNonnegative(input) : 0;
  const position = benchmarkPosition(powerFromScore(score));
  const transformation = TRANSFORMATIONS.findLast(
    (f) => f.powerLevel <= position.powerLevel * (1 + 1e-12),
  );
  const nextTransformation =
    TRANSFORMATIONS[TRANSFORMATIONS.indexOf(transformation) + 1] || null;
  return {
    ...position,
    score,
    calibrated,
    transformation,
    nextTransformation,
    unlockedTransformations: TRANSFORMATIONS.filter(
      (f) => f.powerLevel <= position.powerLevel * (1 + 1e-12),
    ),
    scoreToNext:
      position.nextScore === null ? 0 : Math.max(0, position.nextScore - score),
    scaleVersion: SCALE_VERSION,
  };
}
export function powerLabel(value, { compact = false } = {}) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1e15)
    return value
      .toExponential(3)
      .replace(/\.?(0+)e/, "e")
      .replace("e+", " × 10^");
  if (compact && value >= 1e9)
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  return value.toLocaleString("en-US", {
    maximumFractionDigits: value < 10 ? 4 : value < 100 ? 2 : 0,
  });
}
export function exactPowerLabel(value) {
  return Number.isFinite(value)
    ? value.toLocaleString("en-US", {
        maximumFractionDigits: value < 100 ? 4 : 0,
        useGrouping: true,
      })
    : "—";
}
export function benchmarkEvidence(benchmark) {
  return (
    {
      stated: "Canon reading",
      guide: "Published guide",
      estimated: "App estimate",
      symbolic: "Symbolic milestone",
    }[benchmark.powerLevelKind] || "App estimate"
  );
}
export function findBenchmarks({
  query = "",
  tier = "all",
  state = "all",
  powerLevel = 5,
} = {}) {
  const needle = query.trim().toLocaleLowerCase();
  return BENCHMARKS.filter(
    (b) =>
      (tier === "all" || b.tier === tier) &&
      (state === "all" ||
        (state === "reached"
          ? b.powerLevel <= powerLevel
          : b.powerLevel > powerLevel)) &&
      (!needle ||
        `${b.character} ${b.form} ${b.era} ${b.displayName}`
          .toLocaleLowerCase()
          .includes(needle)),
  );
}
