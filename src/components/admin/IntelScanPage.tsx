"use client";

import { useState } from "react";
import { Play, Loader2, Clock, type LucideIcon } from "lucide-react";
import { sweetleaseApi } from "@/lib/api";
import { ErrorBanner, EmptyState } from "@/components/ui/AsyncState";

export interface IntelColumn { key: string; label?: string; render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode }
export interface IntelScanConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  endpoint: string;
  body?: Record<string, unknown>;
  /** which key of the response holds the rows (tried in order); arrays are used as-is */
  resultKeys: string[];
  /** explicit columns; if omitted, the first 8 keys of the first row are shown */
  columns?: IntelColumn[];
  runningLabel?: string;
  emptyHint?: string;
}

type Row = Record<string, unknown>;
const cell = (v: unknown) => (v == null ? "-" : typeof v === "object" ? JSON.stringify(v) : String(v));

/**
 * One page for every "run a scan, show the rows" intelligence tool. Each route
 * file only supplies the config, so fixes here reach all of them.
 */
export function IntelScanPage({ icon: Icon, title, description, endpoint, body = {}, resultKeys, columns, runningLabel = "Running scan...", emptyHint = "Click Run Scan to fetch results." }: IntelScanConfig) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runScan = async () => {
    setLoading(true); setError(null);
    try {
      const data = await sweetleaseApi.post<unknown>(endpoint, body);
      setResults(data); setLastRun(new Date().toLocaleString());
    } catch (err: any) { setError(err?.message || "Failed to run scan"); }
    finally { setLoading(false); }
  };

  const rows: Row[] = Array.isArray(results) ? (results as Row[])
    : results && typeof results === "object" ? ((resultKeys.map(k => (results as Row)[k]).find(Array.isArray) as Row[] | undefined) ?? []) : [];
  const cols: IntelColumn[] = columns ?? (rows[0] ? Object.keys(rows[0]).slice(0, 8).map(key => ({ key })) : []);
  const summary = results && typeof results === "object" && !Array.isArray(results)
    ? Object.entries(results as Row).filter(([, v]) => typeof v === "number" || typeof v === "string").slice(0, 4) : [];

  return (
    <div className="max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-amber-600/20 flex items-center justify-center"><Icon size={24} className="text-amber-500" /></div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {lastRun && <span className="flex items-center gap-1.5 text-xs text-slate-500"><Clock size={14} aria-hidden /> Last run: {lastRun}</span>}
          {results != null && <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">{rows.length} results</span>}
          <button onClick={runScan} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2">
            {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Play size={16} aria-hidden />}
            {loading ? "Running..." : "Run Scan"}
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={runScan} className="mb-6" />}

      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
          <Loader2 size={32} className="animate-spin text-amber-500" aria-hidden />
          <p className="text-sm text-slate-500">{runningLabel}</p>
        </div>
      )}

      {!loading && results != null && (
        <div className="space-y-4">
          {summary.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {summary.map(([key, value]) => (
                <div key={key} className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-xs text-slate-500 capitalize">{key.replace(/_/g, " ")}</p>
                  <p className="text-xl font-bold text-slate-900 mt-1 truncate">{String(value)}</p>
                </div>
              ))}
            </div>
          )}
          {rows.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-200 bg-slate-50">
                    {cols.map(c => <th key={c.key} scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">{c.label ?? c.key.replace(/_/g, " ")}</th>)}
                  </tr></thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        {cols.map(c => <td key={c.key} className="px-4 py-3 text-slate-700 max-w-[240px] truncate" title={cell(row[c.key])}>{c.render ? c.render(row[c.key], row) : cell(row[c.key])}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl">
              <EmptyState title="The scan returned no rows" hint="The raw response is below for reference." />
              <details className="px-4 pb-4"><summary className="text-xs text-slate-500 cursor-pointer">Raw response</summary>
                <pre className="mt-2 text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-96">{JSON.stringify(results, null, 2)}</pre></details>
            </div>
          )}
        </div>
      )}

      {!loading && results == null && !error && (
        <div className="bg-white border border-slate-200 rounded-xl"><EmptyState icon={<Icon size={32} className="mx-auto text-slate-300" />} title={title} hint={emptyHint} /></div>
      )}
    </div>
  );
}
