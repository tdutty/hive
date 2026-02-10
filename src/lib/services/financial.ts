import { api } from "@/lib/api";

export const financialService = {
  getPaymentSecurity(timeframe?: string) {
    return api.get<{
      summary: {
        suspiciousPayments: number;
        blockedPayments: number;
        refundAbuse: number;
        webhookIssues: number;
        manipulationAttempts: number;
        riskLevel: string;
      };
      details: any;
      recommendations: string[];
    }>("/api/admin/payments/security", { timeframe });
  },

  approveRefund(paymentId: string, reason: string) {
    return api.post<{ success: boolean; refundId: string }>("/api/admin/payments/security", {
      action: "approve_refund",
      paymentId,
      reason,
    });
  },

  blockUser(userId: string, reason: string) {
    return api.post<{ success: boolean }>("/api/admin/payments/security", {
      action: "block_user",
      userId,
      reason,
    });
  },

  runSecurityCheck() {
    return api.post<{ success: boolean }>("/api/admin/payments/security", {
      action: "run_security_check",
    });
  },
};
