import { normalizeProfile } from './profile.mjs';
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SOURCE_KEYS,
  normalizeHistory,
  localDate,
  validateSnapshot,
} from "../../public/shared/history.mjs";
import {
  PAIRING_KEY,
  cleanCode,
  getHistory,
} from "../../public/shared/sync.mjs";
const CACHE = "powerlevel:cache:v1",
  PREFS = "powerlevel:prefs:v1";
function load() {
  try {
    const prefs = JSON.parse(localStorage.getItem(PREFS) || "{}");
    const cache = JSON.parse(localStorage.getItem(CACHE) || "{}");
    const code = localStorage.getItem(PAIRING_KEY) || "";
    const snapshots = {};
    for (const s of Object.keys(SOURCE_KEYS))
      if (cache.snapshots?.[s]) {
        try {
          snapshots[s] = validateSnapshot(cache.snapshots[s], s);
        } catch {}
      }
    return {
      code,
      prefs: {
        target: [2, 3, 4, 5, 6, 7].includes(prefs.target) ? prefs.target : 4,
        unit: prefs.unit === "kg" ? "kg" : "lb",
        profile: normalizeProfile(prefs.profile),
      },
      snapshots,
      sourceStatus: cache.sourceStatus || {},
      error: "",
    };
  } catch {
    return {
      code: "",
      prefs: { target: 4, unit: "lb", profile: normalizeProfile() },
      snapshots: {},
      sourceStatus: {},
      error:
        "Device storage is unavailable. Changes may not survive closing the app.",
    };
  }
}
export function useDashboard() {
  const [initial] = useState(load);
  const [code, setCode] = useState(initial.code);
  const [prefs, setPrefs] = useState(initial.prefs);
  const [snapshots, setSnapshots] = useState(initial.snapshots);
  const [sourceStatus, setSourceStatus] = useState(initial.sourceStatus);
  const [error, setError] = useState(initial.error);
  const [busy, setBusy] = useState(false);
  const [today, setToday] = useState(localDate);
  const generation = useRef(0);
  const busyRef = useRef(false);
  const refresh = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const gen = generation.current;
    setToday(localDate());
    const errors = [];
    const nextSnapshots = {};
    const nextStatus = {};
    await Promise.all(
      Object.keys(SOURCE_KEYS).map(async (source) => {
        try {
          if (code) {
            const result = await getHistory(code, source);
            if (result) {
              nextSnapshots[source] = result.snapshot;
              nextStatus[source] = {
                mode: "cloud",
                updatedAt: result.updatedAt,
                checkedAt: new Date().toISOString(),
                error: null,
              };
            } else {
              nextStatus[source] = {
                mode: "waiting",
                error: null,
                checkedAt: new Date().toISOString(),
              };
            }
          } else {
            const raw = localStorage.getItem(SOURCE_KEYS[source]);
            if (raw) {
              nextSnapshots[source] = normalizeHistory(source, raw);
              nextStatus[source] = {
                mode: "device",
                updatedAt: new Date().toISOString(),
                error: null,
              };
            }
          }
        } catch (e) {
          errors.push(e.message);
          nextStatus[source] = {
            mode: "offline",
            error: e.message,
            checkedAt: new Date().toISOString(),
          };
        }
      }),
    );
    if (gen === generation.current) {
      setSnapshots((previous) => ({ ...previous, ...nextSnapshots }));
      setSourceStatus((previous) =>
        Object.fromEntries(
          Object.keys(SOURCE_KEYS).map((source) => [
            source,
            { ...previous[source], ...nextStatus[source] },
          ]),
        ),
      );
      setError(
        errors.length
          ? "Could not reach sync. Showing your last saved history."
          : "",
      );
    }
    if (gen === generation.current) {
      busyRef.current = false;
      setBusy(false);
    }
  }, [code]);
  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    window.addEventListener("storage", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 60000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
      window.removeEventListener("storage", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(timer);
    };
  }, [refresh]);
  useEffect(() => {
    try {
      localStorage.setItem(CACHE, JSON.stringify({ snapshots, sourceStatus }));
    } catch {
      setError(
        "This device could not save the latest history. Free some storage and refresh.",
      );
    }
  }, [snapshots, sourceStatus]);
  function pair(value) {
    const normalized = cleanCode(value);
    try {
      localStorage.setItem(PAIRING_KEY, normalized);
      localStorage.removeItem(CACHE);
    } catch {
      throw new Error(
        "This device could not save your connection. Free storage and try again.",
      );
    }
    generation.current++;
    busyRef.current = false;
    setBusy(false);
    setSnapshots({});
    setSourceStatus({});
    setCode(normalized);
    setError("");
  }
  function preferences(next) {
    const value = { ...prefs, ...next };
    try {
      localStorage.setItem(PREFS, JSON.stringify(value));
      setPrefs(value);
    } catch {
      setError("Your settings could not be saved.");
    }
  }
  function disconnect() {
    try {
      localStorage.removeItem(PAIRING_KEY);
      localStorage.removeItem(CACHE);
    } catch {
      setError("Your connection could not be removed.");
      return;
    }
    generation.current++;
    busyRef.current = false;
    setBusy(false);
    setCode("");
    setSourceStatus({});
    setSnapshots({});
  }
  return {
    code,
    prefs,
    snapshots,
    sourceStatus,
    error,
    busy,
    today,
    refresh,
    pair,
    preferences,
    disconnect,
  };
}
