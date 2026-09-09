import { useMemo, useState } from "react";
import {
  BENCHMARKS,
  TRANSFORMATIONS,
  findBenchmarks,
  powerLabel,
  exactPowerLabel,
  progressionFromScore,
  scoreForPower,
  benchmarkEvidence,
} from "../lib/progression.mjs";
import { TIERS } from "../data/benchmarks.mjs";
import { Icon } from "./Icons";
import { Meter, weight } from "./Dashboard";
import { comparisonName } from "./PowerProfile";
const kg = 2.2046226218;
function Ladder({ progression: p, unit, onInspect }) {
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState("all");
  const [state, setState] = useState("all");
  const [nearby, setNearby] = useState(true);
  const [limit, setLimit] = useState(30);
  const filtered = useMemo(
    () => findBenchmarks({ query, tier, state, powerLevel: p.powerLevel }),
    [query, tier, state, p.powerLevel],
  );
  const index = BENCHMARKS.findIndex((b) => b.id === p.current.id);
  const rows = nearby
    ? BENCHMARKS.slice(
        Math.max(0, index - 3),
        Math.min(BENCHMARKS.length, index + 9),
      )
    : filtered.slice(0, limit);
  function all() {
    setNearby(false);
    setLimit(30);
  }
  return (
    <>
      <div className="ladder-toolbar">
        <div className="ladder-search">
          <label htmlFor="benchmark-search">Find a fighter, form or saga</label>
          <input
            id="benchmark-search"
            type="search"
            placeholder="Goku, Frieza, Super Saiyan…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              all();
            }}
          />
        </div>
        <div className="ladder-filters">
          <label>
            Collection
            <select
              value={tier}
              onChange={(e) => {
                setTier(e.target.value);
                all();
              }}
            >
              <option value="all">All collections</option>
              {TIERS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Progress
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                all();
              }}
            >
              <option value="all">All benchmarks</option>
              <option value="reached">Reached</option>
              <option value="ahead">Ahead of me</option>
            </select>
          </label>
        </div>
      </div>
      <div className="ladder-view-actions">
        <div className="button-row">
          <button
            className={nearby ? "text-button active" : "text-button"}
            onClick={() => {
              setNearby(true);
              setQuery("");
              setTier("all");
              setState("all");
            }}
          >
            Around me
          </button>
          <button
            className={!nearby ? "text-button active" : "text-button"}
            onClick={() => {
              setQuery("");
              setTier("all");
              setState("all");
              all();
            }}
          >
            Full ladder
          </button>
        </div>
        <span className="small muted" role="status">
          {nearby
            ? `${rows.length} nearby benchmarks`
            : `${filtered.length} benchmark${filtered.length === 1 ? "" : "s"} found`}
        </span>
      </div>
      <div className="benchmark-list">
        {rows.map((b) => {
          const current = p.comparable.some((c) => c.id === b.id),
            reached = b.powerLevel <= p.current.powerLevel;
          return (
            <button
              className={`benchmark-row ${current ? "current" : ""} ${reached ? "reached" : ""}`}
              key={b.id}
              onClick={() => onInspect(b.id)}
            >
              <span className="benchmark-ordinal">
                {String(BENCHMARKS.indexOf(b) + 1).padStart(3, "0")}
              </span>
              <span className="benchmark-row-body">
                <span className="benchmark-era">
                  {b.era}
                  {b.continuity !== "Main story" ? ` · ${b.continuity}` : ""}
                </span>
                <strong>{b.displayName}</strong>
                <span className="benchmark-row-meta">
                  {benchmarkEvidence(b)} ·{" "}
                  {weight(scoreForPower(b.powerLevel), unit)} {unit} total
                </span>
              </span>
              <span className="benchmark-row-power">
                <strong title={exactPowerLabel(b.powerLevel)}>
                  {powerLabel(b.powerLevel, { compact: true })}
                </strong>
                <span className={current ? "current-label" : ""}>
                  {current ? "Your band" : reached ? "Reached" : "Ahead"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {!rows.length ? (
        <p className="empty-copy">
          No benchmarks match. Try another fighter, form or collection.
        </p>
      ) : null}
      {!nearby && filtered.length > limit ? (
        <button
          className="secondary-button load-benchmarks"
          onClick={() => setLimit((n) => n + 30)}
        >
          Show 30 more benchmarks
        </button>
      ) : null}
      <p className="footnote">
        Ordered by app power, not story chronology. Equal values share a band.
        Tap any benchmark for its era, evidence and placement notes.
      </p>
    </>
  );
}
function PersonalForms({ progression: p, potential, unit }) {
  return (
    <>
      <p className="journey-intro">
        These are your own transformations. Your current form advances
        automatically with strength; its inspiration never replaces your
        identity or multiplies your score again.
      </p>
      <div className="personal-forms">
        {TRANSFORMATIONS.map((f) => {
          const reached = f.powerLevel <= p.powerLevel,
            current = f.id === p.transformation.id;
          const unrealized = !reached && potential.progression?.transformation.id === f.id;
          return (
            <article
              key={f.id}
              className={`personal-form ${current ? "current" : ""} ${reached ? "reached" : ""} ${unrealized ? "unrealized" : ""}`}
            >
              <span className="form-flare" style={{ color: f.color }}>
                <Icon name={reached ? "forms" : "lock"} size={25} />
              </span>
              <div>
                <h2>{f.name}</h2>
                <p>{f.inspiration}</p>
                <span className="small muted">
                  PL {powerLabel(f.powerLevel, { compact: true })} ·{" "}
                  {weight(scoreForPower(f.powerLevel), unit)} {unit} total
                </span>
              </div>
              <span className="small form-stage-state">
                {current ? "Current" : reached ? "Unlocked" : unrealized ? "Unrealized · not earned" : "Ahead"}
              </span>
            </article>
          );
        })}
      </div>
    </>
  );
}
function PRPreview({ strength, unit }) {
  const [delta, setDelta] = useState("5");
  const [lift, setLift] = useState("deadlift");
  const p = strength.progression;
  const valid =
    delta !== "" &&
    Number.isFinite(Number(delta)) &&
    Number(delta) >= 0 &&
    Number(delta) <= 200;
  const increase = valid ? Number(delta) * (unit === "kg" ? kg : 1) : 0;
  const projected = progressionFromScore(strength.total + increase, {
    calibrated: strength.complete,
  });
  return (
    <section className="panel pr-preview">
      <h2>Your next personal best.</h2>
      <p>
        Preview an improvement to one of your best singles. This does not change
        your history, profile or actual power.
      </p>
      {!strength.complete ? (
        <div className="notice">
          <Icon name="info" />
          <p>
            Connect a successful squat, bench and deadlift record first (
            {strength.known}/3 available). Your starting power is 5 until then.
          </p>
        </div>
      ) : (
        <>
          <div className="preview-inputs">
            <label>
              Improve this lift
              <select value={lift} onChange={(e) => setLift(e.target.value)}>
                <option value="backSquat">Squat</option>
                <option value="benchPress">Bench press</option>
                <option value="deadlift">Deadlift</option>
              </select>
            </label>
            <label htmlFor="pr-delta">
              Increase ({unit})
              <input
                id="pr-delta"
                type="number"
                min="0"
                max="200"
                step="any"
                inputMode="decimal"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
              />
            </label>
          </div>
          <div className="button-row preview-presets">
            {[2.5, 5, 10, 25].map((n) => (
              <button
                key={n}
                className="secondary-button"
                onClick={() => setDelta(String(n))}
              >
                +{n} {unit}
              </button>
            ))}
          </div>
          {!valid ? (
            <p role="alert">Enter an increase from 0 to 200 {unit}.</p>
          ) : (
            <div className="preview-results" aria-live="polite">
              <p>
                {weight(strength.records[lift]?.weight, unit)} →{" "}
                <strong>
                  {weight(
                    (strength.records[lift]?.weight || 0) + increase,
                    unit,
                  )}{" "}
                  {unit}
                </strong>
              </p>
              <span className="eyebrow">PROJECTED POWER LEVEL</span>
              <strong
                className="projected-power"
                title={exactPowerLabel(projected.powerLevel)}
              >
                {powerLabel(projected.powerLevel)}
              </strong>
              <p>
                +{powerLabel(projected.powerLevel - p.powerLevel)} power ·{" "}
                {weight(strength.total + increase, unit)} {unit} three-lift
                total
              </p>
              <h3>{comparisonName(projected.comparable)}</h3>
              <p>
                {projected.transformation.name}
                {projected.transformation.id !== p.transformation.id
                  ? " · New transformation"
                  : ""}
              </p>
              <Meter
                value={projected.progress}
                color={projected.transformation.color}
                label="Projected progress to next benchmark"
              />
              <p>
                {projected.isMax
                  ? "Beyond the final benchmark"
                  : `${Math.floor(projected.progress)}% toward ${projected.next.displayName}`}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
export function Journey({ strength, unit, onInspect }) {
  const [section, setSection] = useState("ladder");
  const p = strength.progression;
  return (
    <>
      <div className="page-heading">
        <h1>Your place in the universe.</h1>
        <p>
          {p.reached} of {BENCHMARKS.length} benchmarks reached ·{" "}
          {TRANSFORMATIONS.length} personal transformations
        </p>
      </div>
      <section className="panel journey-current">
        <div>
          <span className="eyebrow">
            {p.calibrated ? "YOUR CURRENT BAND" : "YOUR STARTING BAND"}
          </span>
          <h2>{p.current.displayName}</h2>
          <p>
            {p.transformation.name} · PL {powerLabel(p.powerLevel)}
          </p>
        </div>
        <span className="journey-percent">
          {Math.floor(p.progress)}
          <small>%</small>
        </span>
        <Meter
          value={p.progress}
          color="var(--lime)"
          label="Journey progress to next benchmark"
        />
        <p className="small muted">
          {p.next
            ? `Next: ${comparisonName(p.nextBenchmarks)}`
            : "You reached the symbolic summit. Your power can keep growing."}
        </p>
      </section>
      <div className="filter-rail journey-tabs" aria-label="Journey sections">
        {[
          ["ladder", "Power ladder"],
          ["forms", "Your forms"],
          ["preview", "PR preview"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            aria-pressed={section === id}
            className={section === id ? "active" : ""}
          >
            {label}
          </button>
        ))}
      </div>
      {section === "ladder" ? (
        <Ladder progression={p} unit={unit} onInspect={onInspect} />
      ) : section === "forms" ? (
        <PersonalForms progression={p} potential={strength.potential} unit={unit} />
      ) : (
        <PRPreview key={unit} strength={strength} unit={unit} />
      )}
      <details className="panel scale-explainer">
        <summary>How your power is calculated</summary>
        <p>
          Your strength score is your best successful squat + bench press +
          deadlift singles in pounds. Estimated 1RMs only reveal unrealized potential;
          they never increase actual power or unlock earned transformations.
          Power grows smoothly between fixed score anchors
          on a logarithmic scale: 600 lb = 18,000; 900 lb = 3,000,000; 1,200 lb
          = 900,000,000. It is a fantasy translation of your lifts, not a
          physical measurement or a population ranking.
        </p>
        <p>
          The bar shows your progress through the strength interval to the next
          benchmark. Even a small PR moves the number. All three lifts are
          required to calibrate; until then you start at Farmer, power 5.
          Correcting or removing a PR recalculates your position.
        </p>
        <p>
          Canon readings and published guide values are labeled. Other numbers
          are app estimates. Super anime, manga and DAIMA comparisons are
          editorial; techniques, stamina and special abilities complicate
          head-to-head outcomes. Zeno’s final milestone represents cosmic
          authority, not a measured combat power.
        </p>
        <p>
          Consistency is tracked separately through your League-style rank.
          Workout frequency does not inflate this strength score. Profile
          changes and the PR preview do not affect either system.
        </p>
      </details>
    </>
  );
}
