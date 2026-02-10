import { api } from "@/lib/api";

export const gdprService = {
  async getComplianceStats() {
    const raw = await api.get<any>("/api/admin/gdpr", { action: "compliance_stats" });
    const stats = raw.stats || raw;
    const dsr = stats.dataSubjectRights || {};
    const exportReqs = dsr.exportRequests || {};
    const deletionReqs = dsr.deletionRequests || {};
    const userStats = stats.userStatistics || {};
    const usersByRole = userStats.usersByRole || {};

    return {
      totalExportRequests: exportReqs.total || 0,
      completedExports: exportReqs.completed || 0,
      exportCompletionRate: exportReqs.total ? (exportReqs.completed / exportReqs.total) * 100 : 0,
      totalDeletionRequests: deletionReqs.total || 0,
      completedDeletions: deletionReqs.completed || 0,
      deletionCompletionRate: deletionReqs.total ? (deletionReqs.completed / deletionReqs.total) * 100 : 0,
      exportStats: { pending: 0, processing: 0, completed: exportReqs.completed || 0, failed: 0 },
      deletionStats: { pending: 0, processing: 0, completed: deletionReqs.completed || 0, blocked: 0 },
      usersByRole: Object.entries(usersByRole).map(([role, count]) => ({ role, count })),
    };
  },

  checkDeletionEligibility(userId: string) {
    return api.get<{
      canDelete: boolean;
      blockers: string[];
      warnings: string[];
    }>("/api/admin/gdpr", { action: "check_deletion_eligibility", userId });
  },

  exportUserData(data: { userId: string; reason?: string; includeAnalytics?: boolean }) {
    return api.post<any>("/api/admin/gdpr", {
      action: "export_user_data",
      ...data,
    });
  },

  deleteUserData(data: {
    userId: string;
    reason?: string;
    anonymizeOnly?: boolean;
    retainFinancial?: boolean;
    retainLegal?: boolean;
  }) {
    return api.post<any>("/api/admin/gdpr", {
      action: "delete_user_data",
      ...data,
    });
  },

  generateComplianceReport(startDate: string, endDate: string) {
    return api.post<any>("/api/admin/gdpr", {
      action: "generate_compliance_report",
      startDate,
      endDate,
    });
  },
};
