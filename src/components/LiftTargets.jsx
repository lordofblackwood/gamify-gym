import { useMemo } from "react";
import { liftTargets, targetWeight } from "../lib/lift-targets.mjs";

function TargetOptions({ routes, unit, showTotals = false }) {
  return (
    <div className="lift-target-options">
      {routes.map((route) => (
        <div className="lift-target-option" key={route.id}>
          <span className="target-lift-name">
            {route.name}
            <small>
              Now {targetWeight(route.currentLb, unit)} {unit}
            </small>
          </span>
          <span className="target-load">
            <strong>
              {targetWeight(route.targetLb, unit)} <small>{unit}</small>
            </strong>
            <span>
              +{targetWeight(route.deltaLb, unit, { upward: true })} {unit}
            </span>
          </span>
          {showTotals ? (
            <span className="target-total">
              {targetWeight(route.totalLb, unit, { upward: true })} {unit}{" "}
              three-lift total
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function LiftTargets({
  strength,
  powerLevel,
  unit,
  title = "To reach this benchmark",
  name,
  compact = false,
}) {
  const result = useMemo(
    () => liftTargets(strength, powerLevel, unit),
    [strength, powerLevel, unit],
  );
  if (result.status === "reached")
    return <p className="small muted">Reached with your proven singles.</p>;
  if (result.status !== "available")
    return (
      <p className="small muted">
        {result.status === "incomplete"
          ? "Record a successful squat, bench and deadlift to see your targets."
          : "No further target available."}
      </p>
    );
  const singleInstruction =
    "Any one of these singles gets you there, with your other two bests held steady.";
  return (
    <section
      className={`lift-targets ${compact ? "compact" : ""}`}
      aria-label={title}
    >
      <span className="eyebrow">{title}</span>
      {name ? <h3>{name}</h3> : null}
      {result.preferBalanced ? (
        <>
          <p className="balanced-target-total">
            <strong>
              {targetWeight(result.balanced.totalLb, unit, { upward: true })}{" "}
              {unit}
            </strong>{" "}
            three-lift total
          </p>
          <p className="target-instruction">
            Reach all three singles below. This spreads your progress across
            your lifts while keeping a similar balance to your current bests.
          </p>
          <TargetOptions routes={result.balanced.lifts} unit={unit} />
          <details className="single-lift-alternatives">
            <summary>See one-lift alternatives</summary>
            <p className="target-instruction">
              {singleInstruction} Distant milestones can require much larger
              increases this way.
            </p>
            <TargetOptions routes={result.routes} unit={unit} showTotals />
          </details>
        </>
      ) : (
        <>
          <p className="target-instruction">{singleInstruction}</p>
          <TargetOptions routes={result.routes} unit={unit} showTotals />
        </>
      )}
      <p className="target-footnote">
        Targets round up to {result.routes[0].step} {unit}. Based on your proven
        singles and saved comparison profile. These are progression milestones,
        not prescribed attempts.
      </p>
    </section>
  );
}
