import { useCallback, useEffect, useRef, useState } from "react";
import {
  BODYWEIGHT_KEY,
  initialBodyweightState,
  validateBodyweightState,
  updateBodyweight,
  localDay,
} from "../../public/shared/bodyweight.mjs";
import { normalizeHistory } from "../../public/shared/history.mjs";
import {
  cleanCode,
  getHistory,
  putHistory,
} from "../../public/shared/sync.mjs";
const PAIRING = "away-strength:pairing:v1";
const SYNCED = "away-strength:last-sync:v1";
const RECOVERY = "away-strength:before-import:v1";
function load() {
  try {
    const raw = localStorage.getItem(BODYWEIGHT_KEY);
    return {
      raw,
      state: raw
        ? validateBodyweightState(JSON.parse(raw))
        : initialBodyweightState(),
      error: "",
      blocked: false,
    };
  } catch {
    return {
      raw: null,
      state: initialBodyweightState(),
      error:
        "Saved data could not be read. Export the stored data before restoring a backup. Your existing data has not been replaced.",
      blocked: true,
    };
  }
}
export function useTracker() {
  const [initial] = useState(load);
  const [state, setState] = useState(initial.state),
    [error, setError] = useState(initial.error);
  const current = useRef(initial);
  const [today, setToday] = useState(localDay);
  useEffect(() => {
    const refreshDay = () => setToday(localDay());
    const refreshStorage = (e) => {
      if (e.key === BODYWEIGHT_KEY) {
        const loaded = load();
        current.current = loaded;
        setState(loaded.state);
        setError(loaded.error);
      }
    };
    window.addEventListener("storage", refreshStorage);
    window.addEventListener("focus", refreshDay);
    document.addEventListener("visibilitychange", refreshDay);
    const timer = setInterval(refreshDay, 30000);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", refreshStorage);
      window.removeEventListener("focus", refreshDay);
      document.removeEventListener("visibilitychange", refreshDay);
    };
  }, []);
  const commit = useCallback((next, restore = false) => {
    if (current.current.blocked && !restore)
      throw new Error("Restore a valid backup before logging more workouts.");
    const stored = localStorage.getItem(BODYWEIGHT_KEY);
    if (!restore && stored !== current.current.raw)
      throw new Error(
        "This tracker changed in another window. Reload before logging again.",
      );
    validateBodyweightState(next);
    if (restore && stored) localStorage.setItem(RECOVERY, stored);
    const raw = JSON.stringify(next);
    localStorage.setItem(BODYWEIGHT_KEY, raw);
    current.current = { raw, state: next, blocked: false, error: "" };
    setState(next);
    setError("");
  }, []);
  const act = useCallback(
    (action) => {
      try {
        commit(updateBodyweight(current.current.state, action, localDay()));
        return true;
      } catch (e) {
        setError(
          e.message ||
            "Your device could not save this change. Free some storage and try again.",
        );
        return false;
      }
    },
    [commit],
  );
  function restore(candidate) {
    try {
      commit(candidate, true);
      return true;
    } catch (e) {
      setError(e.message || "The backup could not be restored.");
      return false;
    }
  }
  return {
    state,
    today,
    error,
    act,
    restore,
    clearError: () => setError(""),
    blocked: current.current.blocked,
  };
}
function readPairing() {
  try {
    return cleanCode(localStorage.getItem(PAIRING) || "");
  } catch {
    return "";
  }
}
export function useTrackerSync(state, blocked) {
  const [code, setCode] = useState(readPairing),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const [lastSync, setLastSync] = useState(() => {
    try {
      return localStorage.getItem(SYNCED) || "";
    } catch {
      return "";
    }
  });
  const [conflict, setConflict] = useState(null);
  const latest = useRef({ state, code, blocked });
  latest.current = { state, code, blocked };
  const flight = useRef(false),
    sent = useRef(""),
    generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = latest.current;
    if (
      !current.code ||
      current.blocked ||
      flight.current ||
      document.visibilityState === "hidden"
    )
      return;
    const snapshot = normalizeHistory("bodyweight", current.state),
      fingerprint = `${current.code}:${JSON.stringify(snapshot)}`;
    if (fingerprint === sent.current) return;
    flight.current = true;
    setBusy(true);
    const gen = generation.current;
    setStatus("Syncing encrypted history…");
    try {
      const result = await putHistory(current.code, snapshot);
      if (gen === generation.current) {
        sent.current = fingerprint;
        setLastSync(result.updatedAt);
        setStatus("Connected · history is up to date.");
        try {
          localStorage.setItem(SYNCED, result.updatedAt);
        } catch {
          /* History was uploaded even if the status cannot be cached. */
        }
      }
    } catch (e) {
      if (gen === generation.current)
        setStatus(
          e.message ||
            "Offline. Saved workouts will sync when you return online.",
        );
    } finally {
      flight.current = false;
      if (gen === generation.current) setBusy(false);
    }
  }, []);
  useEffect(() => {
    const timer = setTimeout(refresh, 500);
    return () => clearTimeout(timer);
  }, [state, code, blocked, refresh]);
  useEffect(() => {
    const timer = setInterval(refresh, 15000);
    window.addEventListener("online", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [refresh]);
  function saveCode(candidate) {
    localStorage.setItem(PAIRING, candidate);
    generation.current++;
    sent.current = "";
    setCode(candidate);
    setConflict(null);
    setStatus("Connected. Your next sync is starting.");
  }
  async function pair(value) {
    setBusy(true);
    try {
      const candidate = cleanCode(value),
        remote = await getHistory(candidate, "bodyweight");
      const local = normalizeHistory("bodyweight", latest.current.state);
      if (
        remote?.snapshot.events.length &&
        JSON.stringify(remote.snapshot.events) !== JSON.stringify(local.events)
      ) {
        setConflict({
          code: candidate,
          records: remote.snapshot.events.length,
        });
        setStatus("This connection already has different bodyweight history.");
      } else saveCode(candidate);
    } catch (e) {
      setStatus(e.message);
    } finally {
      setBusy(false);
    }
  }
  function replaceRemote() {
    try {
      if (conflict) saveCode(conflict.code);
    } catch {
      setStatus("The connection could not be saved on this device.");
    }
  }
  function disconnect() {
    try {
      localStorage.removeItem(PAIRING);
      localStorage.removeItem(SYNCED);
      generation.current++;
      setCode("");
      setConflict(null);
      setLastSync("");
      setStatus("Disconnected. Your workouts are still saved here.");
      setBusy(false);
    } catch {
      setStatus("The connection could not be removed.");
    }
  }
  return {
    code,
    status,
    busy,
    lastSync,
    conflict,
    cancelConflict: () => setConflict(null),
    pair,
    replaceRemote,
    disconnect,
    refresh,
  };
}
