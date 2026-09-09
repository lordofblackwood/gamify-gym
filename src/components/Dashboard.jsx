import { Icon, RankEmblem } from "./Icons";
import { LIFTS, monday, shiftDate } from "../../public/shared/history.mjs";
export function weight(value, unit = "lb") {
  return value == null
    ? "—"
    : (unit === "kg" ? value / 2.2046226218 : value).toLocaleString(undefined, {
        maximumFractionDigits: 1,
      });
}
export function Meter({ value, color, label }) {
  return (
    <div
      className="meter"
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <span
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          background: color,
        }}
      />
    </div>
  );
}
export function ConsistencyPanel({ data, onRank }) {
  return (
    <button
      className="panel consistency-panel"
      onClick={onRank}
      aria-label="Explore consistency rank"
    >
      <RankEmblem color={data.ranked ? data.rank.color : "#66768e"} />
      <div className="consistency-content">
        <span className="eyebrow">CONSISTENCY</span>
        <h2 style={{ color: data.ranked ? data.rank.color : "var(--muted)" }}>
          {data.ranked ? `${data.rank.name} ${data.division}` : "Unranked"}
        </h2>
        <p>
          <strong>{data.ranked ? `${Math.round(data.score)}%` : "—"}</strong> of
          weekly targets
        </p>
        <Meter
          value={data.ranked ? data.progress : 0}
          color={data.rank.color}
          label="Progress to next rank"
        />
        <span className="small muted">Training builds your rank.</span>
      </div>
    </button>
  );
}
export function Rhythm({ data, today }) {
  const start = shiftDate(monday(today), -77);
  const columns = Array.from({ length: 12 }, (_, i) =>
    Array.from({ length: 7 }, (_, j) => shiftDate(start, i * 7 + j)),
  );
  return (
    <section className="panel rhythm">
      <div className="section-heading">
        <h2>TRAINING RHYTHM</h2>
        <span className="small muted">Last 12 weeks</span>
      </div>
      <div className="heatmap">
        <div className="day-labels">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        {columns.map((week, i) => (
          <div className="heat-week" key={i}>
            {week.map((date) => (
              <div
                key={date}
                className={`heat-cell ${data.set.has(date) ? "trained" : ""} ${date > today ? "future" : ""} ${date === today ? "today" : ""}`}
                title={`${date}: ${date > today ? "upcoming" : data.set.has(date) ? "training day" : "rest / no record"}`}
                aria-label={`${date}: ${date > today ? "upcoming" : data.set.has(date) ? "training day" : "rest or no record"}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="rhythm-summary">
        <p>
          <strong>{data.thisWeek}</strong> / {data.target} days this week
        </p>
        <span>Rest days are part of the plan.</span>
      </div>
    </section>
  );
}
export function LiftRecords({ data, unit }) {
  return (
    <section className="panel records">
      <div className="section-heading">
        <h2>YOUR STRONGEST LIFTS</h2>
      </div>
      <div className="lift-grid">
        {Object.entries(LIFTS).map(([id, name]) => (
          <div className="lift-record" key={id}>
            <Icon name="weight" size={29} />
            <span>{name.replace("Back ", "").replace(" Press", "")}</span>
            <strong>
              {weight(data.records[id]?.weight, unit)} <small>{unit}</small>
            </strong>
          </div>
        ))}
      </div>
      <p className="small muted">
        Best recorded singles · All-time personal records
      </p>
    </section>
  );
}
export function ActivityList({ events, unit, limit = 6 }) {
  if (!events.length)
    return (
      <p className="empty-copy">
        Your training story starts with a connected workout history.
      </p>
    );
  return (
    <div className="activity-list">
      {events.slice(0, limit).map((e) => (
        <article className="activity" key={e.id}>
          <span className={`result-icon ${e.success ? "success" : ""}`}>
            <Icon name={e.success ? "check" : "weight"} size={18} />
          </span>
          <div>
            <strong>{e.name}</strong>
            <span>
              {new Date(`${e.date}T12:00:00`).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}{" "}
              ·{" "}
              {e.source === "bulgarian" ? "Auto Bulgarian" : "Accessory Lifts"}
            </span>
          </div>
          <div className="activity-result">
            <strong>
              {e.weight != null
                ? e.unit === "lb"
                  ? `${weight(e.weight, unit)} ${unit}`
                  : `${e.weight} ${e.unit}`
                : e.weightLabel || "—"}
            </strong>
            <span>
              {e.outcome === "skipped"
                ? "Skipped"
                : e.success
                  ? "Completed"
                  : e.singleCompleted
                    ? "Single completed"
                    : "Attempt logged"}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
