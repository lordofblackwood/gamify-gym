import { useEffect, useRef } from "react";
import {
  BENCHMARK_BY_ID,
  BENCHMARKS,
  scoreForPower,
  exactPowerLabel,
  benchmarkEvidence,
} from "../lib/progression.mjs";
import { SOURCES, TIERS } from "../data/benchmarks.mjs";
import { Icon } from "./Icons";
export function BenchmarkDetail({ id, progression, onClose }) {
  const dialog = useRef(null);
  const b = BENCHMARK_BY_ID[id];
  useEffect(() => {
    if (b) dialog.current?.showModal();
  }, [b]);
  if (!b) return null;
  const source = b.sourceId ? SOURCES[b.sourceId] : null;
  const peers = BENCHMARKS.filter(
    (other) => other.powerLevel === b.powerLevel && other.id !== b.id,
  );
  const needed = Math.max(0, scoreForPower(b.powerLevel) - progression.score);
  return (
    <dialog
      ref={dialog}
      className="modal panel benchmark-detail"
      aria-labelledby="benchmark-title"
      onCancel={onClose}
    >
      <div className="section-heading">
        <span className="eyebrow">{benchmarkEvidence(b)}</span>
        <button
          autoFocus
          className="icon-button"
          aria-label="Close benchmark details"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <p className="small muted">
        {b.era} · {b.continuity}
      </p>
      <h2 id="benchmark-title">{b.displayName}</h2>
      <div className="detail-power">{exactPowerLabel(b.powerLevel)}</div>
      <p className="small muted">
        {b.canonicalPowerLevelKnown
          ? "Published character power; your comparison to it is fictional."
          : "Application scale value · not an official canon number"}
      </p>
      <p>{b.description}</p>
      <dl>
        <div>
          <dt>Collection</dt>
          <dd>{TIERS.find((t) => t.id === b.tier)?.name}</dd>
        </div>
        <div>
          <dt>Reference score milestone</dt>
          <dd>{scoreForPower(b.powerLevel).toFixed(2)} reference points</dd>
        </div>
        <div>
          <dt>Your progress</dt>
          <dd>
            {!progression.calibrated
              ? "Record all three lifts to calibrate"
              : needed < 1e-7
                ? "Benchmark reached"
                : `${needed.toFixed(2)} reference points to go`}
          </dd>
        </div>
      </dl>
      {peers.length ? (
        <p className="small muted">
          Shared band: {peers.map((p) => p.displayName).join("; ")}.
        </p>
      ) : null}
      {source ? (
        <a
          className="text-link"
          href={source.url}
          target="_blank"
          rel="noreferrer"
        >
          {source.title} <Icon name="arrow" size={16} />
        </a>
      ) : b.id === "zeno" ? (
        <a
          className="text-link"
          href={SOURCES.zeno.url}
          target="_blank"
          rel="noreferrer"
        >
          Read about Zeno’s cosmic authority <Icon name="arrow" size={16} />
        </a>
      ) : (
        <p className="small muted">
          Placement is curated for Powerlevel. It is not a guaranteed fight
          outcome.
        </p>
      )}
    </dialog>
  );
}
