import { Icon } from "./Icons";
import { weight } from "./Dashboard";
import { powerLabel, exactPowerLabel } from "../lib/progression.mjs";

export function UnrealizedPotential({ strength, unit }) {
  const potential = strength.potential;
  const projected = potential.progression;
  const nextForm =
    projected &&
    projected.transformation.id !== strength.progression.transformation.id;
  return (
    <section
      className={`unrealized-potential ${potential.hasPotential ? "has-potential" : ""}`}
      aria-label="Unrealized potential"
    >
      <div className="potential-heading">
        <Icon name="lock" size={22} />
        <span className="eyebrow">UNREALIZED POTENTIAL</span>
        <span className="potential-status">Not earned</span>
      </div>
      {projected ? (
        <>
          <h3>{projected.transformation.name}</h3>
          <p className="potential-subtitle">
            {nextForm
              ? "An unrealized transformation, suggested by your rep sets."
              : "Hidden power within your current form. No new transformation yet."}
          </p>
          <div className="potential-power">
            <strong title={exactPowerLabel(projected.powerLevel)}>
              {powerLabel(projected.powerLevel)}
            </strong>
            <span>potential power</span>
          </div>
          <p className="small">
            {weight(potential.total, unit)} {unit} projected total · +
            {weight(potential.gap, unit)} {unit} beyond your proven singles
          </p>
          <p className="small muted">
            Potential benchmark: {projected.current.displayName}. Your current
            power and earned form stay unchanged.
          </p>
        </>
      ) : (
        <p className="potential-empty">
          {potential.hasPotential
            ? "Your rep sets suggest hidden strength. Record all three singles to reveal its potential transformation."
            : potential.hasEvidence
              ? "Your proven singles already match or exceed your rep-set estimates. No unrealized power gap right now."
              : "A completed rep set that estimates above your best single will reveal hidden power here."}
        </p>
      )}
      <details className="potential-evidence">
        <summary>Compare actual and estimated 1RM</summary>
        <div className="potential-lifts">
          {potential.lifts.map((lift) => (
            <div className="potential-lift" key={lift.id}>
              <strong>{lift.name}</strong>
              <div className="potential-lift-values">
                <span>
                  Actual{" "}
                  <b>
                    {weight(lift.actual, unit)} {unit}
                  </b>
                </span>
                <span>
                  Estimated{" "}
                  <b>
                    {weight(lift.evidence?.estimated, unit)} {unit}
                  </b>
                </span>
              </div>
              <span className="small muted">
                {lift.evidence
                  ? `${weight(lift.evidence.weight, unit)} ${unit} × ${lift.evidence.reps} reps · ${lift.evidence.date}`
                  : "No eligible completed rep set synced"}
              </span>
            </div>
          ))}
        </div>
        <p className="small muted">
          Estimated 1RM (e1RM) uses the Epley formula: weight × (1 + reps ÷ 30),
          from completed Auto Bulgarian backoff sets of 2–10 reps. Reps are per
          set. Each lift uses the higher of its best single and estimate for
          potential only.
        </p>
        <p className="small muted">
          These are historical estimates, not verified maxes or prescribed
          attempts. Only successful singles earn actual power. Updating and
          opening Auto Bulgarian online syncs completed rep-set evidence
          automatically.
        </p>
      </details>
    </section>
  );
}
