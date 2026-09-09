import {
  STRENGTH_REFERENCES as DATA,
  percentileLabel,
  LB_PER_KG,
} from "../lib/strength-comparison.mjs";
import { weight } from "./Dashboard";

const count = (n) => n.toLocaleString("en-US");
function sampleLabel(range) {
  return range[0] === range[1]
    ? count(range[0])
    : `${count(range[0])}–${count(range[1])}`;
}
export function StrengthReferences({ strength, unit }) {
  const r = strength.reference,
    relative = r.context.mode === "relative";
  return (
    <section
      className="panel strength-references"
      aria-label="Public strength comparisons"
    >
      <div className="section-heading reference-heading">
        <div>
          <span className="eyebrow">GROUNDED IN REAL LIFTS</span>
          <h2>How you compare.</h2>
        </div>
        <span className="reference-score">
          <strong>{r.complete ? r.score.toFixed(2) : "—"}</strong>
          <span>reference score</span>
        </span>
      </div>
      <p className="reference-context">
        {r.context.label}
        {relative
          ? ` · ${weight(r.context.bodyweightKg * LB_PER_KG, unit)} ${unit}`
          : ""}
      </p>
      {r.context.fallback ? (
        <p className="notice small">
          Using absolute comparisons: add a supported bodyweight and category in
          Edit profile to enable your selected comparison.
        </p>
      ) : null}
      <p className="small muted">
        Your completed singles against people who lift. P50 is the middle of
        that source; P90 is above roughly 90%. These are estimates within each
        group.
      </p>
      <div className="reference-lifts">
        {r.lifts.map((lift) => (
          <article className="reference-lift" key={lift.id}>
            <div className="reference-lift-title">
              <h3>{lift.name}</h3>
              <strong>
                {weight(lift.weightLb, unit)} <span>{unit}</span>
              </strong>
            </div>
            <div className="source-comparison community">
              <span>
                Gym lifters<small>{r.communitySource}</small>
              </span>
              <b>{percentileLabel(lift.community)}</b>
            </div>
            <div className="source-comparison competition">
              <span>
                Competition lifters<small>OpenPowerlifting</small>
              </span>
              <b>{percentileLabel(lift.competition)}</b>
            </div>
          </article>
        ))}
      </div>
      <p className="reference-note">
        {relative
          ? "Adjusted using published bodyweight tables and nearby competition weight groups."
          : "All categories and bodyweights combined. Set a personal reference in Edit profile for an adjusted comparison."}
      </p>
      <details className="reference-method">
        <summary>Sources, sample sizes & how this becomes power</summary>
        <p>
          Each lift averages its gym and competition comparison, then squat,
          bench and deadlift contribute equally. That average is a game
          reference score, not a pooled percentile. Dragon Ball power is a
          fictional translation of the score. All three successful singles are
          required to earn power.
        </p>
        <p>
          Community standards include estimated maximums from logged sets. Your
          side of the earned comparison always uses completed singles. An
          estimated 1RM above your single appears only as unrealized potential.
        </p>
        <p>
          We interpolate between public landmarks. Below or above the published
          range, the labels show bounds instead of made-up percentiles. Game
          points extend smoothly beyond those limits so improvements still
          count. A value above 100 is a game extension, not a percentile.
        </p>
        <div className="reference-source-details">
          <article>
            <h3>{r.communitySource} · gym reference</h3>
            {relative ? (
              <>
                <p>
                  Public training-log standards by male/female category and
                  bodyweight. We interpolate between 5 kg bodyweight rows.
                  Source counts below describe the whole category, not the size
                  of each bodyweight group. No age adjustment.
                </p>
                <ul>
                  {r.lifts.map((lift) => (
                    <li key={lift.id}>
                      <a
                        href={DATA.strengthlog.lifts[lift.id].url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {lift.name}: {count(lift.communityN)} lifters
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <p>
                  Hardy Strength Progression Report 2026: best estimated 1RM per
                  lifter, with at least three sessions of that lift. Sex, age
                  and bodyweight are unavailable. Data through{" "}
                  {DATA.hardy.through}.
                </p>
                <ul>
                  {r.lifts.map((lift) => (
                    <li key={lift.id}>
                      {lift.name}: {count(lift.communityN)} lifters
                    </li>
                  ))}
                </ul>
                <p>
                  <a href={DATA.hardy.url} target="_blank" rel="noreferrer">
                    Hardy report
                  </a>{" "}
                  ·{" "}
                  <a href={DATA.hardy.csvUrl} target="_blank" rel="noreferrer">
                    Aggregate data
                  </a>{" "}
                  ·{" "}
                  <a
                    href="https://creativecommons.org/licenses/by/4.0/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    CC BY 4.0
                  </a>
                  . Curves adapted for this app.
                </p>
              </>
            )}
          </article>
          <article>
            <h3>OpenPowerlifting · competition reference</h3>
            <p>
              {count(DATA.openpowerlifting.absolute.backSquat.n)} distinct
              lifters from {count(DATA.openpowerlifting.eligibleMeetRows)}{" "}
              qualifying meet entries, January 2010 through{" "}
              {DATA.openpowerlifting.through}. Adults with known age, raw SBD,
              tested divisions and a completed total. Each lifter contributes
              one best per lift within each comparison group.
            </p>
            {relative ? (
              <p>
                Nearby bodyweight groups use ±10% around 5 kg centers; we
                interpolate neighboring curves.{" "}
                {sampleLabel(r.lifts[0].competitionSampleRange)} lifters per
                contributing group. Overlapping groups are not added together.
              </p>
            ) : null}
            <p>
              “Tested” describes the division; it does not establish that every
              lifter was individually drug tested. Gym singles are also not
              competition-judged attempts.
            </p>
            <p>
              <a
                href={DATA.openpowerlifting.url}
                target="_blank"
                rel="noreferrer"
              >
                OpenPowerlifting public-domain dataset
              </a>{" "}
              · snapshot{" "}
              {DATA.openpowerlifting.file
                .replace("openpowerlifting-", "")
                .replace(".csv", "")}
            </p>
          </article>
        </div>
        <p>
          These are self-selected lifters, not a representative survey of all
          adults. People can appear in more than one source. Results are
          descriptive comparisons, not lifting prescriptions.
        </p>
        <p>
          Other useful public benchmarks include{" "}
          <a
            href="https://strengthlevel.com/strength-standards"
            target="_blank"
            rel="noreferrer"
          >
            Strength Level
          </a>
          {!relative ? (
            <>
              {" "}
              and{" "}
              <a href={DATA.strengthlog.url} target="_blank" rel="noreferrer">
                StrengthLog
              </a>
            </>
          ) : (
            <>
              {" "}
              and{" "}
              <a href={DATA.hardy.url} target="_blank" rel="noreferrer">
                Hardy
              </a>
            </>
          )}
          . We keep their different populations distinct.
        </p>
        <p className="small muted">
          Reference edition: September 2026 · downloaded {DATA.retrieved}.
          Bundled for offline use; recalculates from your latest synced history.
          This replaces the old fixed pound-total scale, so existing ranks may
          change. Updating reference data in a future app release may
          recalibrate them again.
        </p>
      </details>
    </section>
  );
}
