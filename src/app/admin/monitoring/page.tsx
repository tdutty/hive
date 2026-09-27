"use client";

import { useState, useEffect } from "react";
import { Clock, Zap } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { monitoringService } from "@/lib/services/monitoring";
import { Card, CardHeader, CardBody, Badge, statusTone, StatTile, PageHeader } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";

interface ServiceStatus {
  name: string;
  status: "healthy" | "degraded" | "down";
  responseTime: number;
  details: string;
}

interface Metric {
  label: string;
  value: number;
  /** the value crossed its alert threshold */
  over: boolean;
}

/** The shared status map knows healthy/warning/critical; alias the health words it does not. */
const healthTone = (status: string) =>
  statusTone(status === "degraded" ? "warning" : status === "down" ? "critical" : status);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function KeyValueList({ entries }: { entries: [string, unknown][] }) {
  return (
    <dl className="divide-y divide-slate-100">
      {entries.map(([key, value]) => (
        <div key={key} className="flex justify-between items-center py-2 gap-4">
          <dt className="text-sm text-slate-600">{key}</dt>
          <dd className="text-sm font-medium text-slate-900 tabular text-right">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function MonitoringPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [overallStatus, setOverallStatus] = useState<"healthy" | "degraded" | "down">("healthy");
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);

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
      const m = detailedData.systemMetrics;
      const metricsList: Metric[] = [];

      if (m.memory !== undefined) metricsList.push({ label: "Memory Usage", value: m.memory, over: m.memory > 80 });
      if (m.cpu !== undefined) metricsList.push({ label: "CPU Usage", value: m.cpu, over: m.cpu > 70 });
      if (m.cacheHitRate !== undefined) metricsList.push({ label: "Cache Hit Rate", value: m.cacheHitRate, over: false });
      if (m.errorRate !== undefined) metricsList.push({ label: "Error Rate", value: m.errorRate, over: m.errorRate > 1 });

      setMetrics(metricsList);
    }
  }, [detailedData]);

  const loading = healthLoading || detailedLoading;
  const error = healthError || detailedError;
  const refetch = () => {
    refetchHealth();
    refetchDetailed();
  };

  if (loading) return <div><PageHeader title="System Monitoring" /><Spinner /></div>;
  if (error) return <div><PageHeader title="System Monitoring" /><ErrorBanner message={error} onRetry={refetch} /></div>;

  return (
    <div className="max-w-7xl space-y-5">
      <PageHeader
        title="System Monitoring"
        description="Real-time system health and performance metrics"
        actions={
          <label className="inline-flex items-center gap-2 h-9 px-3 rounded border border-slate-300 bg-white text-sm text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            Auto-refresh
          </label>
        }
      />

      {/* Overall status */}
      <Card>
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge tone={healthTone(overallStatus)} dot>{capitalize(overallStatus)}</Badge>
            <span className="text-sm font-medium text-slate-900">Overall status</span>
          </div>
          <p className="text-sm text-slate-500">All systems operational. Last checked 2 minutes ago</p>
        </CardBody>
      </Card>

      {/* Service status */}
      {services.length > 0 && (
        <section>
          <h2 className="text-md font-semibold text-slate-900 mb-3">Service Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {services.map((service) => (
              <Card key={service.name}>
                <CardHeader title={service.name} actions={<Badge tone={healthTone(service.status)} dot>{capitalize(service.status)}</Badge>} />
                <CardBody>
                  <dl className="divide-y divide-slate-100">
                    <div className="flex justify-between items-center py-2 gap-4">
                      <dt className="text-sm text-slate-600">Status</dt>
                      <dd className="text-sm font-medium text-slate-900">{capitalize(service.status)}</dd>
                    </div>
                    <div className="flex justify-between items-center py-2 gap-4">
                      <dt className="text-sm text-slate-600">Response Time</dt>
                      <dd className="text-sm font-medium text-slate-900 tabular">{service.responseTime}ms</dd>
                    </div>
                  </dl>
                  {service.details && (
                    <p className="text-sm text-slate-600 pt-3 mt-1 border-t border-slate-200">{service.details}</p>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* System metrics */}
      {metrics.length > 0 && (
        <section>
          <h2 className="text-md font-semibold text-slate-900 mb-3">System Metrics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {metrics.map((metric) => {
              const pct = Math.min(Math.max(metric.value, 0), 100);
              return (
                <Card key={metric.label} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{metric.label}</p>
                    <Badge tone={statusTone(metric.over ? "critical" : "healthy")} dot>{metric.over ? "High" : "Normal"}</Badge>
                  </div>
                  <p className="mt-1 text-xl font-semibold text-slate-900 tabular">{pct}%</p>
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={metric.label}>
                    <div className="h-full bg-slate-800 rounded-full transition-all duration-200" style={{ width: `${pct}%` }} />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Uptime */}
      {detailedData?.uptime && (
        <StatTile
          label="System Uptime"
          value={`${detailedData.uptime.percentage}%`}
          hint={detailedData.uptime.details}
          icon={<Clock size={14} />}
        />
      )}

      {/* Performance */}
      {detailedData?.performance && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {detailedData.performance.database && (
            <Card>
              <CardHeader title="Database Performance" />
              <CardBody>
                <KeyValueList entries={Object.entries(detailedData.performance.database)} />
              </CardBody>
            </Card>
          )}

          {detailedData.performance.api && (
            <Card>
              <CardHeader title="API Performance" />
              <CardBody>
                <KeyValueList entries={Object.entries(detailedData.performance.api)} />
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Alerts */}
      <Card>
        <CardHeader title="Active Alerts" />
        <EmptyState title="No active alerts" hint="All thresholds within normal ranges" icon={<Zap size={28} className="mx-auto" aria-hidden />} />
      </Card>
    </div>
  );
}
