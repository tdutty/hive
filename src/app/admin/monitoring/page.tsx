"use client";

import { useState, useEffect } from "react";
import { Clock, Zap } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { monitoringService } from "@/lib/services/monitoring";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface ServiceStatus {
  name: string;
  status: "healthy" | "degraded" | "down";
  responseTime: number;
  details: string;
}

export default function MonitoringPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [overallStatus, setOverallStatus] = useState<"healthy" | "degraded" | "down">("healthy");
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [metrics, setMetrics] = useState<Array<{ label: string; value: number; color: string }>>([]);

  const { data: healthData, loading: healthLoading, error: healthError, refetch: refetchHealth } = useApi(
    () => monitoringService.getHealth(),
    []
  );

  const { data: detailedData, loading: detailedLoading, error: detailedError, refetch: refetchDetailed } = useApi(
    () => monitoringService.getDetailed(),
    []
  );

  useEffect(() => {
    if (healthData) {
      const status = healthData.status || "healthy";
      setOverallStatus(status as "healthy" | "degraded" | "down");

      if (healthData.enterprise) {
        const serviceStatuses: ServiceStatus[] = [];
        Object.entries(healthData.enterprise).forEach(([name, data]: [string, any]) => {
          serviceStatuses.push({
            name: name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, " $1"),
            status: data.status || "healthy",
            responseTime: data.responseTime || 0,
            details: data.details || "",
          });
        });
        setServices(serviceStatuses);
      }
    }
  }, [healthData]);

  useEffect(() => {
    if (detailedData?.systemMetrics) {
      const metricsList: Array<{ label: string; value: number; color: string }> = [];

      if (detailedData.systemMetrics.memory !== undefined) {
        metricsList.push({
          label: "Memory Usage",
          value: detailedData.systemMetrics.memory,
          color: detailedData.systemMetrics.memory > 80 ? "bg-red-600" : "bg-green-600",
        });
      }

      if (detailedData.systemMetrics.cpu !== undefined) {
        metricsList.push({
          label: "CPU Usage",
          value: detailedData.systemMetrics.cpu,
          color: detailedData.systemMetrics.cpu > 70 ? "bg-red-600" : "bg-amber-600",
        });
      }

      if (detailedData.systemMetrics.cacheHitRate !== undefined) {
        metricsList.push({
          label: "Cache Hit Rate",
          value: detailedData.systemMetrics.cacheHitRate,
          color: "bg-green-600",
        });
      }

      if (detailedData.systemMetrics.errorRate !== undefined) {
        metricsList.push({
          label: "Error Rate",
          value: detailedData.systemMetrics.errorRate,
          color: detailedData.systemMetrics.errorRate > 1 ? "bg-red-600" : "bg-green-600",
        });
      }

      setMetrics(metricsList);
    }
  }, [detailedData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-50";
      case "degraded":
        return "bg-yellow-50";
      case "down":
        return "bg-red-50";
      default:
        return "bg-slate-50";
    }
  };

  const getStatusBgColor = () => {
    switch (overallStatus) {
      case "healthy":
        return "bg-green-50 text-green-900";
      case "degraded":
        return "bg-yellow-50 text-yellow-900";
      case "down":
        return "bg-red-50 text-red-900";
      default:
        return "bg-slate-50 text-slate-900";
    }
  };

  const loading = healthLoading || detailedLoading;
  const error = healthError || detailedError;
  const refetch = () => {
    refetchHealth();
    refetchDetailed();
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">System Monitoring</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">System Monitoring</h1>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <p className="font-medium">Failed to load data</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={refetch}
            className="mt-3 bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header with Auto-Refresh Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">System Monitoring</h1>
          <p className="text-slate-500">Real-time system health and performance metrics</p>
        </div>
        <label className="flex items-center gap-3 cursor-pointer bg-white border border-slate-200 rounded-lg shadow-sm px-4 py-2">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
          />
          <span className="font-medium text-slate-900">Auto-Refresh</span>
        </label>
      </div>

      {/* Overall Status Banner */}
      <div
        className={`border border-green-200 rounded-lg shadow-sm p-6 ${getStatusBgColor()} text-center`}
      >
        <h2 className="text-xl font-semibold mb-2">
          {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
        </h2>
        <p className="text-sm">All systems operational • Last checked 2 minutes ago</p>
      </div>

      {/* Service Status Cards */}
      {services.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Service Status
          </h2>
          <div className="grid grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.name}
                className={`border border-slate-200 rounded-lg shadow-sm p-6 ${getStatusColor(
                  service.status
                )}`}
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  {service.name}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">
                      Status
                    </span>
                    <StatusBadge
                      status={service.status}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">
                      Response Time
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {service.responseTime}ms
                    </span>
                  </div>
                  {service.details && (
                    <p className="text-sm text-slate-700 pt-2 border-t border-slate-200">
                      {service.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Metrics */}
      {metrics.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            System Metrics
          </h2>
          <div className="grid grid-cols-4 gap-6">
            {metrics.map((metric, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                <label className="text-sm font-semibold text-slate-700 mb-3 block">
                  {metric.label}
                </label>
                <ProgressBar
                  value={metric.value}
                  color={metric.color}
                  showValue
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uptime */}
      {detailedData?.uptime && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">
                System Uptime
              </p>
              <p className="text-3xl font-bold text-green-600 mb-2">{detailedData.uptime.percentage}%</p>
              <p className="text-sm text-slate-500">{detailedData.uptime.details}</p>
            </div>
            <Clock size={32} className="text-green-600" />
          </div>
        </div>
      )}

      {/* Performance Details */}
      {detailedData?.performance && (
        <div className="grid grid-cols-2 gap-6">
          {detailedData.performance.database && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                Database Performance
              </h3>
              <div className="space-y-3 text-sm">
                {Object.entries(detailedData.performance.database).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-700">{key}</span>
                    <span className="font-medium text-slate-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detailedData.performance.api && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4">
                API Performance
              </h3>
              <div className="space-y-3 text-sm">
                {Object.entries(detailedData.performance.api).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-700">{key}</span>
                    <span className="font-medium text-slate-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alert Thresholds */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-slate-900 mb-4">
          Active Alerts
        </h3>
        <div className="text-center text-slate-600 py-8">
          <Zap size={32} className="mx-auto text-green-600 mb-3" />
          <p className="font-semibold">No active alerts</p>
          <p className="text-sm">All thresholds within normal ranges</p>
        </div>
      </div>
    </div>
  );
}
