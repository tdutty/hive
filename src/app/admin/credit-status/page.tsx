"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Zap, AlertTriangle, CheckCircle, XCircle, HelpCircle } from "lucide-react";

interface CreditInfo {
  credits: number | null;
  status: string; // 'ok' | 'low' | 'critical' | 'depleted' | 'error' | 'no_key' | 'unknown'
  lastChecked: string;
  error?: string;
}

type CreditStatus = Record<string, CreditInfo>;

const SERVICE_META: Record<string, { name: string; url: string; unit: string; costPer: string }> = {
  hasdata: { name: "HasData (Zillow)", url: "https://hasdata.com/prices", unit: "credits", costPer: "5 credits/lookup" },
  scrapeak: { name: "Scrapeak", url: "https://app.scrapeak.com", unit: "credits", costPer: "20 credits/enrichment" },
  batchdata: { name: "BatchData", url: "https://batchdata.io", unit: "balance", costPer: "$0.07/skip trace" },
  apollo: { name: "Apollo.io", url: "https://app.apollo.io", unit: "credits", costPer: "1 credit/lookup" },
  anthropic: { name: "Anthropic (Claude)", url: "https://console.anthropic.com/settings/billing", unit: "spent this month", costPer: "per token" },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  ok: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30", icon: <CheckCircle size={20} />, label: "Healthy" },
  low: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: <AlertTriangle size={20} />, label: "Low" },
  critical: { color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: <AlertTriangle size={20} />, label: "Critical" },
  depleted: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: <XCircle size={20} />, label: "Depleted" },
  error: { color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/30", icon: <HelpCircle size={20} />, label: "Error" },
  no_key: { color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20", icon: <HelpCircle size={20} />, label: "No API Key" },
  unknown: { color: "text-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20", icon: <HelpCircle size={20} />, label: "Unknown" },
};

export default function CreditStatusPage() {
  const [status, setStatus] = useState<CreditStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const locustUrl = process.env.NEXT_PUBLIC_LOCUST_API_URL || "https://locust-m7ng3.ondigitalocean.app";
      const resp = await fetch(`${locustUrl}/api/admin/credit-status`, {
        credentials: "include",
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setStatus(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch credit status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const services = ["hasdata", "anthropic", "batchdata", "apollo", "scrapeak"];
  const depleted = status ? services.filter(s => status[s]?.status === "depleted").length : 0;
  const warnings = status ? services.filter(s => ["low", "critical"].includes(status[s]?.status)).length : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">API Credit Status</h1>
          <p className="text-sm text-gray-400 mt-1">
            Monitor credit balances across all external API services
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary Bar */}
      {status && (
        <div className="flex gap-4">
          {depleted > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <XCircle size={16} className="text-red-400" />
              <span className="text-red-400 text-sm font-medium">{depleted} service{depleted > 1 ? "s" : ""} depleted</span>
            </div>
          )}
          {warnings > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertTriangle size={16} className="text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">{warnings} warning{warnings > 1 ? "s" : ""}</span>
            </div>
          )}
          {depleted === 0 && warnings === 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle size={16} className="text-green-400" />
              <span className="text-green-400 text-sm font-medium">All services healthy</span>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Credit Cards */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((key) => {
            const info = status[key] || { credits: null, status: "unknown", lastChecked: "" };
            const meta = SERVICE_META[key] || { name: key, url: "#", unit: "credits", costPer: "" };
            const cfg = STATUS_CONFIG[info.status] || STATUS_CONFIG.unknown;

            return (
              <div
                key={key}
                className={`rounded-xl border p-5 ${cfg.bg} ${cfg.border} transition hover:scale-[1.01]`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{meta.name}</h3>
                    <span className="text-xs text-gray-500">{meta.costPer}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                    {cfg.icon}
                    {cfg.label}
                  </div>
                </div>

                <div className="mb-3">
                  {info.credits !== null ? (
                    <div>
                      <span className={`text-3xl font-bold ${cfg.color}`}>
                        {key === "anthropic"
                          ? `$${info.credits.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : info.credits.toLocaleString()}
                      </span>
                      <span className="text-gray-500 text-sm ml-2">
                        {key === "anthropic" ? "spent this month" : meta.unit}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">
                      {info.status === "ok" ? "Active (balance not reported)" : info.status === "no_key" ? "API key not configured" : "Balance unknown"}
                    </span>
                  )}
                </div>

                {info.error && (
                  <div className="text-xs text-red-400 mb-2">Error: {info.error}</div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    {info.lastChecked
                      ? `Checked ${new Date(info.lastChecked).toLocaleTimeString()}`
                      : "Not checked yet"}
                  </span>
                  <a
                    href={meta.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-400 hover:underline"
                  >
                    Manage
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {loading && !status && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-amber-400" />
          <span className="ml-3 text-gray-400">Checking credit balances...</span>
        </div>
      )}
    </div>
  );
}
