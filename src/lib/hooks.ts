"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseApiResult<T> {
  data: T | null;
  /** true only while there is no data yet (first load) */
  loading: boolean;
  /** true while a refetch runs with previous data still shown */
  refreshing: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch on mount and whenever `deps` change. Cancels on unmount. A refetch
 * keeps the previous data on screen (no spinner flash) and reports
 * `refreshing` instead; `loading` is only true before the first result.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);
  const hasData = useRef(false);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    if (hasData.current) setRefreshing(true);
    else setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (cancelled) return;
        hasData.current = true;
        setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || "An error occurred");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, ...deps]);

  return { data, loading, refreshing, error, refetch };
}

/**
 * Run `fn` every `ms` while the tab is visible. Always calls the LATEST `fn`
 * (no stale closures), runs once immediately when the tab becomes visible
 * again, and never overlaps runs. Pass `ms = 0` to disable.
 */
export function usePolling(fn: () => void | Promise<void>, ms: number, enabled = true): void {
  const latest = useRef(fn);
  latest.current = fn;

  useEffect(() => {
    if (!enabled || ms <= 0) return;
    let running = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      if (running || document.visibilityState !== "visible") return;
      running = true;
      try { await latest.current(); } catch { /* the caller's fn reports its own errors */ }
      finally { running = false; }
    };
    const start = () => { if (!timer) timer = setInterval(tick, ms); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const onVisibility = () => { if (document.visibilityState === "visible") { tick(); start(); } else stop(); };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [ms, enabled]);
}

/**
 * Wrap an async action: shows a toast on failure instead of a silent
 * console.error, returns null on failure so callers can bail.
 */
export function useAsyncAction() {
  const [busy, setBusy] = useState<string | null>(null);
  const run = useCallback(async <R,>(key: string, fn: () => Promise<R>, opts: { success?: string; error?: string } = {}): Promise<R | null> => {
    const { toast } = await import("sonner");
    setBusy(key);
    try {
      const r = await fn();
      if (opts.success) toast.success(opts.success);
      return r;
    } catch (err: any) {
      toast.error(opts.error || "Action failed", { description: err?.message });
      return null;
    } finally {
      setBusy(null);
    }
  }, []);
  return { busy, run };
}

/**
 * useState that mirrors into the URL query string (?key=value), so filters,
 * tabs and the selected row survive refresh and can be shared as a link.
 * Uses history.replaceState directly to avoid a Next.js navigation per keystroke.
 */
export function useUrlState<T extends string>(key: string, initial: T): [T, (v: T | null) => void] {
  const read = (): T => {
    if (typeof window === "undefined") return initial;
    const v = new URLSearchParams(window.location.search).get(key);
    return (v as T) ?? initial;
  };
  // start from `initial` on both server and client, then adopt the URL value
  // after mount, so server and client markup match (no hydration mismatch)
  const [value, setValue] = useState<T>(initial);
  useEffect(() => { setValue(read()); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback((v: T | null) => {
    setValue(v ?? initial);
    const url = new URL(window.location.href);
    if (v == null || v === initial) url.searchParams.delete(key); else url.searchParams.set(key, v);
    window.history.replaceState(window.history.state, "", url.toString());
  }, [key, initial]);
  useEffect(() => {
    const onPop = () => setValue(read());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [value, set];
}
