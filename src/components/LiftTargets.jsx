import { useMemo } from "react";
import {
  liftTargets,
  targetWeight,
  shortestRoute,
} from "../lib/lift-targets.mjs";
import { LIFT_RECORD_LIMITS } from "../data/lift-record-limits.mjs";

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
            {route.deltaLb === 0 ? (
              <strong>Already proven</strong>
            ) : (
              <>
                <strong>
                  {targetWeight(route.targetLb, unit)} <small>{unit}</small>
                </strong>
                <span>
                  +{targetWeight(route.deltaLb, unit, { upward: true })} {unit}
                </span>
              </>
            )}
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

function RecordLimits({ caps, unit }) {
  return (
    <details className="single-lift-alternatives">
      <summary>American record limits & sources</summary>
      <p className="target-instruction">
        Overall American raw records from full-power meets, across weight
        classes. Limits round down to a load increment. Your goals use your
        selected strength reference; these are not weight-class records.
      </p>
      {Object.entries(caps).map(([id, cap]) => (
        <p className="small muted" key={id}>
          <a href={cap.url} target="_blank" rel="noreferrer">
            {id === "backSquat"
              ? "Squat"
              : id === "benchPress"
                ? "Bench"
                : "Deadlift"}
            : {targetWeight(cap.capLb, unit)} {unit}
          </a>{" "}
          · {cap.athlete} · {cap.date}
        </p>
      ))}
      <p className="target-footnote">
        Fixed record reference · {LIFT_RECORD_LIMITS.retrieved}
      </p>
    </details>
  );
}

export function LiftTargets({
  strength,
  powerLevel,
  unit,
  title = "To reach this benchmark",
  name,
  compact = false,
  summaryOnly = false,
}) {
  const result = useMemo(
    () => liftTargets(strength, powerLevel, unit),
    [strength, powerLevel, unit],
  );
  if (result.status === "reached")
    return <p className="small muted">Reached with your proven singles.</p>;
  if (result.status === "beyond-records")
    return (
      <section
        className={`lift-targets ${compact ? "compact" : ""}`}
        aria-label={title}
      >
        <span className="eyebrow">{title}</span>
        {name ? <h3>{name}</h3> : null}
        <p>
          <strong>Beyond American raw record limits</strong>
        </p>
        <p className="target-instruction">
          This milestone has no SBD goal within the record limits. It remains on
          the fictional power ladder.
        </p>
        <RecordLimits caps={result.caps} unit={unit} />
      </section>
    );
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
  const route = shortestRoute(result);
  const expandedTargets = (
    <>
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
            Build toward comparable strength across your lifts. Stronger singles
            you have already proven still count.
          </p>
          <TargetOptions routes={result.balanced.lifts} unit={unit} />
          {result.routes.length ? (
            <details className="single-lift-alternatives">
              <summary>See nearby one-lift alternatives</summary>
              <p className="target-instruction">{singleInstruction}</p>
              <TargetOptions routes={result.routes} unit={unit} showTotals />
            </details>
          ) : null}
        </>
      ) : (
        <>
          <p className="target-instruction">{singleInstruction}</p>
          <TargetOptions routes={result.routes} unit={unit} showTotals />
        </>
      )}
      <p className="target-footnote">
        New targets round up to {result.step} {unit} and never exceed the
        American raw record limits. These are progression milestones, not
        prescribed attempts.
      </p>
      <RecordLimits caps={result.caps} unit={unit} />
    </>
  );
  return (
    <section
      className={`lift-targets ${compact ? "compact" : ""}`}
      aria-label={title}
    >
      <span className="eyebrow">{title}</span>
      {name ? <h3>{name}</h3> : null}
      {summaryOnly ? (
        <>
          <div className="goal-preview">
            {result.preferBalanced ? (
              <>
                <strong>
                  {targetWeight(result.balanced.totalLb, unit, {
                    upward: true,
                  })}{" "}
                  {unit} total
                </strong>
                <p>
                  {result.balanced.lifts
                    .map((lift) =>
                      lift.deltaLb === 0
                        ? `${lift.name} already proven`
                        : `${lift.name} ${targetWeight(lift.targetLb, unit)} ${unit}`,
                    )
                    .join(" · ")}
                </p>
                <span>Reach the remaining lift goals.</span>
              </>
            ) : (
              <>
                <div className="goal-preview-load">
                  <strong>
                    {route.name} {targetWeight(route.targetLb, unit)} {unit}
                  </strong>
                  <span>
                    +{targetWeight(route.deltaLb, unit, { upward: true })}{" "}
                    {unit}
                  </span>
                </div>
                <p>
                  Other lifts unchanged ·{" "}
                  {targetWeight(route.totalLb, unit, { upward: true })} {unit}{" "}
                  total
                </p>
              </>
            )}
          </div>
          <details className="target-disclosure">
            <summary>All lift targets</summary>
            {expandedTargets}
          </details>
        </>
      ) : (
        expandedTargets
      )}
    </section>
  );
}
