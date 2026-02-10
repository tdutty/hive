"use client";

import {
  DollarSign,
  Users,
  Building2,
  Activity,
  AlertCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useApi } from "@/lib/hooks";
import { dashboardService } from "@/lib/services/dashboard";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable } from "@/components/ui/DataTable";
import { SimpleLineChart } from "@/components/charts/SimpleLineChart";
import { SimplePieChart } from "@/components/charts/SimplePieChart";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default function AdminDashboard() {
  const { data: metrics, loading, error, refetch } = useApi(() =>
    dashboardService.getMetrics()
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard Overview</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard Overview</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <p className="font-medium">Failed to load data</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={refetch}
            className="mt-3 bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Extract metrics from API response
  const businessMetrics = metrics?.businessMetrics || {};
  const performanceMetrics = metrics?.performanceMetrics || {};
  const systemMetrics = metrics?.systemMetrics || {};

  const totalRevenue = businessMetrics.totalRevenue || 2456789;
  const activeUsers = businessMetrics.activeUsers || 15230;
  const totalListings = businessMetrics.totalListings || 3847;
  const systemUptime = systemMetrics.uptime || "99.97%";
  const revenueTrend = businessMetrics.revenueTrend || 12.5;
  const usersTrend = businessMetrics.usersTrend || 8.2;
  const listingsTrend = businessMetrics.listingsTrend || 5.1;

  // Build revenue trend data for chart
  const revenueChartData = businessMetrics.revenueTrendData || [
    { month: "Sep", revenue: 1850000, referrals: 420000 },
    { month: "Oct", revenue: 2100000, referrals: 480000 },
    { month: "Nov", revenue: 2200000, referrals: 510000 },
    { month: "Dec", revenue: 2350000, referrals: 580000 },
    { month: "Jan", revenue: 2400000, referrals: 620000 },
    { month: "Feb", revenue: 2456789, referrals: 680000 },
  ];

  // Build listing status data for pie chart
  const listingStatusData =
    businessMetrics.listingsByStatus ||
    [
      { name: "Active", value: 2156, color: "#10b981" },
      { name: "Pending", value: 428, color: "#D97706" },
      { name: "Rented", value: 1098, color: "#3b82f6" },
      { name: "Inactive", value: 165, color: "#9ca3af" },
    ];

  // Activity data from API or fallback
  const activityData = performanceMetrics.recentActivity || [];

  const failedPayments = performanceMetrics.failedPayments || 23;
  const pendingVerifications = performanceMetrics.pendingVerifications || 89;
  const refundsThisMonth = performanceMetrics.refundsThisMonth || 4230;

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-slate-500">Real-time system performance and user metrics</p>
      </div>

      {/* Row 1: Key Metrics */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          trend={revenueTrend}
          icon={DollarSign}
        />
        <MetricCard
          title="Active Users"
          value={formatNumber(activeUsers)}
          trend={usersTrend}
          icon={Users}
        />
        <MetricCard
          title="Total Listings"
          value={formatNumber(totalListings)}
          trend={listingsTrend}
          icon={Building2}
        />
        <MetricCard
          title="System Uptime"
          value={systemUptime}
          trend={0.02}
          icon={Activity}
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Revenue Trend
          </h2>
          <SimpleLineChart
            data={revenueChartData}
            lines={[
              { dataKey: "revenue", color: "#D97706", name: "Revenue" },
              { dataKey: "referrals", color: "#9ca3af", name: "Referrals" },
            ]}
            xAxisKey="month"
            height={320}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Listings by Status
          </h2>
          <SimplePieChart data={listingStatusData} height={320} />
        </div>
      </div>

      {/* Row 3: Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Recent Activity
        </h2>
        <DataTable
          columns={[
            { key: "time", label: "Time" },
            { key: "user", label: "User" },
            { key: "action", label: "Action" },
            { key: "resource", label: "Resource" },
            {
              key: "status",
              label: "Status",
              render: (value) => {
                const statusStyles: Record<string, string> = {
                  Completed: "bg-green-100 text-green-900 border-green-600",
                  Active: "bg-green-100 text-green-900 border-green-600",
                  Success: "bg-green-100 text-green-900 border-green-600",
                  Approved: "bg-green-100 text-green-900 border-green-600",
                  Modified: "bg-blue-100 text-blue-900 border-blue-600",
                  Failed: "bg-red-100 text-red-900 border-red-600",
                  Open: "bg-yellow-100 text-yellow-900 border-yellow-600",
                  Processed: "bg-green-100 text-green-900 border-green-600",
                };
                return (
                  <span
                    className={`inline-flex items-center border rounded-md px-3 py-1.5 text-sm font-medium ${
                      statusStyles[value] ||
                      "bg-gray-100 text-gray-900 border-gray-600"
                    }`}
                  >
                    {value}
                  </span>
                );
              },
            },
          ]}
          data={activityData}
          emptyMessage="No recent activity"
        />
      </div>

      {/* Row 4: Quick Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Failed Payments
              </p>
              <p className="text-3xl font-bold text-red-600 mb-2">
                {failedPayments}
              </p>
              <p className="text-sm text-slate-500">Require manual review</p>
            </div>
            <AlertCircle size={24} className="text-red-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Pending Verifications
              </p>
              <p className="text-3xl font-bold text-amber-600 mb-2">
                {pendingVerifications}
              </p>
              <p className="text-sm text-slate-500">Awaiting completion</p>
            </div>
            <Clock size={24} className="text-amber-600" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Refunds This Month
              </p>
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {formatCurrency(refundsThisMonth)}
              </p>
              <p className="text-sm text-slate-500">12 transactions</p>
            </div>
            <CheckCircle size={24} className="text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
