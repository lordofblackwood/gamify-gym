import { Meter, weight } from "./Dashboard";
import { Icon } from "./Icons";
import { LiftTargets } from "./LiftTargets";
import { UnrealizedPotential } from "./UnrealizedPotential";
import { powerLabel, exactPowerLabel } from "../lib/progression.mjs";
export function comparisonName(items) {
  if (!items?.length) return "Your journey starts here";
  return `${items[0].displayName}${items.length > 1 ? ` + ${items.length - 1} in this band` : ""}`;
}
export function PowerComparison({ progression, onInspect }) {
  const p = progression;
  const rows = [
    ["Stronger than", p.previousBenchmarks, "surpassed", "↑"],
    ["Comparable to", p.comparable, "equal", "="],
    ["Approaching", p.nextBenchmarks, "next", "↗"],
  ];
  return (
    <div className="power-comparisons">
      {rows.map(([label, items, state, symbol]) => (
        <button
          key={label}
          className={`comparison-row ${state}`}
          onClick={() => items.length && onInspect(items[0].id)}
          disabled={!items.length}
        >
          <span className="comparison-symbol" aria-hidden="true">
            {symbol}
          </span>
          <span>
            <span className="comparison-label">{label}</span>
            <strong>
              {items.length
                ? comparisonName(items)
                : p.isMax && state === "next"
                  ? "Beyond the final benchmark"
                  : "The starting line"}
            </strong>
          </span>
          <Icon name="arrow" size={17} />
        </button>
      ))}
    </div>
  );
}
export function PowerProfile({ data, unit, onJourney, onInspect }) {
  const p = data.progression;
  return (
    <section
      className="panel power-profile"
      aria-label="Your power and benchmark"
    >
      <div className="power-profile-top">
        <div className="power-readout">
          <span className="eyebrow">PROVEN POWER LEVEL</span>
          <div className="fighter-power" title={exactPowerLabel(p.powerLevel)}>
            {powerLabel(p.powerLevel)}
          </div>
          <p className="small muted">
            {p.calibrated
              ? "Completed singles · public lifting references"
              : "Starting power · awaiting lift records"}
          </p>
        </div>
        <div className="personal-transformation">
          <span
            className="transformation-tag"
            style={{
              color: p.transformation.color,
              borderColor: p.transformation.color,
            }}
          >
            {p.transformation.name}
          </span>
          <span className="eyebrow">CURRENT TRANSFORMATION</span>
        </div>
      </div>
      <div className="current-benchmark">
        <span className="eyebrow">
          {p.calibrated ? "CURRENT BENCHMARK" : "STARTING BENCHMARK"}
        </span>
        <h2>{p.current.displayName}</h2>
        <p>
          {p.calibrated
            ? "Comparable within our progression scale."
            : `Record all three lifts to calibrate your power (${data.known}/3 connected).`}
        </p>
      </div>
      <div className="benchmark-progress">
        <Meter
          value={p.calibrated ? p.progress : 0}
          color="var(--lime)"
          label="Progress to next power benchmark"
        />
        <span>
          <strong>{p.calibrated ? Math.floor(p.progress) : 0}%</strong>{" "}
          {p.isMax ? "ladder completed" : "to next benchmark"}
        </span>
      </div>
      <PowerComparison progression={p} onInspect={onInspect} />
      <div className="power-profile-footer">
        <p>
          <Icon name="weight" size={23} />
          <span>
            <strong>
              {weight(data.total, unit)} {unit}
            </strong>{" "}
            {data.complete ? "three-lift total" : "recorded so far"}
          </span>
        </p>
        <button className="primary-button outline" onClick={onJourney}>
          Explore the power ladder <Icon name="arrow" size={18} />
        </button>
      </div>
      {p.next ? (
        <LiftTargets
          strength={data}
          powerLevel={p.next.powerLevel}
          unit={unit}
          title="NEXT BENCHMARK"
          name={p.next.displayName}
          compact
        />
      ) : null}
      {p.nextTransformation ? (
        <details className="next-form-target">
          <summary>Next transformation · {p.nextTransformation.name}</summary>
          <LiftTargets
            strength={data}
            powerLevel={p.nextTransformation.powerLevel}
            unit={unit}
            title="TO UNLOCK THIS TRANSFORMATION"
            compact
          />
        </details>
      ) : null}
      <UnrealizedPotential strength={data} unit={unit} />
    </section>
  );
}
