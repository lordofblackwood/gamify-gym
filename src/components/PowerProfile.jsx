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
        </div>
        <div className="personal-transformation">
          <span className="eyebrow">FORM</span>
          <span
            className="transformation-tag"
            style={{
              color: p.transformation.color,
              borderColor: p.transformation.color,
            }}
          >
            {p.transformation.name}
          </span>
        </div>
      </div>
      <div className="current-benchmark">
        <span className="eyebrow">
          {p.calibrated ? "COMPARABLE TO" : "STARTING BENCHMARK"}
        </span>
        <h2>{p.current.displayName}</h2>
        {!p.calibrated ? (
          <p>{data.known}/3 singles recorded · awaiting calibration</p>
        ) : null}
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
      {p.next && p.calibrated ? (
        <LiftTargets
          strength={data}
          powerLevel={p.next.powerLevel}
          unit={unit}
          title="NEXT GOAL"
          name={p.next.displayName}
          compact
          summaryOnly
        />
      ) : null}
      <details className="power-extras">
        <summary>Comparisons & next form</summary>
        <PowerComparison progression={p} onInspect={onInspect} />
        {p.nextTransformation ? (
          <LiftTargets
            strength={data}
            powerLevel={p.nextTransformation.powerLevel}
            unit={unit}
            title="NEXT TRANSFORMATION"
            name={p.nextTransformation.name}
            compact
            summaryOnly
          />
        ) : null}
      </details>
      <UnrealizedPotential strength={data} unit={unit} />
      <div className="power-profile-footer">
        <p>
          <strong>
            {weight(data.total, unit)} {unit}
          </strong>{" "}
          {data.complete ? "total" : "recorded"}
        </p>
        <button className="text-button" onClick={onJourney}>
          Power ladder <Icon name="arrow" size={16} />
        </button>
      </div>
    </section>
  );
}
