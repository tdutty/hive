import { api } from "@/lib/api";

export const settingsService = {
  getAll() {
    return api.get<{ success: boolean; settings: Record<string, any> }>("/api/admin/settings");
  },

  update(settings: Record<string, any>) {
    return api.post<{ success: boolean; message: string; updatedCount: number }>("/api/admin/settings", { settings });
  },

  delete(key: string) {
    return api.delete<{ success: boolean }>("/api/admin/settings", { key });
  },

  getNotifications() {
    return api.get<{ notifications: any[] }>("/api/admin/notifications");
  },

  markNotificationRead(id: string) {
    return api.patch<{ success: boolean }>("/api/admin/notifications", { id });
  },

  get2FAStatus() {
    return api.get<any>("/api/admin/2fa/status");
  },

  setup2FA() {
    return api.post<any>("/api/admin/2fa/setup");
  },

  enable2FA(data: { secret: string; verificationCode: string; backupCodes: string[] }) {
    return api.post<{ success: boolean }>("/api/admin/2fa/enable", data);
  },

  disable2FA() {
    return api.post<any>("/api/admin/2fa/disable");
  },
};
