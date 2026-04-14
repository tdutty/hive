"use client";

import { useState } from "react";
import { Search, Play, Loader2, AlertCircle, Clock } from "lucide-react";
import { sweetleaseApi } from "@/lib/api";

export default function BiggerPocketsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runScan = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sweetleaseApi.post("/api/admin/intelligence/biggerpockets", { action: "alerts" });
      setResults(data);
      setLastRun(new Date().toLocaleString());
    } catch (err: any) {
      setError(err.message || "Failed to run scan");
    } finally {
      setLoading(false);
    }
  };

  const resultArray = results
    ? Array.isArray(results) ? results
    : results?.alerts || results?.queries || results?.results || results?.data || []
    : [];

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-amber-600/20 flex items-center justify-center">
          <Search size={24} className="text-amber-500" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">BiggerPockets Engine</h1>
          <p className="text-sm text-slate-500 mt-1">
            Scrapes landlord forums, investment discussions, and property listings from BiggerPockets to identify active landlord investors.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRun && (
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={14} /> Last run: {lastRun}
            </span>
          )}
          {results && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              {resultArray.length} results
            </span>
          )}
          <button
            onClick={runScan}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {loading ? "Running..." : "Run Scan"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-emerald-500" />
          <p className="text-sm text-slate-500">Scanning BiggerPockets alerts...</p>
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <div className="space-y-4">
          {typeof results === "object" && !Array.isArray(results) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {Object.entries(results)
                .filter(([, v]) => typeof v === "number" || typeof v === "string")
                .slice(0, 4)
                .map(([key, value]) => (
                  <div key={key} className="bg-white border border-slate-200 rounded-xl p-4">
                    <p className="text-xs text-slate-500 capitalize">{key.replace(/_/g, " ")}</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{String(value)}</p>
                  </div>
                ))}
            </div>
          )}

          {resultArray.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {Object.keys(resultArray[0]).slice(0, 8).map((key) => (
                        <th key={key} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                          {key.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultArray.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        {Object.values(row).slice(0, 8).map((val: any, j: number) => (
                          <td key={j} className="px-4 py-3 text-slate-700 max-w-[200px] truncate">
                            {typeof val === "object" ? JSON.stringify(val) : String(val ?? "-")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {resultArray.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-2">Raw Response</p>
              <pre className="text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {!loading && !results && !error && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Search size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Click &ldquo;Run Scan&rdquo; to check BiggerPockets alerts.</p>
        </div>
      )}
    </div>
  );
}
