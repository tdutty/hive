"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface PhotoMonitorStats {
  totalListings: number;
  withZillowPhotos: number;
  withS3Photos: number;
  pendingDownload: number;
  totalZillowPhotos: number;
  totalS3Photos: number;
  percentComplete: number;
  downloadedLastHour: number;
  failedLastHour: number;
  successRate: number;
  downloadedLast24h: number;
  failedLast24h: number;
  estimatedHoursRemaining: number | null;
  status: "healthy" | "degraded" | "blocked" | "idle";
  issues: string[];
}

interface EnrichmentStats {
  totalListings: number;
  enriched: number;
  pending: number;
  percentComplete: number;
  creditsUsed: number;
  enrichedLastHour: number;
  failedLastHour: number;
  avgPhotosPerListing: number;
  estimatedCreditsNeeded: number;
  creditsBurnRate: number;
  successRate: number;
  etaHours: number | null;
  status: "healthy" | "degraded" | "blocked" | "idle" | "credits_low";
  issues: string[];
}

const STATUS_CONFIG: Record<string, { color: string; text: string; label: string }> = {
  healthy: { color: "bg-green-500", text: "text-green-700", label: "Healthy" },
  degraded: { color: "bg-amber-500", text: "text-amber-700", label: "Degraded" },
  blocked: { color: "bg-red-500", text: "text-red-700", label: "Blocked" },
  idle: { color: "bg-gray-400", text: "text-gray-600", label: "Idle" },
  credits_low: { color: "bg-red-500", text: "text-red-700", label: "Credits Low" },
};

