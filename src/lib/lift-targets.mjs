import {
  comparisonCurves,
  compareLiftPounds,
  LB_PER_KG,
} from "./strength-comparison.mjs";
import { scoreForPower } from "./progression.mjs";

export const LIFT_LABELS = {
  backSquat: "Squat",
  benchPress: "Bench",
  deadlift: "Deadlift",
};
export const TARGET_STEPS = { lb: 2.5, kg: 1 };

// Invert the frozen scoring curve for one lift, with the other singles fixed.
// Targets are hypothetical calculations; this module cannot save workout data.
export function liftTargets(strength, powerLevel, unit = "lb") {
  if (!Number.isFinite(powerLevel) || powerLevel < 5)
    return { status: "unavailable", routes: [] };
  if (!strength.reference.complete) return { status: "incomplete", routes: [] };
  if (strength.progression.powerLevel * (1 + 1e-12) >= powerLevel)
    return { status: "reached", routes: [] };
  const targetScore = scoreForPower(powerLevel);
  const factor = unit === "kg" ? LB_PER_KG : 1;
  const step = TARGET_STEPS[unit] || TARGET_STEPS.lb;
  const curvesByLift = Object.fromEntries(
    strength.reference.lifts.map((lift) => [
      lift.id,
      comparisonCurves(lift.id, strength.reference.context),
    ]),
  );
  const routes = strength.reference.lifts
    .map((lift) => {
      const others = strength.reference.lifts
        .filter((other) => other.id !== lift.id)
        .reduce((sum, other) => sum + other.score, 0);
      const needed = targetScore * 3 - others;
      const curves = curvesByLift[lift.id];
      const scoreAt = (pounds) => compareLiftPounds(pounds, curves).score;
      let low = lift.weightLb,
        high = Math.max(low + 1, low * 1.1);
      for (let i = 0; i < 64 && scoreAt(high) < needed; i++) high *= 2;
      if (!Number.isFinite(high) || scoreAt(high) < needed) return null;
      for (let i = 0; i < 60; i++) {
        const mid = (low + high) / 2;
        if (scoreAt(mid) >= needed) high = mid;
        else low = mid;
      }
      // Round upward to a displayed load that really crosses the benchmark.
      // The correction also handles an exact grid boundary represented as x + ε.
      let displayTarget = Math.ceil(high / factor / step) * step;
      if (
        displayTarget > step &&
        (displayTarget - step) * factor > lift.weightLb &&
        scoreAt((displayTarget - step) * factor) >= needed
      )
        displayTarget -= step;
      while (scoreAt(displayTarget * factor) < needed) displayTarget += step;
      const targetLb = displayTarget * factor;
      return {
        id: lift.id,
        name: LIFT_LABELS[lift.id],
        currentLb: lift.weightLb,
        targetLb,
        deltaLb: targetLb - lift.weightLb,
        totalLb: strength.total + targetLb - lift.weightLb,
        unit,
        step,
        targetScore,
      };
    })
    .filter(Boolean);
  // A distant milestone can be reached with far less total weight by improving
  // all three lifts. Preserve the lifter's current balance, then round each up.
  const scoreAtScale = (scale) =>
    strength.reference.lifts.reduce(
      (sum, lift) =>
        sum +
        compareLiftPounds(lift.weightLb * scale, curvesByLift[lift.id]).score,
      0,
    ) / 3;
  let lowScale = 1,
    highScale = 2;
  for (let i = 0; i < 64 && scoreAtScale(highScale) < targetScore; i++)
    highScale *= 2;
  let balanced = null;
  if (Number.isFinite(highScale) && scoreAtScale(highScale) >= targetScore) {
    for (let i = 0; i < 60; i++) {
      const mid = (lowScale + highScale) / 2;
      if (scoreAtScale(mid) >= targetScore) highScale = mid;
      else lowScale = mid;
    }
    const lifts = strength.reference.lifts.map((lift) => {
      const targetLb =
        Math.ceil((lift.weightLb * highScale) / factor / step) * step * factor;
      return {
        id: lift.id,
        name: LIFT_LABELS[lift.id],
        currentLb: lift.weightLb,
        targetLb,
        deltaLb: targetLb - lift.weightLb,
      };
    });
    const totalLb = lifts.reduce((sum, lift) => sum + lift.targetLb, 0);
    balanced = {
      lifts,
      totalLb,
      deltaLb: totalLb - strength.total,
      scale: highScale,
    };
  }
  const minSingleIncrease = Math.min(...routes.map((route) => route.deltaLb));
  return {
    status: routes.length ? "available" : "unavailable",
    routes,
    balanced,
    preferBalanced: Boolean(
      balanced && balanced.deltaLb < minSingleIncrease - 1e-7,
    ),
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
  if (result.status === "incomplete")
    return "Record all three singles to see your target";
  if (result.preferBalanced)
    return `${targetWeight(result.balanced.totalLb, unit, { upward: true })} ${unit} total across all three lifts`;
  const route = shortestRoute(result);
  return route
    ? `${targetWeight(route.totalLb, unit, { upward: true })} ${unit} total via ${route.name.toLowerCase()} ${targetWeight(route.targetLb, unit)} ${unit}`
    : "Target unavailable";
}
