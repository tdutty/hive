"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, Image } from "lucide-react";

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

const STATUS_CONFIG = {
  healthy: { color: "bg-green-500", text: "text-green-700", bg: "bg-green-50", border: "border-green-200", label: "Healthy" },
  degraded: { color: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "Degraded" },
  blocked: { color: "bg-red-500", text: "text-red-700", bg: "bg-red-50", border: "border-red-200", label: "Blocked" },
  idle: { color: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", label: "Idle" },
};

export default function AlertsPage() {
  const [photoStats, setPhotoStats] = useState<PhotoMonitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    try {
      const data = await api.get<PhotoMonitorStats>("/api/admin/photo-monitor");
      setPhotoStats(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const sc = photoStats ? STATUS_CONFIG[photoStats.status] : STATUS_CONFIG.idle;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">System Alerts</h1>
          <p className="text-slate-500">Monitor background processes and system health</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-300"
            />
            Auto-refresh
          </label>
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-amber-600" size={32} />
        </div>
      ) : photoStats ? (
        <>
          {/* Active Alerts */}
          {photoStats.issues.length > 0 && (
            <div className="space-y-3">
              {photoStats.issues.map((issue, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-4 rounded-lg border ${
                    photoStats.status === "blocked"
                      ? "bg-red-50 border-red-200"
                      : photoStats.status === "degraded"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <AlertTriangle
                    size={18}
                    className={
                      photoStats.status === "blocked"
                        ? "text-red-600"
                        : photoStats.status === "degraded"
                          ? "text-amber-600"
                          : "text-blue-600"
                    }
                  />
                  <div>
                    <p className={`text-sm font-medium ${
                      photoStats.status === "blocked" ? "text-red-900" : photoStats.status === "degraded" ? "text-amber-900" : "text-blue-900"
                    }`}>
                      {issue}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {photoStats.issues.length === 0 && photoStats.status === "healthy" && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle size={18} className="text-green-600" />
              <p className="text-sm font-medium text-green-900">All systems operating normally</p>
            </div>
          )}

          {/* Photo Download Monitor */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image size={20} className="text-slate-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Photo Download Pipeline</h2>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${sc.color} ${photoStats.status === 'healthy' || photoStats.status === 'degraded' ? 'animate-pulse' : ''}`} />
                  <span className={`text-sm font-medium ${sc.text}`}>{sc.label}</span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">
                  {photoStats.withS3Photos.toLocaleString()} / {photoStats.withZillowPhotos.toLocaleString()} listings
                </span>
                <span className="text-sm font-bold text-slate-900">{photoStats.percentComplete}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    photoStats.status === "blocked" ? "bg-red-500" : photoStats.status === "degraded" ? "bg-amber-500" : "bg-green-500"
                  }`}
                  style={{ width: `${photoStats.percentComplete}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">
                  {photoStats.totalS3Photos.toLocaleString()} photos on our CDN
                </span>
                <span className="text-xs text-slate-400">
                  {photoStats.pendingDownload.toLocaleString()} listings remaining
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 border-b border-slate-200">
              <div className="p-5 border-r border-slate-200">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Last Hour</div>
                <div className="text-2xl font-semibold text-slate-900">{photoStats.downloadedLastHour.toLocaleString()}</div>
                <div className="text-xs text-slate-400">photos downloaded</div>
              </div>
              <div className="p-5 border-r border-slate-200">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Failed (1h)</div>
                <div className={`text-2xl font-semibold ${photoStats.failedLastHour > 0 ? "text-red-600" : "text-slate-900"}`}>
                  {photoStats.failedLastHour}
                </div>
                <div className="text-xs text-slate-400">errors</div>
              </div>
              <div className="p-5 border-r border-slate-200">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Success Rate</div>
                <div className={`text-2xl font-semibold ${
                  photoStats.successRate >= 80 ? "text-green-600" : photoStats.successRate >= 50 ? "text-amber-600" : "text-red-600"
                }`}>
                  {photoStats.successRate}%
                </div>
                <div className="text-xs text-slate-400">last hour</div>
              </div>
              <div className="p-5">
                <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">ETA</div>
                <div className="text-2xl font-semibold text-slate-900">
                  {photoStats.estimatedHoursRemaining !== null
                    ? photoStats.estimatedHoursRemaining > 24
                      ? `${Math.round(photoStats.estimatedHoursRemaining / 24)}d`
                      : `${photoStats.estimatedHoursRemaining}h`
                    : "—"}
                </div>
                <div className="text-xs text-slate-400">remaining</div>
              </div>
            </div>

            {/* 24h Summary */}
            <div className="p-5 bg-slate-50">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-slate-500">Last 24 hours:</span>
                  <span className="font-medium text-green-700">{photoStats.downloadedLast24h.toLocaleString()} downloaded</span>
                  {photoStats.failedLast24h > 0 && (
                    <span className="font-medium text-red-600">{photoStats.failedLast24h.toLocaleString()} failed</span>
                  )}
                </div>
                {lastRefresh && (
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock size={12} />
                    Updated {lastRefresh.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Photo Inventory */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total Listings</div>
              <div className="text-2xl font-semibold text-slate-900">{photoStats.totalListings.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Zillow Photo URLs</div>
              <div className="text-2xl font-semibold text-slate-900">{photoStats.totalZillowPhotos.toLocaleString()}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
              <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">On Our CDN</div>
              <div className="text-2xl font-semibold text-green-600">{photoStats.totalS3Photos.toLocaleString()}</div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500">
          Unable to load monitoring data
        </div>
      )}
    </div>
  );
}
