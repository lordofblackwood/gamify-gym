import { STRENGTH_REFERENCES as DATA } from "../data/strength-references.mjs";
import { LIFTS } from "../../public/shared/history.mjs";
import { progressionFromScore } from "./progression.mjs";
export { STRENGTH_REFERENCES } from "../data/strength-references.mjs";
export const LB_PER_KG = 2.2046226218;
export const CATEGORY_RANGES = { M: [50, 140], F: [40, 120] };

export function comparisonContext(profile = {}) {
  const category = Object.hasOwn(CATEGORY_RANGES, profile?.referenceCategory)
    ? profile.referenceCategory
    : null;
  const bodyweightKg =
    Number.isFinite(profile?.bodyweightKg) && profile.bodyweightKg > 0
      ? profile.bodyweightKg
      : null;
  const requested =
    profile?.comparisonMode === "relative" ? "relative" : "absolute";
  const range = CATEGORY_RANGES[category];
  const supported =
    !!range &&
    bodyweightKg !== null &&
    bodyweightKg >= range[0] &&
    bodyweightKg <= range[1];
  const mode = requested === "relative" && supported ? "relative" : "absolute";
  return {
    requested,
    mode,
    category,
    bodyweightKg,
    fallback: requested === "relative" && !supported,
    label:
      mode === "relative"
        ? `${category === "M" ? "Male" : "Female"} reference · by bodyweight`
        : "Absolute strength · all categories",
    version: DATA.version,
  };
}

// Published percentiles are sparse landmarks, not an exact empirical CDF.
// Interpolate inside them. Outside them, show a bound, never an invented percentile.
export function referencePosition(
  valueKg,
  weights,
  percentiles,
  { competition = false } = {},
) {
  const value = Number.isFinite(valueKg) ? Math.max(0, valueKg) : 0;
  const first = weights[0],
    last = weights.at(-1),
    low = percentiles[0],
    high = percentiles.at(-1);
  let index,
    region = "within";
  if (value < first) {
    index = (value / first) * low;
    region = "below";
  } else if (value > last) {
    const slope = (high - percentiles.at(-2)) / (last - weights.at(-2));
    const extra = (value - last) * slope;
    // Community contribution approaches 100. Competition overflow keeps the
    // fantasy ladder continuous beyond the observed tail. Neither is a percentile.
    index = competition
      ? high + extra
      : high + (100 - high) * -Math.expm1(-extra / (100 - high));
    region = "above";
  } else {
    let upper = weights.findIndex((w) => w > value);
    if (upper === -1) index = high;
    else if (upper === 0) index = low;
    else {
      const lower = upper - 1;
      index =
        percentiles[lower] +
        ((value - weights[lower]) / (weights[upper] - weights[lower])) *
          (percentiles[upper] - percentiles[lower]);
    }
  }
  return {
    index,
    region,
    percentile: region === "within" ? index : null,
    bound: region === "below" ? low : high,
  };
}

export function percentileLabel(position) {
  if (!position) return "Awaiting a single";
  if (position.region === "below") return `Below P${position.bound}`;
  if (position.region === "above") return `Above P${position.bound}`;
  return `≈ P${Number(position.percentile.toFixed(1))}`;
}

export function curveAtBodyweight(rows, bodyweightKg) {
  if (
    bodyweightKg < rows[0].bodyweightKg ||
    bodyweightKg > rows.at(-1).bodyweightKg
  )
    throw new RangeError(
      "Bodyweight is outside the published comparison range",
    );
  const exact = rows.find((row) => row.bodyweightKg === bodyweightKg);
  if (exact)
    return { kg: exact.kg, sampleRange: exact.n ? [exact.n, exact.n] : null };
  const upper = rows.findIndex((row) => row.bodyweightKg > bodyweightKg);
  const a = rows[upper - 1],
    b = rows[upper];
  const f = (bodyweightKg - a.bodyweightKg) / (b.bodyweightKg - a.bodyweightKg);
  return {
    kg: a.kg.map((v, i) => v + (b.kg[i] - v) * f),
    sampleRange: a.n ? [Math.min(a.n, b.n), Math.max(a.n, b.n)] : null,
  };
}

export function compareStrength(records, profile = {}) {
  const context = comparisonContext(profile);
  const lifts = Object.keys(LIFTS).map((id) => {
    const weightLb = records[id]?.weight;
    const kg =
      Number.isFinite(weightLb) && weightLb > 0 ? weightLb / LB_PER_KG : null;
    let community, competition, communityN;
    if (context.mode === "relative") {
      const published = DATA.strengthlog.lifts[id].categories[context.category];
      community = curveAtBodyweight(published.rows, context.bodyweightKg);
      communityN = published.n;
      competition = curveAtBodyweight(
        DATA.openpowerlifting.categories[context.category][id],
        context.bodyweightKg,
      );
    } else {
      community = DATA.hardy.lifts[id];
      communityN = community.n;
      competition = {
        ...DATA.openpowerlifting.absolute[id],
        sampleRange: [
          DATA.openpowerlifting.absolute[id].n,
          DATA.openpowerlifting.absolute[id].n,
        ],
      };
    }
    const communityResult =
      kg === null
        ? null
        : referencePosition(
            kg,
            community.kg,
            context.mode === "relative"
              ? DATA.strengthlog.percentiles
              : DATA.hardy.percentiles,
          );
    const competitionResult =
      kg === null
        ? null
        : referencePosition(
            kg,
            competition.kg,
            DATA.openpowerlifting.percentiles,
            { competition: true },
          );
    return {
      id,
      name: LIFTS[id],
      weightLb: kg === null ? null : weightLb,
      kg,
      community: communityResult,
      competition: competitionResult,
      communityN,
      competitionSampleRange: competition.sampleRange,
      score:
        kg === null
          ? null
          : (communityResult.index + competitionResult.index) / 2,
    };
  });
  const complete = lifts.every((lift) => lift.score !== null);
  const score = complete
    ? lifts.reduce((sum, lift) => sum + lift.score, 0) / 3
    : 0;
  return {
    context,
    lifts,
    complete,
    score,
    communitySource: context.mode === "relative" ? "StrengthLog" : "Hardy",
    progression: progressionFromScore(score, { calibrated: complete }),
  };
}

export function previewStrength(records, profile, id, increaseLb) {
  const next = { ...records };
  if (
    Object.hasOwn(LIFTS, id) &&
    records[id] &&
    Number.isFinite(increaseLb) &&
    increaseLb >= 0
  )
    next[id] = { ...records[id], weight: records[id].weight + increaseLb };
  return compareStrength(next, profile).progression;
}
