"use client";

import { useState } from "react";
import { Play, Loader2, Clock, type LucideIcon } from "lucide-react";
import { sweetleaseApi } from "@/lib/api";
import { ErrorBanner, EmptyState } from "@/components/ui/AsyncState";
import { Button, Card, StatTile, PageHeader, Badge, Table, THead, TH, TBody, TR, TD } from "@/components/kit";

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
      <PageHeader
        title={<span className="inline-flex items-center gap-2"><Icon size={18} className="text-amber-600" aria-hidden />{title}</span>}
        description={description} meta="Intelligence"
        actions={<>
          {lastRun && <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><Clock size={13} aria-hidden /> Last run {lastRun}</span>}
          {results != null && <Badge tone="success">{rows.length} results</Badge>}
          <Button variant="primary" icon={<Play size={14} />} loading={loading} onClick={runScan}>{loading ? "Running" : "Run scan"}</Button>
        </>}
      />

      {error && <ErrorBanner message={error} onRetry={runScan} className="mb-4" />}

      {loading && (
        <Card className="p-12 flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
          <Loader2 size={28} className="animate-spin text-amber-500" aria-hidden />
          <p className="text-sm text-slate-500">{runningLabel}</p>
        </Card>
      )}

      {!loading && results != null && (
        <div className="space-y-4">
          {summary.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {summary.map(([key, value]) => <StatTile key={key} label={key.replace(/_/g, " ")} value={String(value)} />)}
            </div>
          )}
          {rows.length > 0 ? (
            <Card>
              <Table>
                <THead><tr>{cols.map(c => <TH key={c.key}>{c.label ?? c.key.replace(/_/g, " ")}</TH>)}</tr></THead>
                <TBody>
                  {rows.map((row, i) => (
                    <TR key={i}>{cols.map(c => <TD key={c.key} className="max-w-[240px] truncate" title={cell(row[c.key])}>{c.render ? c.render(row[c.key], row) : cell(row[c.key])}</TD>)}</TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <EmptyState title="The scan returned no rows" hint="The raw response is below for reference." />
              <details className="px-4 pb-4"><summary className="text-xs text-slate-500 cursor-pointer">Raw response</summary>
                <pre className="mt-2 text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-96">{JSON.stringify(results, null, 2)}</pre></details>
            </Card>
          )}
        </div>
      )}

      {!loading && results == null && !error && (
        <Card><EmptyState icon={<Icon size={32} className="mx-auto text-slate-300" />} title={title} hint={emptyHint} /></Card>
      )}
    </div>
  );
}
