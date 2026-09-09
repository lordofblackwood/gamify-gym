import { LIFTS } from "../../public/shared/history.mjs";
import { compareStrength } from "./strength-comparison.mjs";

// Epley: load × (1 + reps / 30). Used only as a hypothetical estimate.
// Formula reference: https://www.jssm.org/volume22/iss3/cap/jssm-22-436.pdf
// 2–10 reps is this app's evidence limit; set count never multiplies reps.
export function estimatedOneRepMax(weight, reps) {
  if (
    !Number.isFinite(weight) ||
    weight <= 0 ||
    !Number.isInteger(reps) ||
    reps < 2 ||
    reps > 10
  )
    return null;
  const estimate = weight * (1 + reps / 30);
  return Number.isFinite(estimate) ? estimate : null;
}

export function unrealizedPotential(events, actualRecords, profile = {}) {
  const estimates = Object.fromEntries(
    Object.keys(LIFTS).map((id) => [id, null]),
  );
  for (const event of events) {
    if (
      event.source !== "bulgarian" ||
      !event.success ||
      event.outcome !== "completed" ||
      !event.singleCompleted ||
      event.unit !== "lb" ||
      !Object.hasOwn(estimates, event.exercise)
    )
      continue;
    const estimated = estimatedOneRepMax(
      event.repSet?.weight,
      event.repSet?.reps,
    );
    const previous = estimates[event.exercise];
    if (
      estimated !== null &&
      (!previous ||
        estimated > previous.estimated ||
        (estimated === previous.estimated && event.date > previous.date))
    ) {
      estimates[event.exercise] = {
        estimated,
        weight: event.repSet.weight,
        reps: event.repSet.reps,
        date: event.date,
        eventId: event.id,
      };
    }
  }
  const lifts = Object.keys(LIFTS).map((id) => {
    const actual = actualRecords[id]?.weight ?? null;
    const evidence = estimates[id];
    const projected =
      actual === null ? null : Math.max(actual, evidence?.estimated ?? actual);
    return {
      id,
      name: LIFTS[id],
      actual,
      evidence,
      projected,
      gap: actual === null ? 0 : projected - actual,
    };
  });
  const calibrated = lifts.every((lift) => lift.actual !== null);
  const total = calibrated
    ? lifts.reduce((sum, lift) => sum + lift.projected, 0)
    : null;
  const gap = lifts.reduce((sum, lift) => sum + lift.gap, 0);
  return {
    lifts,
    total,
    gap,
    calibrated,
    hasEvidence: lifts.some((lift) => lift.evidence),
    hasPotential: gap > 1e-8,
    // Potential never replaces the actual score, records or unlocked forms.
    progression:
      calibrated && gap > 1e-8
        ? compareStrength(
            Object.fromEntries(
              lifts.map((lift) => [lift.id, { weight: lift.projected }]),
            ),
            profile,
          ).progression
        : null,
  };
}
