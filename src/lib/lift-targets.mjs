import {
  comparisonCurves,
  compareLiftPounds,
  LB_PER_KG,
} from "./strength-comparison.mjs";
import { LIFT_RECORD_LIMITS } from "../data/lift-record-limits.mjs";
import { scoreForPower } from "./progression.mjs";

export const LIFT_LABELS = {
  backSquat: "Squat",
  benchPress: "Bench",
  deadlift: "Deadlift",
};
export const TARGET_STEPS = { lb: 2.5, kg: 1 };

// Only show a one-lift route for a nearby PR. This is a presentation limit,
// not a prescribed jump or a claim that 10% is achievable in one session.
export const MAX_SINGLE_INCREASE = 0.1;

export function recordTargetCaps(unit = "lb") {
  const factor = unit === "kg" ? LB_PER_KG : 1;
  const step = TARGET_STEPS[unit] || TARGET_STEPS.lb;
  return Object.fromEntries(
    Object.entries(LIFT_RECORD_LIMITS.records).map(([id, record]) => {
      const recordLb = record.kg * LB_PER_KG;
      // Round the ceiling DOWN, so rounding a goal up cannot exceed the record.
      const capLb = Math.floor(recordLb / factor / step) * step * factor;
      return [id, { ...record, recordLb, capLb }];
    }),
  );
}

// Find the first usable load increment reaching a score within a finite ceiling.
function loadForScore(scoreAt, needed, currentLb, capLb, stepLb) {
  if (scoreAt(currentLb) >= needed) return currentLb;
  if (currentLb >= capLb || scoreAt(capLb) < needed) return null;
  let low = Math.floor(currentLb / stepLb) + 1;
  let high = Math.round(capLb / stepLb);
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (scoreAt(mid * stepLb) >= needed) high = mid;
    else low = mid + 1;
  }
  return low * stepLb;
}

// Balance lift-specific reference scores, not the user's existing pound ratios.
// Proven lifts stay intact; only new goals are bounded by the record ceilings.
export function liftTargets(strength, powerLevel, unit = "lb") {
  if (!Number.isFinite(powerLevel) || powerLevel < 5)
    return { status: "unavailable", routes: [] };
  if (!strength.reference.complete) return { status: "incomplete", routes: [] };
  if (strength.progression.powerLevel * (1 + 1e-12) >= powerLevel)
    return { status: "reached", routes: [] };
  const targetScore = scoreForPower(powerLevel);
  const factor = unit === "kg" ? LB_PER_KG : 1;
  const step = TARGET_STEPS[unit] || TARGET_STEPS.lb;
  const stepLb = step * factor;
  const caps = recordTargetCaps(unit);
  const lifts = strength.reference.lifts.map((lift) => {
    const curves = comparisonCurves(lift.id, strength.reference.context);
    const scoreAt = (pounds) => compareLiftPounds(pounds, curves).score;
    const capLb = caps[lift.id].capLb;
    return {
      ...lift,
      scoreAt,
      capLb,
      maxScore: scoreAt(Math.max(lift.weightLb, capLb)),
    };
  });
  const maximumScore = lifts.reduce((sum, lift) => sum + lift.maxScore, 0) / 3;
  if (maximumScore < targetScore)
    return {
      status: "beyond-records",
      routes: [],
      balanced: null,
      caps,
      unit,
      step,
    };

  // Raise the weaker reference scores toward a shared level, preserving stronger
  // proven singles. A lift at its record ceiling stays there while others catch up.
  const scoreAtLevel = (level) =>
    lifts.reduce(
      (sum, lift) => sum + Math.max(lift.score, Math.min(lift.maxScore, level)),
      0,
    ) / 3;
  let low = Math.min(...lifts.map((lift) => lift.score));
  let high = Math.max(...lifts.map((lift) => lift.maxScore));
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (scoreAtLevel(mid) >= targetScore) high = mid;
    else low = mid;
  }
  const goals = lifts.map((lift) => {
    const needed = Math.max(lift.score, Math.min(lift.maxScore, high));
    const targetLb = loadForScore(
      lift.scoreAt,
      needed,
      lift.weightLb,
      lift.capLb,
      stepLb,
    );
    return {
      id: lift.id,
      name: LIFT_LABELS[lift.id],
      currentLb: lift.weightLb,
      targetLb,
      deltaLb: targetLb - lift.weightLb,
      capLb: lift.capLb,
    };
  });
  // Reject an invalid solution; never label capped loads as reaching a higher tier.
  if (
    goals.some((goal) => goal.targetLb === null) ||
    lifts.reduce((sum, lift, i) => sum + lift.scoreAt(goals[i].targetLb), 0) /
      3 <
      targetScore
  )
    return { status: "unavailable", routes: [] };
  const totalLb = goals.reduce((sum, lift) => sum + lift.targetLb, 0);
  const balanced = { lifts: goals, totalLb, deltaLb: totalLb - strength.total };
  const routes = lifts
    .map((lift) => {
      const others = lifts
        .filter((other) => other.id !== lift.id)
        .reduce((sum, other) => sum + other.score, 0);
      const targetLb = loadForScore(
        lift.scoreAt,
        targetScore * 3 - others,
        lift.weightLb,
        lift.capLb,
        stepLb,
      );
      if (
        targetLb === null ||
        targetLb - lift.weightLb >
          Math.max(stepLb, lift.weightLb * MAX_SINGLE_INCREASE) + 1e-9
      )
        return null;
      return {
        id: lift.id,
        name: LIFT_LABELS[lift.id],
        currentLb: lift.weightLb,
        targetLb,
        deltaLb: targetLb - lift.weightLb,
        totalLb: strength.total + targetLb - lift.weightLb,
        capLb: lift.capLb,
        unit,
        step,
        targetScore,
      };
    })
    .filter(Boolean);
  const minSingleIncrease = Math.min(...routes.map((route) => route.deltaLb));
  return {
    status: "available",
    routes,
    balanced,
    caps,
    unit,
    step,
    preferBalanced:
      !routes.length || balanced.deltaLb < minSingleIncrease - 1e-7,
  };
}

export function shortestRoute(result) {
  return [...result.routes].sort((a, b) => a.deltaLb - b.deltaLb)[0] || null;
}

// Keep displayed gaps conservative too; a fractional current record must not
// turn a small required increase into “+0 lb”.
export function targetWeight(pounds, unit = "lb", { upward = false } = {}) {
  const value = pounds / (unit === "kg" ? LB_PER_KG : 1);
  if (!Number.isFinite(value)) return "—";
  const rounded = upward ? Math.ceil((value - 1e-9) * 10) / 10 : value;
  return rounded.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

export function targetSummary(result, unit = "lb") {
  if (result.status === "reached") return "Reached with your proven singles";
  if (result.status === "beyond-records")
    return "Beyond American raw record limits";
  if (result.status === "incomplete")
    return "Record all three singles to see your target";
  if (result.preferBalanced)
    return `${targetWeight(result.balanced.totalLb, unit, { upward: true })} ${unit} total across all three lifts`;
  const route = shortestRoute(result);
  return route
    ? `${targetWeight(route.totalLb, unit, { upward: true })} ${unit} total via ${route.name.toLowerCase()} ${targetWeight(route.targetLb, unit)} ${unit}`
    : "Target unavailable";
}