export default function AlertsPage() {
  const [photoStats, setPhotoStats] = useState<PhotoMonitorStats | null>(null);
  const [enrichStats, setEnrichStats] = useState<EnrichmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    try {
      const [photo, enrich] = await Promise.allSettled([
        api.get<PhotoMonitorStats>("/api/admin/photo-monitor").catch(() => null),
        api.get<EnrichmentStats>("/api/admin/enrichment-monitor").catch(() => null),
      ]);
      if (photo.status === "fulfilled" && photo.value) setPhotoStats(photo.value);
      if (enrich.status === "fulfilled" && enrich.value) setEnrichStats(enrich.value);
      setLastRefresh(new Date());
    } catch {
      console.error("Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Collect all alerts
  const allIssues: Array<{ source: string; severity: string; message: string }> = [];
  if (photoStats?.issues) {
    for (const issue of photoStats.issues) {
      allIssues.push({ source: "Photo Download", severity: photoStats.status, message: issue });
    }
  }
  if (enrichStats?.issues) {
    for (const issue of enrichStats.issues) {
      allIssues.push({ source: "Listing Enrichment", severity: enrichStats.status, message: issue });
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">System Alerts</h1>
          <p className="text-slate-500">Monitor background processes and system health</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="rounded border-slate-300" />
            Auto-refresh
          </label>
          <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
            <RefreshCw size={14} />Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-amber-600" size={32} />
        </div>
      ) : (
        <>
          {/* Alert Banners */}
          {allIssues.length > 0 ? (
            <div className="space-y-3">
              {allIssues.map((issue, i) => (
                <div key={i} className={`flex items-start gap-3 p-4 rounded-lg border ${
                  issue.severity === "blocked" || issue.severity === "credits_low" ? "bg-red-50 border-red-200" :
                  issue.severity === "degraded" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
                }`}>
                  <AlertTriangle size={18} className={
                    issue.severity === "blocked" || issue.severity === "credits_low" ? "text-red-600" :
                    issue.severity === "degraded" ? "text-amber-600" : "text-blue-600"
                  } />
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{issue.source}</p>
                    <p className={`text-sm font-medium ${
                      issue.severity === "blocked" || issue.severity === "credits_low" ? "text-red-900" :
                      issue.severity === "degraded" ? "text-amber-900" : "text-blue-900"
                    }`}>{issue.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle size={18} className="text-green-600" />
              <p className="text-sm font-medium text-green-900">All systems operating normally</p>
            </div>
          )}

          {/* Enrichment Pipeline */}
          {enrichStats && (
            <PipelineCard
              title="Listing Enrichment"
              subtitle="Full property details from Scrapeak (photos, description, amenities)"
              status={enrichStats.status}
              percentComplete={enrichStats.percentComplete}
              completedCount={enrichStats.enriched}
              totalCount={enrichStats.totalListings}
              pendingCount={enrichStats.pending}
              lastHourSuccess={enrichStats.enrichedLastHour}
              lastHourFailed={enrichStats.failedLastHour}
              successRate={enrichStats.successRate}
              etaHours={enrichStats.etaHours}
              extraStats={[
                { label: "Credits Used", value: enrichStats.creditsUsed.toLocaleString() },
                { label: "Credits/Hour", value: enrichStats.creditsBurnRate.toLocaleString() },
                { label: "Credits Needed", value: enrichStats.estimatedCreditsNeeded.toLocaleString() },
                { label: "Avg Photos", value: String(enrichStats.avgPhotosPerListing) + "/listing" },
              ]}
            />
          )}

          {/* Photo Download Pipeline */}
          {photoStats && (
            <PipelineCard
              title="Photo Download"
              subtitle="Transferring images from Zillow to our CDN"
              status={photoStats.status}
              percentComplete={photoStats.percentComplete}
              completedCount={photoStats.withS3Photos}
              totalCount={photoStats.withZillowPhotos}
              pendingCount={photoStats.pendingDownload}
              lastHourSuccess={photoStats.downloadedLastHour}
              lastHourFailed={photoStats.failedLastHour}
              successRate={photoStats.successRate}
              etaHours={photoStats.estimatedHoursRemaining}
              extraStats={[
                { label: "Zillow Photos", value: photoStats.totalZillowPhotos.toLocaleString() },
                { label: "On CDN", value: photoStats.totalS3Photos.toLocaleString() },
                { label: "Downloaded (24h)", value: photoStats.downloadedLast24h.toLocaleString() },
                { label: "Failed (24h)", value: String(photoStats.failedLast24h) },
              ]}
            />
          )}

          {/* Last Updated */}
          {lastRefresh && (
            <div className="text-center">
              <span className="text-xs text-slate-400 flex items-center justify-center gap-1">
                <Clock size={12} />
                Last updated {lastRefresh.toLocaleTimeString()}
                {autoRefresh && " · Auto-refreshing every 30s"}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PipelineCard({
  title, subtitle, status, percentComplete, completedCount, totalCount, pendingCount,
  lastHourSuccess, lastHourFailed, successRate, etaHours, extraStats,
}: {
  title: string;
  subtitle: string;
  status: string;
  percentComplete: number;
  completedCount: number;
  totalCount: number;
  pendingCount: number;
  lastHourSuccess: number;
  lastHourFailed: number;
  successRate: number;
  etaHours: number | null;
  extraStats: Array<{ label: string; value: string }>;
}) {
  const sc = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-400">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${sc.color} ${status === 'healthy' ? 'animate-pulse' : ''}`} />
            <span className={`text-sm font-medium ${sc.text}`}>{sc.label}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            {completedCount.toLocaleString()} / {totalCount.toLocaleString()}
          </span>
          <span className="text-sm font-bold text-slate-900">{percentComplete}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              status === "blocked" || status === "credits_low" ? "bg-red-500" : status === "degraded" ? "bg-amber-500" : "bg-green-500"
            }`}
            style={{ width: `${percentComplete}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-400">{pendingCount.toLocaleString()} remaining</span>
          <span className="text-xs text-slate-400">
            ETA: {etaHours !== null ? (etaHours > 24 ? `${Math.round(etaHours / 24)}d ${etaHours % 24}h` : `${etaHours}h`) : "—"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 border-b border-slate-200">
        <div className="p-4 border-r border-slate-200">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Last Hour</div>
          <div className="text-xl font-semibold text-slate-900">{lastHourSuccess.toLocaleString()}</div>
          <div className="text-xs text-slate-400">processed</div>
        </div>
        <div className="p-4 border-r border-slate-200">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Failed (1h)</div>
          <div className={`text-xl font-semibold ${lastHourFailed > 0 ? "text-red-600" : "text-slate-900"}`}>
            {lastHourFailed}
          </div>
          <div className="text-xs text-slate-400">errors</div>
        </div>
        <div className="p-4 border-r border-slate-200">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Success Rate</div>
          <div className={`text-xl font-semibold ${successRate >= 80 ? "text-green-600" : successRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
            {successRate}%
          </div>
          <div className="text-xs text-slate-400">last hour</div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Rate</div>
          <div className="text-xl font-semibold text-slate-900">{lastHourSuccess.toLocaleString()}</div>
          <div className="text-xs text-slate-400">per hour</div>
        </div>
      </div>

      {/* Extra Stats */}
      <div className="grid grid-cols-4 bg-slate-50">
        {extraStats.map((stat, i) => (
          <div key={i} className={`p-4 ${i < extraStats.length - 1 ? "border-r border-slate-200" : ""}`}>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="text-sm font-semibold text-slate-700">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
