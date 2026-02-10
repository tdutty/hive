import { api } from "@/lib/api";

export const apiUsageService = {
  async getMetrics(params?: { category?: string; startDate?: string; endDate?: string }) {
    const raw = await api.get<any>("/api/admin/api-usage/metrics", params);
    // Transform object-keyed response into providers array for the UI
    const providers = Object.entries(raw).map(([id, data]: [string, any]) => ({
      id,
      name: data.provider || id,
      category: data.category || "other",
      requests: data.totalRequests || 0,
      cost: data.totalCost || 0,
      avgResponseTime: data.avgResponseTime || 0,
      errorRate: data.errorRate || 0,
      usagePercentage: data.usagePercentage || 0,
      errors: (data.recentErrors || []).map((e: any) => ({
        endpoint: e.endpoint || e.url || "unknown",
        statusCode: e.statusCode || e.status || 0,
        message: e.message || e.error || "",
        timestamp: e.timestamp || "",
      })),
    }));
    return { providers, costTrend: 0, requestTrend: 0 };
  },

  getDailyCosts(days?: number) {
    return api.get<any>("/api/admin/api-usage/daily-costs", { days });
  },

  getTopEndpoints() {
    return api.get<any>("/api/admin/api-usage/top-endpoints");
  },

  getExternalUsage() {
    return api.get<any>("/api/admin/external-api-usage");
  },
};
