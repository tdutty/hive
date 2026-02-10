import { api } from "@/lib/api";

export interface RoleChangeRequest {
  userId: string;
  requestedRole: string;
  justification: string;
}

export interface RoleChangeResponse {
  success: boolean;
  user: any;
  oldRole: string;
  newRole: string;
  auditLogId: string;
}

export interface DeletionRequest {
  id: string;
  status: string;
  requestedAt: string;
  scheduledDeletionAt: string;
  reason: string;
  user: any;
  riskScore: string;
}

export const usersService = {
  getRoleChanges(params?: { userId?: string; limit?: number }) {
    return api.get<{ roleChanges: any[] }>("/api/admin/users/role-change", params);
  },

  changeRole(data: RoleChangeRequest) {
    return api.post<RoleChangeResponse>("/api/admin/users/role-change", data);
  },

  getDeletionRequests() {
    return api.get<{
      success: boolean;
      deletionRequests: DeletionRequest[];
      summary: { total: number; pending: number; approved: number; rejected: number; completed: number };
    }>("/api/admin/deletion-requests");
  },

  getWaitlist(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    return api.get<{ entries: any[]; total: number; page: number; totalPages: number; stats: any }>("/api/admin/waitlist", params);
  },

  updateWaitlistEntry(id: string, status: string) {
    return api.patch<{ entry: any }>("/api/admin/waitlist", { id, status });
  },

  deleteWaitlistEntry(id: string) {
    return api.delete<{ success: boolean }>("/api/admin/waitlist", { id });
  },
};
