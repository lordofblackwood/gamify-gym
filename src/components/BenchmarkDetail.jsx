import { useEffect, useRef } from "react";
import {
  BENCHMARK_BY_ID,
  BENCHMARKS,
  exactPowerLabel,
  benchmarkEvidence,
  TRANSFORMATIONS,
} from "../lib/progression.mjs";
import { SOURCES, TIERS } from "../data/benchmarks.mjs";
import { LiftTargets } from "./LiftTargets";
import { Icon } from "./Icons";
export function BenchmarkDetail({ id, strength, unit, onClose }) {
  const dialog = useRef(null);
  const form = id.startsWith("form:")
    ? TRANSFORMATIONS.find((f) => f.id === id.slice(5))
    : null;
  const b = form
    ? {
        ...form,
        displayName: form.name,
        canonicalPowerLevelKnown: false,
        description: form.description,
      }
    : BENCHMARK_BY_ID[id];
  useEffect(() => {
    if (b) dialog.current?.showModal();
  }, [id, form]);
  if (!b) return null;
  const source = b.sourceId ? SOURCES[b.sourceId] : null;
  const peers = BENCHMARKS.filter(
    (other) => other.powerLevel === b.powerLevel && other.id !== b.id,
  );
  return (
    <dialog
      ref={dialog}
      className="modal panel benchmark-detail"
      aria-labelledby="benchmark-title"
      onCancel={onClose}
    >
      <div className="section-heading">
        <span className="eyebrow">
          {form ? "Dragon Ball form / technique" : benchmarkEvidence(b)}
        </span>
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
        {form
          ? "Your fighter · Dragon Ball forms & techniques"
          : `${b.era} · ${b.continuity}`}
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
          <dd>
            {form
              ? "Dragon Ball forms & techniques"
              : TIERS.find((t) => t.id === b.tier)?.name}
          </dd>
        </div>
      </dl>
      <LiftTargets
        strength={strength}
        powerLevel={b.powerLevel}
        unit={unit}
        title={
          form ? "TO UNLOCK THIS TRANSFORMATION" : "TO REACH THIS BENCHMARK"
        }
      />
      {peers.length ? (
        <p className="small muted">
          Shared band: {peers.map((p) => p.displayName).join("; ")}.
        </p>
      ) : null}
      {form ? (
        <p className="small muted">
          A Dragon Ball name applied to your fighter. Its unlock weight is part
          of this app’s progression system. Higher-power character benchmarks
          continue after the last transformation.
        </p>
      ) : source ? (
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
