import { api } from "@/lib/api";

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions: any[];
  variants: any[];
  environment: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const featureFlagsService = {
  getAll(environment?: string) {
    return api.get<{ success: boolean; data: FeatureFlag[] }>("/api/admin/feature-flags", { environment });
  },

  getById(id: string) {
    return api.get<{ success: boolean; data: FeatureFlag }>(`/api/admin/feature-flags/${id}`);
  },

  getAnalytics(id: string, start: string, end: string) {
    return api.get<any>(`/api/admin/feature-flags/${id}`, { action: "analytics", start, end });
  },

  create(data: Partial<FeatureFlag>) {
    return api.post<{ success: boolean; data: FeatureFlag }>("/api/admin/feature-flags", data);
  },

  update(id: string, data: Partial<FeatureFlag>) {
    return api.put<{ success: boolean; data: FeatureFlag }>(`/api/admin/feature-flags/${id}`, data);
  },

  delete(id: string) {
    return api.delete<{ success: boolean }>(`/api/admin/feature-flags/${id}`);
  },
};
