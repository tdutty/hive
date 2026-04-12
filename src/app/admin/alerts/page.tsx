"use client";

import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";

export default function AlertsPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"ok" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const checkHealth = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/admin/tenant-match/pipeline");
      if (resp.ok) {
        setStatus("ok");
      } else {
        setStatus("error");
        setErrorMsg("Pipeline API returned " + resp.status);
      }
    } catch {
      setStatus("error");
      setErrorMsg("Failed to reach API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <AlertTriangle size={24} className="text-amber-500" />
            System Alerts
          </h1>
          <p className="text-sm text-slate-400 mt-1">Monitor system health and background processes</p>
        </div>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-[#2a2a3e] text-slate-400 hover:text-white rounded-lg text-sm transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {status === "ok" && (
        <div className="bg-[#1e1e2d] border border-emerald-500/30 rounded-xl p-6 flex items-center gap-4">
          <CheckCircle size={24} className="text-emerald-500" />
          <div>
            <div className="text-white font-medium">All systems operating normally</div>
            <div className="text-xs text-slate-400 mt-1">Pipeline API responding. Background processes running.</div>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="bg-[#1e1e2d] border border-red-500/30 rounded-xl p-6 flex items-center gap-4">
          <AlertTriangle size={24} className="text-red-500" />
          <div>
            <div className="text-white font-medium">System Issue Detected</div>
            <div className="text-xs text-red-400 mt-1">{errorMsg}</div>
          </div>
        </div>
      )}

      {!status && !loading && (
        <div className="bg-[#1e1e2d] border border-[#2f2f42] rounded-xl p-6 text-center text-slate-500 text-sm">
          Checking system health...
        </div>
      )}
    </div>
  );
}
