import { api } from "@/lib/api";

export interface PerformanceData {
  enterprise?: any;
  cache?: any;
  legacy?: any;
  timestamp: string;
  operations?: any;
  systemMetrics?: any;
  healthChecks?: any;
  slowQueries?: any;
  cacheHealth?: any;
  database?: any;
  status?: string;
  uptime?: any;
  performance?: any;
}

export const monitoringService = {
  async getHealth() {
    const raw = await api.get<any>("/api/admin/performance", { action: "health" });
    // Normalize: the API returns { enterprise: { status, services, ... }, cache: { ... }, legacy: { ... } }
    // The page expects healthData.enterprise to be an object of named services
    const services: Record<string, any> = {};
    if (raw.enterprise) {
      services["Application"] = {
        status: raw.enterprise.status || "healthy",
        responseTime: raw.enterprise.responseTime || 0,
        details: raw.enterprise.environment || "",
      };
      if (raw.enterprise.services) {
        Object.entries(raw.enterprise.services).forEach(([name, data]: [string, any]) => {
          services[name] = {
            status: data?.status || "healthy",
            responseTime: data?.responseTime || 0,
            details: data?.details || "",
          };
        });
      }
    }
    if (raw.cache) {
      services["Cache"] = {
        status: raw.cache.status || "healthy",
        responseTime: 0,
        details: raw.cache.details?.circuitBreakerState || "",
      };
    }
    if (raw.legacy) {
      services["Legacy"] = {
        status: raw.legacy.status === "critical" ? "down" : raw.legacy.status || "healthy",
        responseTime: 0,
        details: (raw.legacy.issues || []).length > 0 ? `${raw.legacy.issues.length} issue(s)` : "",
      };
    }
    const overallStatus = raw.legacy?.status === "critical" ? "degraded"
      : raw.enterprise?.status || "healthy";
    return { ...raw, status: overallStatus, enterprise: services } as PerformanceData;
  },

  getMetrics(timeWindow?: number) {
    return api.get<PerformanceData>("/api/admin/performance", { action: "metrics", timeWindow });
  },

  getDetailed() {
    return api.get<PerformanceData>("/api/admin/performance", { action: "detailed" });
  },

  getReport(timeWindow?: number) {
    return api.get<any>("/api/admin/performance", { action: "report", timeWindow });
  },

  warmCache() {
    return api.post<{ success: boolean }>("/api/admin/performance", { action: "warm_cache" });
  },

  clearMetrics() {
    return api.post<{ success: boolean }>("/api/admin/performance", { action: "clear_metrics" });
  },

  triggerGC() {
    return api.post<{ success: boolean }>("/api/admin/performance", { action: "trigger_gc" });
  },

  getInfrastructure() {
    return api.get<any>("/api/admin/infrastructure-metrics");
  },

  getErrors() {
    return api.get<any>("/api/admin/errors");
  },
};
