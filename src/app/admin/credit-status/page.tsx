"use client";

import { useState, useEffect } from "react";
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { usePolling } from "@/lib/hooks";
import { Button, Card, CardBody, Badge, statusTone, PageHeader } from "@/components/kit";
import { ErrorBanner, Spinner } from "@/components/ui/AsyncState";

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

/**
 * Label and icon per API status. Colors are not defined here: `signal` is the
 * status word handed to the shared statusTone() so the badge tone matches the
 * rest of the app (healthy = success, warning = warning, critical/error = danger).
 */
const STATUS_LABEL: Record<string, { label: string; signal: string; icon: React.ReactNode }> = {
  ok: { label: "Healthy", signal: "healthy", icon: <CheckCircle size={12} aria-hidden /> },
  low: { label: "Low", signal: "warning", icon: <AlertTriangle size={12} aria-hidden /> },
  critical: { label: "Critical", signal: "critical", icon: <AlertTriangle size={12} aria-hidden /> },
  depleted: { label: "Depleted", signal: "failed", icon: <XCircle size={12} aria-hidden /> },
  error: { label: "Error", signal: "error", icon: <HelpCircle size={12} aria-hidden /> },
  no_key: { label: "No API key", signal: "unknown", icon: <HelpCircle size={12} aria-hidden /> },
  unknown: { label: "Unknown", signal: "unknown", icon: <HelpCircle size={12} aria-hidden /> },
};

export default function CreditStatusPage() {
  const [status, setStatus] = useState<CreditStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/credit-status");
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
  }, []);
  usePolling(fetchStatus, 60000); // Refresh every minute

  const services = ["hasdata", "anthropic", "batchdata", "apollo", "scrapeak"];
  const depleted = status ? services.filter(s => status[s]?.status === "depleted").length : 0;
  const warnings = status ? services.filter(s => ["low", "critical"].includes(status[s]?.status)).length : 0;

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="API Credit Status"
        description="Monitor credit balances across all external API services"
        meta={status && (
          <span className="inline-flex flex-wrap gap-1.5">
            {depleted > 0 && <Badge tone={statusTone("failed")} dot>{depleted} service{depleted > 1 ? "s" : ""} depleted</Badge>}
            {warnings > 0 && <Badge tone={statusTone("warning")} dot>{warnings} warning{warnings > 1 ? "s" : ""}</Badge>}
            {depleted === 0 && warnings === 0 && <Badge tone={statusTone("healthy")} dot>All services healthy</Badge>}
          </span>
        )}
        actions={<Button icon={<RefreshCw size={14} />} loading={loading} onClick={fetchStatus}>Refresh</Button>}
      />

      {/* Error */}
      {error && <ErrorBanner message={error} onRetry={fetchStatus} className="mb-5" />}

      {/* Credit Cards */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((key) => {
            const info = status[key] || { credits: null, status: "unknown", lastChecked: "" };
            const meta = SERVICE_META[key] || { name: key, url: "#", unit: "credits", costPer: "" };
            const cfg = STATUS_LABEL[info.status] || STATUS_LABEL.unknown;

            return (
              <Card key={key}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{meta.name}</h3>
                      <p className="text-xs text-slate-500">{meta.costPer}</p>
                    </div>
                    <Badge tone={statusTone(cfg.signal)}>{cfg.icon}{cfg.label}</Badge>
                  </div>

                  <div className="mb-3">
                    {info.credits !== null ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-semibold text-slate-900 tabular">
                          {key === "anthropic"
                            ? `$${info.credits.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : info.credits.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500">
                          {key === "anthropic" ? "spent this month" : meta.unit}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">
                        {info.status === "ok" ? "Active (balance not reported)" : info.status === "no_key" ? "API key not configured" : "Balance unknown"}
                      </span>
                    )}
                  </div>

                  {info.error && (
                    <p className="text-xs text-red-700 mb-2 break-words">Error: {info.error}</p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 tabular">
                      {info.lastChecked
                        ? `Checked ${new Date(info.lastChecked).toLocaleTimeString()}`
                        : "Not checked yet"}
                    </span>
                    <a
                      href={meta.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-amber-700 hover:underline"
                    >
                      Manage
                    </a>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {loading && !status && <Spinner label="Checking credit balances" />}
    </div>
  );
}
