import React, { useEffect, useRef, useState } from "react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import {
  BODYWEIGHT_KEY,
  BODYWEIGHT_EXERCISES,
  OUTCOMES,
  prescription,
  nextLevel,
  maxLevel,
  entryFor,
  canEdit,
  validateBodyweightState,
} from "../../public/shared/bodyweight.mjs";
import { useTracker, useTrackerSync } from "./store";
import "./style.css";

const NAV = ["Today", "Progress", "History", "Sync"];
const fmtDate = (date) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
const dose = (level, base) => {
  const p = prescription(level, base);
  return `${p.sets} × ${p.reps}`;
};
function Icon({ name, size = 22 }) {
  const paths = {
    Today: (
      <>
        <path d="m3 10 9-7 9 7v10H3z" />
        <path d="M9 20v-7h6v7" />
      </>
    ),
    Progress: (
      <>
        <path d="M5 20V13M12 20V8M19 20V3" strokeWidth="4" />
      </>
    ),
    History: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6h5" />
      </>
    ),
    Sync: (
      <>
        <path d="M21 9a9 9 0 0 0-15-6L3 6m0-5v5h5M3 15a9 9 0 0 0 15 6l3-3m0 5v-5h-5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 2v6m10-6v6M3 11h18" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    check: <path d="m4 12 5 5L20 6" />,
    arrow: <path d="m9 5 7 7-7 7" />,
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] || paths.Progress}
    </svg>
  );
}
function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="sheet"
      onCancel={onClose}
      aria-labelledby="sheet-title"
    >
      <div className="sheet-heading">
        <h2 id="sheet-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function RestTimer({ until, onClose }) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, Math.ceil((until - now) / 1000));
  return (
    <aside className="timer" aria-label="Rest timer">
      <Icon name="History" />
      <span>{remaining ? "Rest" : "Rest timer finished"}</span>
      <strong>
        {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
      </strong>
      <button
        className="icon-button"
        aria-label="Dismiss rest timer"
        onClick={onClose}
      >
        <Icon name="close" size={18} />
      </button>
    </aside>
  );
}
function ExerciseCard({ exercise, index, state, date, onModal, act }) {
  const entry = entryFor(state, date, exercise.id),
    program = state.programs[exercise.id];
  const lane = entry || program.lanes[program.variant],
    p = prescription(lane.level, lane.baseReps);
  const recorded = entry?.actualReps || [],
    editable = canEdit(state, date, exercise.id);
  const complete = recorded.length === p.sets;
  return (
    <article
      className={`exercise-card ${entry?.outcome ? "finished" : ""}`}
      aria-label={exercise.name}
    >
      <div className="exercise-heading">
        <span className="ordinal">{String(index + 1).padStart(2, "0")}</span>
        <h2>{exercise.name}</h2>
        <span className="level">Level {lane.level}</span>
      </div>
      <div className="dose">
        {p.sets} × {p.reps}
      </div>
      <div className="dose-caption">
        sets × reps
        {(entry?.variant || program.variant) !== exercise.variants[0]
          ? ` · ${entry?.variant || program.variant}`
          : ""}
      </div>
      {recorded.length ? (
        <div className="set-results" aria-label="Recorded sets">
          {recorded.map((reps, i) => (
            <span key={i}>
              <Icon name="check" size={14} /> Set {i + 1}: {reps}
            </span>
          ))}
        </div>
      ) : null}
      {entry?.outcome ? (
        <>
          <div className="result-summary">
            <strong>{OUTCOMES[entry.outcome]}</strong>
            <span>
              Next:{" "}
              {dose(
                nextLevel(entry.level, entry.baseReps, entry.outcome),
                entry.baseReps,
              )}
            </span>
          </div>
          {editable ? (
            <button
              className="text-button"
              onClick={() =>
                act({ type: "undo", date, exerciseId: exercise.id })
              }
            >
              Undo result
            </button>
          ) : null}
        </>
      ) : editable ? (
        <div className="card-actions">
          <button
            className="primary"
            onClick={() =>
              onModal({ kind: complete ? "finish" : "log", id: exercise.id })
            }
          >
            {complete ? "Finish exercise" : "Log set"}
          </button>
          <button
            className="text-button"
            onClick={() => onModal({ kind: "adjust", id: exercise.id })}
          >
            Adjust
          </button>
        </div>
      ) : (
        <p className="muted">Past workout · a newer session exists</p>
      )}
    </article>
  );
}
function LogModal({ exercise, entry, lane, onSave, onClose }) {
  const p = prescription(lane.level, lane.baseReps),
    [reps, setReps] = useState(p.reps);
  return (
    <Modal title={exercise.name} onClose={onClose}>
      <p>
        Set {(entry?.actualReps.length || 0) + 1} of {p.sets} · target {p.reps}{" "}
        reps
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(Number(reps));
        }}
      >
        <label className="field">
          Actual reps
          <input
            autoFocus
            inputMode="numeric"
            type="number"
            min="0"
            max="99"
            step="1"
            required
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </label>
        <p className="muted">{exercise.cue}</p>
        <button className="primary full" type="submit">
          Save set
        </button>
      </form>
    </Modal>
  );
}
function FinishModal({ exercise, entry, onFinish, onClose }) {
  const [note, setNote] = useState("");
  const p = prescription(entry.level, entry.baseReps);
  const all =
    entry.actualReps.length === p.sets &&
    entry.actualReps.every((n) => n >= p.reps);
  const choice = (outcome) => onFinish(outcome, note);
  return (
    <Modal title="How did it feel?" onClose={onClose}>
      <p>
        {exercise.name} · {entry.actualReps.join(" + ")} reps
      </p>
      <label className="field">
        Notes <span className="muted">(optional)</span>
        <textarea
          maxLength="500"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="How it felt, push-up height, or anything to remember"
        />
      </label>
      <div className="choices">
        {all ? (
          <>
            <button className="primary" onClick={() => choice("comfortable")}>
              {nextLevel(entry.level, entry.baseReps, "comfortable") ===
              entry.level
                ? "Comfortable · maintain"
                : "Comfortable · move up"}
              <small>
                At least 2 good reps left · next{" "}
                {dose(
                  nextLevel(entry.level, entry.baseReps, "comfortable"),
                  entry.baseReps,
                )}
              </small>
            </button>
            <button className="secondary" onClick={() => choice("repeat")}>
              Comfortable · repeat
              <small>Keep this level for recovery or practice</small>
            </button>
            <button className="secondary" onClick={() => choice("hard")}>
              Hard · repeat
              <small>
                Completed, but little left · keep{" "}
                {dose(entry.level, entry.baseReps)}
              </small>
            </button>
          </>
        ) : (
          <button className="primary" onClick={() => choice("short")}>
            {nextLevel(entry.level, entry.baseReps, "short") === entry.level
              ? "Stopped early · hold level"
              : "Stopped early · make it easier"}
            <small>
              Next{" "}
              {dose(
                nextLevel(entry.level, entry.baseReps, "short"),
                entry.baseReps,
              )}
            </small>
            {nextLevel(entry.level, entry.baseReps, "short") === entry.level ? (
              <small>
                Choose fewer starting reps or an easier variation next time.
              </small>
            ) : null}
          </button>
        )}
      </div>
      <p className="muted small">
        Stop if a movement hurts. You don’t need to reach failure to log a
        useful session.
      </p>
    </Modal>
  );
}
function AdjustModal({
  exercise,
  program,
  entry,
  onApply,
  onUndo,
  onFinish,
  onClose,
}) {
  const [variant, setVariant] = useState(program.variant),
    [base, setBase] = useState(program.lanes[program.variant].baseReps),
    [level, setLevel] = useState(program.lanes[program.variant].level);
  return (
    <Modal title={`Adjust ${exercise.name.toLowerCase()}`} onClose={onClose}>
      {entry ? (
        <>
          <p>
            {entry.actualReps.length} set
            {entry.actualReps.length === 1 ? "" : "s"} saved. Undo the sets
            before changing this exercise’s setup.
          </p>
          <div className="choices">
            <button className="secondary" onClick={onUndo}>
              Undo last set
            </button>
            {entry.actualReps.length ? (
              <button className="secondary" onClick={() => onFinish("short")}>
                Stop here · save attempt
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onApply({ variant, level: Number(level), baseReps: Number(base) });
          }}
        >
          <label className="field">
            Variation
            <select
              value={variant}
              onChange={(e) => {
                const value = e.target.value;
                setVariant(value);
                setBase(program.lanes[value].baseReps);
                setLevel(program.lanes[value].level);
              }}
            >
              {exercise.variants.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Starting reps
            <select
              value={base}
              onChange={(e) => {
                setBase(Number(e.target.value));
                setLevel(1);
              }}
            >
              {[2, 4, 6, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n} reps
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Current level
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value))}
            >
              {Array.from({ length: maxLevel(Number(base)) }, (_, i) => (
                <option key={i} value={i + 1}>
                  Level {i + 1} · {dose(i + 1, Number(base))}
                </option>
              ))}
            </select>
          </label>
          <p className="muted">
            Each variation keeps its own level. Use a manageable starting point;
            bodyweight is real resistance.
          </p>
          <button className="primary full" type="submit">
            Save setup
          </button>
          <button
            className="text-button full"
            type="button"
            onClick={() => onFinish("skipped")}
          >
            Skip this exercise today
          </button>
        </form>
      )}
    </Modal>
  );
}
function Progress({ state }) {
  return (
    <>
      <div className="page-heading">
        <h1>Build at your pace.</h1>
        <p>Three independent ladders. Every set saved.</p>
      </div>
      {BODYWEIGHT_EXERCISES.map((e) => {
        const program = state.programs[e.id],
          lane = program.lanes[program.variant];
        const recent = state.sessions
          .flatMap((s) => s.exercises)
          .filter(
            (x) =>
              x.exerciseId === e.id &&
              x.variant === program.variant &&
              ["comfortable", "hard", "repeat"].includes(x.outcome),
          );
        const best = Math.max(
          0,
          ...recent.map((x) => x.actualReps.reduce((a, b) => a + b, 0)),
        );
        return (
          <section className="panel progress-panel" key={e.id}>
            <div className="section-heading">
              <h2>{e.name}</h2>
              <span>{program.variant}</span>
            </div>
            <div className="progress-stats">
              <div>
                <strong>{dose(lane.level, lane.baseReps)}</strong>
                <span>Next workout</span>
              </div>
              <div>
                <strong>{best || "—"}</strong>
                <span>Best session reps</span>
              </div>
            </div>
            <div className="ladder" aria-label={`${e.name} level ladder`}>
              {Array.from({ length: maxLevel(lane.baseReps) }, (_, i) => (
                <span
                  key={i}
                  className={i + 1 === lane.level ? "current" : ""}
                  aria-current={i + 1 === lane.level ? "step" : undefined}
                >
                  {dose(i + 1, lane.baseReps)}
                </span>
              ))}
            </div>
          </section>
        );
      })}
      <section className="panel explanation">
        <h2>How the ladder works</h2>
        <p>
          Start with 1 × 10. A comfortable completion adds a set, up to 3 sets.
          Then return to 1 set with 2 more reps: 1 × 12, 2 × 12, 3 × 12, and so
          on.
        </p>
        <p>
          A hard completion repeats the same level. Stopping early reduces a
          set; at one set, it reduces reps by 2 if available. At the first
          level, repeat or choose fewer starting reps in Adjust.
        </p>
        <p>
          The ladder stops at 3 × 20. Maintain it or select a different
          variation when ready. The ladder is a tracking rule, not a strength
          equivalence or a researched daily progression formula.
        </p>
        <p>
          Use roughly three nonconsecutive demanding sessions per week as a
          starting point. Daily check-ins can include rest or easy repeats. Rest
          days preserve your levels and do not earn a training day.
        </p>
        <a
          href="https://acsm.org/resistance-training-guidelines-update-2026/"
          target="_blank"
          rel="noreferrer"
        >
          Read ACSM’s resistance training guidance ↗
        </a>
      </section>
    </>
  );
}
function History({ state, today, onResume, act }) {
  const sessions = [...state.sessions].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  return (
    <>
      <div className="page-heading">
        <h1>Every effort counts.</h1>
        <p>Your actual sets, on the day you did them.</p>
      </div>
      {!sessions.length ? (
        <div className="panel empty">
          <Icon name="History" size={34} />
          <h2>Your first session starts the story.</h2>
          <p>Log a set in Today. It will appear here immediately.</p>
        </div>
      ) : (
        sessions.map((s) => (
          <section className="panel history-session" key={s.id}>
            <div className="section-heading">
              <h2>{fmtDate(s.date)}</h2>
              <span>
                {s.rest
                  ? "Rest day"
                  : `${s.exercises.reduce((sum, e) => sum + e.actualReps.reduce((a, b) => a + b, 0), 0)} reps`}
              </span>
            </div>
            {s.rest ? (
              <p className="muted">
                Recovery recorded. Exercise levels are unchanged.
              </p>
            ) : (
              s.exercises.map((e) => (
                <div className="history-entry" key={e.exerciseId}>
                  <div>
                    <h3>
                      {
                        BODYWEIGHT_EXERCISES.find((x) => x.id === e.exerciseId)
                          .name
                      }
                    </h3>
                    <span>
                      {e.variant} · planned {dose(e.level, e.baseReps)}
                    </span>
                    <p>
                      {e.actualReps.length
                        ? `${e.actualReps.join(" + ")} reps`
                        : "No reps logged"}
                    </p>
                    {e.note ? <p className="note">{e.note}</p> : null}
                  </div>
                  <span className="history-outcome">
                    {OUTCOMES[e.outcome] || "In progress"}
                  </span>
                </div>
              ))
            )}
            {!s.rest &&
            s.date <= today &&
            s.exercises.some((e) => canEdit(state, s.date, e.exerciseId)) ? (
              <button className="text-button" onClick={() => onResume(s.date)}>
                Review / undo latest entries
              </button>
            ) : null}
            {s.rest && s.date === today ? (
              <button
                className="text-button"
                onClick={() => act({ type: "unrest", date: s.date })}
              >
                Resume training today
              </button>
            ) : null}
          </section>
        ))
      )}
    </>
  );
}
function downloadBackup(key = BODYWEIGHT_KEY) {
  const raw = localStorage.getItem(key);
  if (!raw) return false;
  const url = URL.createObjectURL(
      new Blob([raw], { type: "application/json" }),
    ),
    a = document.createElement("a");
  a.href = url;
  a.download = `away-strength-${key === BODYWEIGHT_KEY ? "backup" : "before-import"}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
function Sync({ sync, tracker, install, offlineReady }) {
  const [input, setInput] = useState(""),
    [message, setMessage] = useState(""),
    [backup, setBackup] = useState(null),
    [confirmDisconnect, setConfirmDisconnect] = useState(false);
  async function readBackup(file) {
    try {
      if (!file) return;
      if (file.size > 2000000)
        throw Error("Choose a backup smaller than 2 MB.");
      const value = validateBodyweightState(JSON.parse(await file.text()));
      if (value.sessions.some((s) => s.date > tracker.today))
        throw Error(
          "This backup has future-dated workouts. Restore it after those dates arrive.",
        );
      setBackup(value);
      setMessage("");
    } catch (e) {
      setMessage(e.message || "This backup could not be read.");
    }
  }
  return (
    <>
      <div className="page-heading">
        <h1>Part of your story.</h1>
        <p>Connect your bodyweight work to Powerlevel.</p>
      </div>
      <section className="panel">
        <h2>Dashboard connection</h2>
        <p>
          In Powerlevel, open Sync and copy your private connection code. Paste
          that same code here once.
        </p>
        {!sync.code ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sync.pair(input);
              setInput("");
            }}
          >
            <label className="field">
              Connection code
              <input
                type="password"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck="false"
                required
                placeholder="Paste code from Powerlevel"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </label>
            <button className="primary full" disabled={sync.busy} type="submit">
              {sync.busy ? "Connecting…" : "Connect dashboard"}
            </button>
          </form>
        ) : (
          <div className="connection-state">
            <span className="connected-dot" /> Connected to Powerlevel
            <button
              className="text-button"
              disabled={sync.busy}
              onClick={sync.refresh}
            >
              Sync now
            </button>
          </div>
        )}
        <p role="status">
          {sync.status || "Your workouts are saved on this device."}
        </p>
        {sync.lastSync ? (
          <p className="small muted">
            Last upload: {new Date(sync.lastSync).toLocaleString()}
          </p>
        ) : null}
        <p className="small muted">
          History is encrypted before upload. Pair one Away Strength
          installation per code. Keep this app installed and export a backup
          before switching devices.
        </p>
        {sync.code ? (
          <button
            className="text-button"
            onClick={() => setConfirmDisconnect(true)}
          >
            Disconnect sync
          </button>
        ) : null}
        <a
          className="external-link"
          href={new URL("../", location.href).pathname}
          target="_blank"
          rel="noreferrer"
        >
          Open Powerlevel ↗
        </a>
      </section>
      <section className="panel explanation">
        <h2>How your dashboard counts it</h2>
        <p>
          A day with at least one actual rep counts toward consistency. All
          trackers share one daily credit. Rest days and entirely skipped
          sessions don’t count.
        </p>
        <p>
          Bodyweight records have their own totals. Your squat, bench, and
          deadlift strength total and transformations use barbell records.
        </p>
      </section>
      <section className="panel">
        <h2>Make it your travel app</h2>
        {offlineReady ? (
          <p className="offline-ready" role="status">
            Ready for offline workouts on this installation.
          </p>
        ) : null}
        <p>
          On iPhone, open this page in Safari, then Share → Add to Home Screen.
          Open the installed app online once before traveling; workouts then
          save offline.
        </p>
        {install ? (
          <button className="secondary" onClick={install}>
            Install Away Strength
          </button>
        ) : null}
        <p className="small muted">
          iPhone can store Safari and installed apps separately. Log and pair in
          the installation you intend to keep. Offline history uploads when that
          app is open online.
        </p>
      </section>
      <section className="panel">
        <h2>Timer & backups</h2>
        <label className="field">
          Rest between sets
          <select
            value={tracker.state.restSeconds}
            onChange={(e) =>
              tracker.act({
                type: "restSeconds",
                value: Number(e.target.value),
              })
            }
          >
            {[30, 60, 90, 120, 180, 300].map((n) => (
              <option key={n} value={n}>
                {n} seconds
              </option>
            ))}
          </select>
        </label>
        <div className="button-row">
          <button
            className="secondary"
            onClick={() => {
              try {
                setMessage(
                  downloadBackup()
                    ? "Backup downloaded. It contains workouts and levels, without your connection code."
                    : "Log a workout or save a setup first to create a backup.",
                );
              } catch {
                setMessage("The backup could not be downloaded.");
              }
            }}
          >
            Export backup
          </button>
          <label className="secondary file-button">
            Import backup
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                readBackup(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {message ? <p role="status">{message}</p> : null}
        <button
          className="text-button"
          onClick={() => {
            try {
              setMessage(
                downloadBackup("away-strength:before-import:v1")
                  ? "Previous data downloaded."
                  : "No previous import to recover on this installation.",
              );
            } catch {
              setMessage("The previous data could not be exported.");
            }
          }}
        >
          Export data from before last import
        </button>
      </section>
      {backup ? (
        <Modal title="Restore this backup?" onClose={() => setBackup(null)}>
          <p>
            This replaces this installation’s workouts and levels with{" "}
            {backup.sessions.length} saved days. If connected, the dashboard
            will receive this restored history. Your current data is kept in a
            local recovery copy.
          </p>
          <div className="button-row">
            <button className="secondary" onClick={() => setBackup(null)}>
              Cancel
            </button>
            <button
              className="primary"
              onClick={() => {
                if (tracker.restore(backup)) {
                  setBackup(null);
                  setMessage("Backup restored.");
                }
              }}
            >
              Restore backup
            </button>
          </div>
        </Modal>
      ) : null}
      {sync.conflict ? (
        <Modal title="History already exists" onClose={sync.cancelConflict}>
          <p>
            This code already connects {sync.conflict.records} bodyweight
            records from another installation. Import its backup here first to
            keep that history, or explicitly replace its dashboard snapshot with
            this installation’s history.
          </p>
          <div className="choices">
            <button className="secondary" onClick={sync.cancelConflict}>
              Cancel connection
            </button>
            <button className="secondary" onClick={sync.replaceRemote}>
              Replace synced history with this tracker
            </button>
          </div>
        </Modal>
      ) : null}
      {confirmDisconnect ? (
        <Modal
          title="Disconnect this tracker?"
          onClose={() => setConfirmDisconnect(false)}
        >
          <p>
            Automatic uploads will stop. Your workouts remain on this device and
            the dashboard keeps its last snapshot.
          </p>
          <div className="button-row">
            <button
              className="secondary"
              onClick={() => setConfirmDisconnect(false)}
            >
              Cancel
            </button>
            <button
              className="primary"
              onClick={() => {
                sync.disconnect();
                setConfirmDisconnect(false);
              }}
            >
              Disconnect
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
export default function App() {
  const tracker = useTracker(),
    sync = useTrackerSync(tracker.state, tracker.blocked);
  const [view, setView] = useState(
    () =>
      NAV.find((x) => x.toLowerCase() === location.hash.slice(1)) || "Today",
  );
  const [selectedDate, setSelectedDate] = useState(null),
    [modal, setModal] = useState(null),
    [timer, setTimer] = useState(null);
  const [online, setOnline] = useState(navigator.onLine),
    [offlineReady, setOfflineReady] = useState(false),
    [install, setInstall] = useState(null),
    [update, setUpdate] = useState(null),
    [restConfirm, setRestConfirm] = useState(false);
  const date = selectedDate || tracker.today,
    session = tracker.state.sessions.find((s) => s.date === date);
  const done = session?.exercises.filter((e) => e.outcome).length || 0;
  useEffect(() => {
    const hash = () => {
      setView(
        NAV.find((x) => x.toLowerCase() === location.hash.slice(1)) || "Today",
      );
      setModal(null);
    };
    const network = () => setOnline(navigator.onLine),
      onInstall = (e) => {
        e.preventDefault();
        setInstall(e);
      };
    const ready = (e) => setUpdate(() => e.detail);
    const cached = () => setOfflineReady(true);
    window.addEventListener("hashchange", hash);
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("away:update", ready);
    window.addEventListener("away:offline-ready", cached);
    return () => {
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.removeEventListener("away:update", ready);
      window.removeEventListener("away:offline-ready", cached);
    };
  }, []);
  const navigate = (tab) => {
    location.hash = tab.toLowerCase();
    setView(tab);
    setSelectedDate(null);
    setModal(null);
    window.scrollTo({ top: 0 });
  };
  const exercise = modal
    ? BODYWEIGHT_EXERCISES.find((e) => e.id === modal.id)
    : null;
  const entry = exercise ? entryFor(tracker.state, date, exercise.id) : null,
    program = exercise ? tracker.state.programs[exercise.id] : null;
  const finish = (outcome, note = "") => {
    if (
      tracker.act({
        type: "finish",
        date,
        exerciseId: exercise.id,
        outcome,
        note,
      })
    ) {
      setModal(null);
    }
  };
  const yesterday = new Date(`${date}T12:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const previousDay = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  const trainedYesterday = tracker.state.sessions.some(
    (s) =>
      s.date === previousDay &&
      s.exercises.some((e) => e.actualReps.some((n) => n > 0)),
  );
  return (
    <div className="app">
      <header className="app-header">
        <a className="brand" href="#today" onClick={() => navigate("Today")}>
          <Icon name="Progress" size={24} />
          <span>Away Strength</span>
        </a>
        <button
          className={`icon-button ${sync.busy ? "spinning" : ""}`}
          aria-label="Refresh dashboard sync"
          onClick={() => {
            sync.refresh();
            if (!sync.code) navigate("Sync");
          }}
        >
          <Icon name="Sync" size={25} />
        </button>
      </header>
      <main>
        {!online ? (
          <p className="notice" role="status">
            Offline · workouts save on this device.
          </p>
        ) : null}
        {tracker.error ? (
          <div className="notice error" role="alert">
            {tracker.error}
            <button className="text-button" onClick={() => navigate("Sync")}>
              Backups
            </button>
          </div>
        ) : null}
        {update ? (
          <div className="notice">
            An app update is ready.
            <button className="text-button" onClick={() => update(true)}>
              Update app
            </button>
          </div>
        ) : null}
        {view === "Today" ? (
          <>
            <div className="page-heading">
              <h1>Make today count.</h1>
              <p>Three movements. Your own pace.</p>
            </div>
            <div className="date-row">
              <Icon name="calendar" />
              <span>{fmtDate(date)}</span>
              {selectedDate ? (
                <button
                  className="text-button"
                  onClick={() => {
                    setSelectedDate(null);
                    setModal(null);
                  }}
                >
                  Today
                </button>
              ) : (
                <Icon name="check" size={18} />
              )}
            </div>
            {trainedYesterday && !session?.rest ? (
              <p className="recovery-note">
                You trained yesterday. Consider rest or keep today easy and
                repeat your level.
              </p>
            ) : null}
            {session?.rest ? (
              <section className="panel empty">
                <Icon name="check" size={36} />
                <h2>Recovery is part of it.</h2>
                <p>
                  Rest day saved. Your next workout stays right where you left
                  it.
                </p>
                <button
                  className="secondary"
                  onClick={() => tracker.act({ type: "unrest", date })}
                >
                  Resume training
                </button>
              </section>
            ) : (
              <>
                <div className="day-progress">
                  <span>{done} of 3 exercises logged</span>
                  <div
                    className="track"
                    role="progressbar"
                    aria-label="Exercises finished"
                    aria-valuenow={done}
                    aria-valuemin="0"
                    aria-valuemax="3"
                  >
                    <span style={{ width: `${(done / 3) * 100}%` }} />
                  </div>
                </div>
                <div className="exercise-list">
                  {BODYWEIGHT_EXERCISES.map((e, i) => (
                    <ExerciseCard
                      key={`${date}:${e.id}`}
                      exercise={e}
                      index={i}
                      state={tracker.state}
                      date={date}
                      act={tracker.act}
                      onModal={setModal}
                    />
                  ))}
                </div>
                <p className="pace-note">
                  {done === 3
                    ? "Today is saved. Your next levels are in Progress."
                    : "Keep 2 good reps in reserve."}
                </p>
                {!session?.exercises.length ? (
                  <button
                    className="secondary full rest-day"
                    onClick={() => setRestConfirm(true)}
                  >
                    Take a rest day
                  </button>
                ) : null}
              </>
            )}
          </>
        ) : view === "Progress" ? (
          <Progress state={tracker.state} />
        ) : view === "History" ? (
          <History
            state={tracker.state}
            today={tracker.today}
            act={tracker.act}
            onResume={(value) => {
              navigate("Today");
              setSelectedDate(value);
            }}
          />
        ) : (
          <Sync
            sync={sync}
            tracker={tracker}
            offlineReady={offlineReady}
            install={
              install
                ? async () => {
                    await install.prompt();
                    setInstall(null);
                  }
                : null
            }
          />
        )}
      </main>
      <nav className="bottom-nav" aria-label="Main navigation">
        {NAV.map((tab) => (
          <button
            key={tab}
            aria-current={view === tab ? "page" : undefined}
            onClick={() => navigate(tab)}
          >
            <Icon name={tab} size={24} />
            <span>{tab}</span>
          </button>
        ))}
      </nav>
      {timer ? (
        <RestTimer until={timer} onClose={() => setTimer(null)} />
      ) : null}
      {modal?.kind === "log" ? (
        <LogModal
          key={`${date}:${exercise.id}`}
          exercise={exercise}
          entry={entry}
          lane={entry || program.lanes[program.variant]}
          onClose={() => setModal(null)}
          onSave={(reps) => {
            const p = prescription(
              (entry || program.lanes[program.variant]).level,
              (entry || program.lanes[program.variant]).baseReps,
            );
            if (
              tracker.act({ type: "log", date, exerciseId: exercise.id, reps })
            ) {
              setTimer(Date.now() + tracker.state.restSeconds * 1000);
              setModal(
                (entry?.actualReps.length || 0) + 1 === p.sets
                  ? { kind: "finish", id: exercise.id }
                  : null,
              );
            }
          }}
        />
      ) : null}
      {modal?.kind === "finish" && entry ? (
        <FinishModal
          key={exercise.id}
          exercise={exercise}
          entry={entry}
          onClose={() => setModal(null)}
          onFinish={finish}
        />
      ) : null}
      {modal?.kind === "adjust" ? (
        <AdjustModal
          key={exercise.id}
          exercise={exercise}
          program={program}
          entry={entry}
          onClose={() => setModal(null)}
          onFinish={finish}
          onUndo={() => {
            if (tracker.act({ type: "undo", date, exerciseId: exercise.id }))
              setModal(null);
          }}
          onApply={(values) => {
            if (
              tracker.act({
                type: "adjust",
                date,
                exerciseId: exercise.id,
                ...values,
              })
            )
              setModal(null);
          }}
        />
      ) : null}
      {restConfirm ? (
        <Modal
          title="Take today to recover?"
          onClose={() => setRestConfirm(false)}
        >
          <p>
            This records a rest day and keeps all your exercise levels. It won’t
            count as a training day in Powerlevel.
          </p>
          <div className="button-row">
            <button className="secondary" onClick={() => setRestConfirm(false)}>
              Cancel
            </button>
            <button
              className="primary"
              onClick={() => {
                if (tracker.act({ type: "rest", date })) setRestConfirm(false);
              }}
            >
              Save rest day
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
