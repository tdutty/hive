import { api } from "@/lib/api";

export interface AuditLogsParams {
  page?: number;
  limit?: number;
  category?: string;
  level?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  resourceType?: string;
  complianceOnly?: boolean;
}

export interface AuditLog {
  id: string;
  category: string;
  action: string;
  level: string;
  resourceType: string;
  resourceId: string;
  metadata: any;
  complianceFlag: boolean;
  riskScore: number;
  createdAt: string;
  user: any;
}

export const auditLogsService = {
  getAll(params?: AuditLogsParams) {
    return api.get<{
      auditLogs: AuditLog[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>("/api/admin/audit-logs", params as any);
  },

  create(data: {
    category: string;
    action: string;
    level?: string;
    resourceType: string;
    resourceId: string;
    metadata?: any;
    complianceFlag?: boolean;
    riskScore?: number;
  }) {
    return api.post<{ success: boolean }>("/api/admin/audit-logs", data);
  },
};
