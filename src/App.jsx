import { useEffect, useMemo, useState } from "react";
import { useDashboard } from "./lib/useDashboard";
import { dashboard } from "./lib/scoring.mjs";
import { demoSnapshots } from "./lib/demo.mjs";
import { Brand, Icon } from "./components/Icons";
import {
  ConsistencyPanel,
  Rhythm,
  LiftRecords,
  ActivityList,
} from "./components/Dashboard";
import { Journey } from "./components/Journey";
import { FighterProfile } from "./components/FighterProfile";
import { StrengthReferences } from "./components/StrengthReferences";
import { PowerProfile } from "./components/PowerProfile";
import { BenchmarkDetail } from "./components/BenchmarkDetail";
import { Ranked } from "./components/Ranked";
import { History } from "./components/History";
import { Connect } from "./components/Connect";
const nav = [
  ["home", "Home", "Overview"],
  ["forms", "Journey", "Power journey"],
  ["rank", "Rank", "Ranked journey"],
  ["history", "History", "Training log"],
  ["sync", "Sync", "Connect data"],
];
function validTab() {
  return nav.some(([id]) => id === location.hash.slice(1))
    ? location.hash.slice(1)
    : "home";
}
export default function App() {
  const store = useDashboard();
  const [tab, setTab] = useState(validTab);
  const [demo, setDemo] = useState(false);
  const [benchmarkId, setBenchmarkId] = useState(null);
  const [install, setInstall] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [update, setUpdate] = useState(null);
  useEffect(() => {
    const hash = () => setTab(validTab());
    window.addEventListener("hashchange", hash);
    const installHandler = (e) => {
      e.preventDefault();
      setInstall(e);
    };
    const network = () => setOnline(navigator.onLine);
    const ready = (e) => setUpdate(() => e.detail);
    window.addEventListener("beforeinstallprompt", installHandler);
    window.addEventListener("online", network);
    window.addEventListener("offline", network);
    window.addEventListener("powerlevel:update", ready);
    return () => {
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("beforeinstallprompt", installHandler);
      window.removeEventListener("online", network);
      window.removeEventListener("offline", network);
      window.removeEventListener("powerlevel:update", ready);
    };
  }, []);
  function navigate(next) {
    location.hash = next;
    setTab(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const snapshots = useMemo(
    () => (demo ? demoSnapshots(store.today) : store.snapshots),
    [demo, store.today, store.snapshots],
  );
  const data = useMemo(
    () =>
      dashboard(
        snapshots,
        store.today,
        store.prefs.target,
        store.prefs.profile,
      ),
    [snapshots, store.today, store.prefs.target, store.prefs.profile],
  );
  // Demo and unrealized potential never dress the saved profile in an unearned aura.
  const earnedTransformation = useMemo(
    () =>
      demo
        ? dashboard(
            store.snapshots,
            store.today,
            store.prefs.target,
            store.prefs.profile,
          ).strength.progression.transformation
        : data.strength.progression.transformation,
    [
      demo,
      data,
      store.snapshots,
      store.today,
      store.prefs.target,
      store.prefs.profile,
    ],
  );
  const hasData = data.events.length > 0;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Main navigation">
          {nav.map(([id, , long]) => (
            <button
              key={id}
              className={id === tab ? "active" : ""}
              onClick={() => navigate(id)}
              aria-current={id === tab ? "page" : undefined}
            >
              <Icon name={id} />
              <span>{long}</span>
            </button>
          ))}
        </nav>
        <p>
          Your effort.
          <br />
          Your evolution.
        </p>
      </aside>
      <main>
        <header className="mobile-header">
          <Brand />
          <button
            className={`icon-button ${store.busy ? "spinning" : ""}`}
            aria-label="Refresh workout histories"
            onClick={store.refresh}
            disabled={store.busy}
          >
            <Icon name="sync" />
          </button>
        </header>
        {demo ? (
          <div className="demo-banner" role="status">
            <span>Demo preview · Illustrative data</span>
            <button onClick={() => setDemo(false)}>
              Exit demo <Icon name="close" size={16} />
            </button>
          </div>
        ) : null}
        {!online || store.error ? (
          <div className="notice">
            <Icon name="info" />
            <p>
              {store.error ||
                "You’re offline. Your saved dashboard is still available."}
            </p>
          </div>
        ) : null}
        {update ? (
          <div className="notice">
            <p>A new version of Powerlevel is ready.</p>
            <button className="text-button" onClick={() => update(true)}>
              Update app
            </button>
          </div>
        ) : null}
        {tab === "home" ? (
          <>
            <div className="page-heading home-heading">
              <div>
                <h1>
                  Your power. <span className="lime">Your story.</span>
                </h1>
                <p>Your strength, translated into Dragon Ball.</p>
              </div>
              <button
                className="desktop-connect secondary-button"
                onClick={() => navigate("sync")}
              >
                <Icon name="link" size={18} />
                Connect data
              </button>
            </div>
            {!hasData && !demo ? (
              <div className="welcome">
                <div>
                  <strong>Let your history do the talking.</strong>
                  <p>Pair your trackers once to reveal your form and rank.</p>
                </div>
                <div className="button-row">
                  <button
                    className="primary-button"
                    onClick={() => navigate("sync")}
                  >
                    Connect trackers <Icon name="arrow" size={18} />
                  </button>
                  <button className="text-button" onClick={() => setDemo(true)}>
                    Preview the dashboard
                  </button>
                </div>
              </div>
            ) : null}
            <FighterProfile
              profile={store.prefs.profile}
              transformation={earnedTransformation}
              unit={store.prefs.unit}
              onSave={(profile) => store.preferences({ profile })}
            />
            <div className="hero-grid fighter-grid">
              <PowerProfile
                data={data.strength}
                unit={store.prefs.unit}
                onJourney={() => navigate("forms")}
                onInspect={setBenchmarkId}
              />
              <ConsistencyPanel
                data={data.consistency}
                onRank={() => navigate("rank")}
              />
            </div>
            <details className="panel dashboard-disclosure">
              <summary>
                Training details{" "}
                <span>Rhythm, best lifts & recent sessions</span>
              </summary>
              <div className="dashboard-disclosure-body">
                <Rhythm data={data.consistency} today={store.today} />
                <div className="lower-grid">
                  <LiftRecords data={data.strength} unit={store.prefs.unit} />
                  <section className="panel recent">
                    <div className="section-heading">
                      <h2>RECENT TRAINING</h2>
                      <button
                        className="text-button"
                        onClick={() => navigate("history")}
                      >
                        View all <Icon name="arrow" size={15} />
                      </button>
                    </div>
                    <ActivityList
                      events={data.events}
                      unit={store.prefs.unit}
                      limit={4}
                    />
                  </section>
                </div>
              </div>
            </details>
            <details className="panel dashboard-disclosure">
              <summary>
                Public lifting comparisons{" "}
                <span>Fixed reference · Sep 2026</span>
              </summary>
              <div className="dashboard-disclosure-body">
                <StrengthReferences
                  strength={data.strength}
                  unit={store.prefs.unit}
                />
              </div>
            </details>
            {data.future ? (
              <p className="footnote">
                {data.future} future-dated records are excluded until their date
                arrives.
              </p>
            ) : null}
            <div className="sync-footer">
              <Icon name="lock" size={13} />
              <span>
                {demo
                  ? "Illustrative data. Your actual ranks come from connected history."
                  : store.busy
                    ? "Checking your workout histories…"
                    : store.code
                      ? "Encrypted sync · Refreshes whenever you return"
                      : "Your history stays yours."}
              </span>
            </div>
          </>
        ) : tab === "forms" ? (
          <Journey
            strength={data.strength}
            unit={store.prefs.unit}
            onInspect={setBenchmarkId}
          />
        ) : tab === "rank" ? (
          <Ranked
            data={data.consistency}
            prefs={store.prefs}
            onPreferences={store.preferences}
          />
        ) : tab === "history" ? (
          <History
            data={data}
            unit={store.prefs.unit}
            onUnit={(unit) => store.preferences({ unit })}
          />
        ) : (
          <Connect
            store={store}
            onDemo={() => {
              setDemo(true);
              navigate("home");
            }}
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
      {benchmarkId ? (
        <BenchmarkDetail
          id={benchmarkId}
          strength={data.strength}
          unit={store.prefs.unit}
          onClose={() => setBenchmarkId(null)}
        />
      ) : null}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {nav.map(([id, short]) => (
          <button
            key={id}
            className={id === tab ? "active" : ""}
            onClick={() => navigate(id)}
            aria-current={id === tab ? "page" : undefined}
          >
            <Icon name={id} size={23} />
            <span>{short}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
