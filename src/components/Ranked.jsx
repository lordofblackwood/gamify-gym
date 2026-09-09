import { RANKS } from "../lib/scoring.mjs";
import { ConsistencyPanel } from "./Dashboard";
import { RankEmblem, Icon } from "./Icons";
export function Ranked({ data, prefs, onPreferences }) {
  return (
    <>
      <div className="page-heading">
        <h1>Consistency is a skill.</h1>
        <p>Earn your rank by showing up for the plan you set.</p>
      </div>
      <ConsistencyPanel
        data={data}
        onRank={() =>
          document
            .getElementById("rank-method")
            .scrollIntoView({ behavior: "smooth" })
        }
      />
      <section className="panel settings-row">
        <label htmlFor="target">
          Weekly training target<span>Training days, across both trackers</span>
        </label>
        <select
          id="target"
          value={prefs.target}
          onChange={(e) => onPreferences({ target: Number(e.target.value) })}
        >
          {[2, 3, 4, 5, 6, 7].map((n) => (
            <option key={n} value={n}>
              {n} days
            </option>
          ))}
        </select>
      </section>
      <section className="rank-stats">
        <div>
          <strong>{data.totalDays}</strong>
          <span>Training days</span>
        </div>
        <div>
          <strong>{data.streak}</strong>
          <span>Target weeks in a row</span>
        </div>
        <div>
          <strong>{data.ranked ? data.lp : "—"}</strong>
          <span>LP this division</span>
        </div>
      </section>
      <div className="section-heading">
        <h2>THE RANKED LADDER</h2>
        <span className="small muted">Your consistency score</span>
      </div>
      <div className="rank-ladder">
        {RANKS.map((r) => (
          <div
            className={`rank-row ${data.ranked && r.name === data.rank.name ? "current" : ""}`}
            key={r.name}
          >
            <RankEmblem color={r.color} small />
            <strong>{r.name}</strong>
            <span>{r.min}%</span>
            {data.ranked && r.name === data.rank.name ? (
              <span className="current-tag">Your rank</span>
            ) : data.ranked && r.min <= data.score ? (
              <Icon name="check" size={18} />
            ) : (
              <span className="rank-slot" />
            )}
          </div>
        ))}
      </div>
      <section className="panel explanation" id="rank-method">
        <h2>How your rank works</h2>
        <p>
          Each completed Monday–Sunday week earns credit for training days,
          capped at your target. Your score is the average credit across the
          last 12 completed weeks. Weeks before your first record count as zero,
          so higher ranks take time to earn.
        </p>
        <p>
          One day counts once, even when both trackers have records. Failed
          attempts count. Entirely skipped accessory sessions do not. Extra
          sessions beyond your target give no extra rank credit.
        </p>
        <p>
          Iron through Diamond have divisions IV–I, with 0–99 LP in each.
          Master, Grandmaster and Challenger use the score thresholds shown
          above. Scores update as completed weeks roll forward. Changing your
          target recalculates the past 12 weeks.
        </p>
        <p className="small muted">
          This is your personal fitness rank, inspired by League. It is not a
          competitive leaderboard.
        </p>
      </section>
    </>
  );
}
