import { api } from "@/lib/api";

export interface DashboardMetrics {
  performanceMetrics: any;
  systemMetrics: any;
  businessMetrics: any;
  cacheMetrics: any;
  [key: string]: any;
}

export interface AnalyticsData {
  availabilityMetrics: any;
  groupFormationMetrics: any;
  matchingMetrics: any;
  seasonalMetrics: any;
  realTimeMetrics: any;
  timeRange: any;
  lastUpdated: string;
}

export const dashboardService = {
  async getMetrics(filters?: {
    dateFrom?: string;
    dateTo?: string;
    userType?: string;
    listingRegion?: string;
  }) {
    const raw = await api.get<any>("/api/admin/metrics", filters);

    // SweetLease returns data spread across top-level keys (financial, user, listing, etc.)
    // but the Hive pages expect a composed businessMetrics object. Build it here.
    const fin = raw.financial || {};
    const usr = raw.user || {};
    const lst = raw.listing || {};
    const byStatus = lst.byType?.status || {};
    const sponsored = lst.sponsoredPerformance || {};

    const totalListings = Object.values(byStatus).reduce((s: number, v: any) => s + (v || 0), 0);
    const activeListings = byStatus.active || 0;

    const businessMetrics: Record<string, any> = {
      totalRevenue: fin.totalRevenue || 0,
      monthlyRevenue: fin.revenueMonthly || 0,
      outstandingBalances: fin.outstandingBalances || 0,
      refundsTotal: fin.refundStats?.amount || 0,
      totalUsers: usr.totalUsers || 0,
      activeUsers: usr.activeUsers30d || usr.activeUsers7d || 0,
      pendingVerification: usr.pendingVerification || 0,
      totalListings,
      activeListings,
      sponsoredCount: sponsored.sponsored?.listings || 0,
      avgQualityScore: lst.qualityScores?.average || 0,
      sponsoredPerformance: [
        {
          name: "Sponsored",
          impressions: sponsored.sponsored?.impressions || 0,
          clicks: sponsored.sponsored?.clicks || 0,
          conversions: 0,
        },
        {
          name: "Organic",
          impressions: sponsored.organic?.impressions || 0,
          clicks: sponsored.organic?.clicks || 0,
          conversions: 0,
        },
      ],
      listingsByStatus: Object.entries(byStatus).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      })),
      revenueByRegion: Object.entries(fin.revenueByRegion || {}).map(([city, revenue]) => ({
        city,
        revenue,
      })),
    };

    return {
      ...raw,
      businessMetrics,
      performanceMetrics: {
        failedPayments: fin.failedPayments || 0,
        pendingVerifications: usr.pendingVerification || 0,
        refundsThisMonth: fin.refundStats?.amount || 0,
        recentActivity: [],
      },
    } as DashboardMetrics;
  },

  getAnalytics(timeRange?: string) {
    return api.get<AnalyticsData>("/api/admin/analytics", { timeRange });
  },

  getBusinessIntelligence(timeRange?: string) {
    return api.get<any>("/api/admin/business-intelligence", { timeRange });
  },

  getSponsoredAnalytics(period?: string) {
    return api.get<any>("/api/admin/sponsored-analytics", { period });
  },
};
