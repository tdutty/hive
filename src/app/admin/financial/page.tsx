"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, AlertCircle, Clock } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { dashboardService } from "@/lib/services/dashboard";
import { financialService } from "@/lib/services/financial";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable } from "@/components/ui/DataTable";
import { SimpleLineChart } from "@/components/charts/SimpleLineChart";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { SimplePieChart } from "@/components/charts/SimplePieChart";
import { formatCurrency } from "@/lib/utils";

export default function FinancialPage() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch dashboard metrics for revenue figures
  const { data: metricsData, loading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useApi(() =>
    dashboardService.getMetrics()
  );

  // Fetch payment security data
  const { data: securityData, loading: securityLoading, error: securityError, refetch: refetchSecurity } = useApi(() =>
    financialService.getPaymentSecurity()
  );

  const loading = metricsLoading || securityLoading;
  const error = metricsError || securityError;

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Financial Dashboard
          </h1>
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
          <h1 className="text-2xl font-semibold text-slate-900">
            Financial Dashboard
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <p className="font-medium">Failed to load data</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => { refetchMetrics(); refetchSecurity(); }}
            className="mt-3 bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Extract metrics from dashboard
  const businessMetrics = metricsData?.businessMetrics || {};
  const totalRevenue = businessMetrics.totalRevenue || 2456789;
  const monthlyRevenue = businessMetrics.monthlyRevenue || 187234;
  const outstandingBalances = businessMetrics.outstandingBalances || 34567;
  const refundsTotal = businessMetrics.refundsTotal || 4230;

  // Extract security data
  const securitySummary = securityData?.summary || {
    suspiciousPayments: 5,
    blockedPayments: 8,
    refundAbuse: 3,
    webhookIssues: 2,
    manipulationAttempts: 1,
    riskLevel: "LOW",
  };

  // Build revenue trend data
  const revenueTrendData = businessMetrics.revenueTrendData || [
    { month: "Mar 2023", revenue: 1450000 },
    { month: "Apr 2023", revenue: 1620000 },
    { month: "May 2023", revenue: 1780000 },
    { month: "Jun 2023", revenue: 1950000 },
    { month: "Jul 2023", revenue: 2080000 },
    { month: "Aug 2023", revenue: 2150000 },
    { month: "Sep 2023", revenue: 2200000 },
    { month: "Oct 2023", revenue: 2280000 },
    { month: "Nov 2023", revenue: 2350000 },
    { month: "Dec 2023", revenue: 2400000 },
    { month: "Jan 2024", revenue: 2420000 },
    { month: "Feb 2024", revenue: 2456789 },
  ];

  // Revenue by type
  const revenueByTypeData = businessMetrics.revenueByType || [
    { type: "Rent Collection", amount: 1650000, color: "#D97706" },
    { type: "Deposits", amount: 480000, color: "#10b981" },
    { type: "Subscription Fees", amount: 206789, color: "#3b82f6" },
    { type: "Referral Commission", amount: 120000, color: "#8b5cf6" },
  ];

  // Payment methods
  const paymentMethodsData = businessMetrics.paymentMethods || [
    { name: "Card", value: 65, color: "#D97706" },
    { name: "ACH", value: 20, color: "#3b82f6" },
    { name: "Wire", value: 10, color: "#10b981" },
    { name: "Other", value: 5, color: "#9ca3af" },
  ];

  // Revenue by region
  const revenueByRegionData = businessMetrics.revenueByRegion || [
    { city: "San Francisco", revenue: 486000 },
    { city: "Los Angeles", revenue: 412000 },
    { city: "New York", revenue: 658000 },
    { city: "Chicago", revenue: 234000 },
    { city: "Boston", revenue: 198000 },
    { city: "Seattle", revenue: 176000 },
    { city: "Austin", revenue: 142000 },
    { city: "Denver", revenue: 150000 },
  ];

  // Regional payment preferences table data
  const regionalPaymentData = businessMetrics.regionalPayments || [
    {
      region: "New York",
      card: 58,
      ach: 28,
      wire: 10,
      other: 4,
      volume: 658000,
    },
    {
      region: "San Francisco",
      card: 72,
      ach: 15,
      wire: 8,
      other: 5,
      volume: 486000,
    },
    {
      region: "Los Angeles",
      card: 68,
      ach: 18,
      wire: 9,
      other: 5,
      volume: 412000,
    },
    {
      region: "Chicago",
      card: 62,
      ach: 22,
      wire: 12,
      other: 4,
      volume: 234000,
    },
    {
      region: "Boston",
      card: 60,
      ach: 25,
      wire: 11,
      other: 4,
      volume: 198000,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Financial Dashboard
        </h1>
        <p className="text-slate-500">Track revenue, payments, and financial metrics</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          trend={14.2}
          icon={DollarSign}
        />
        <MetricCard
          title="Monthly Revenue"
          value={formatCurrency(monthlyRevenue)}
          subtitle="February 2024"
          icon={TrendingUp}
        />
        <MetricCard
          title="Outstanding Balances"
          value={formatCurrency(outstandingBalances)}
          subtitle="24 pending"
          icon={Clock}
        />
        <MetricCard
          title="Refunds"
          value={formatCurrency(refundsTotal)}
          subtitle="12 transactions"
          icon={AlertCircle}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: "overview", label: "Overview" },
          { id: "payments", label: "Payments" },
          { id: "regions", label: "Regions" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-amber-500 text-amber-600"
                : "border-b-2 border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Revenue Trend */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Revenue Trend (12 months)
            </h2>
            <SimpleLineChart
              data={revenueTrendData}
              lines={[
                { dataKey: "revenue", color: "#D97706", name: "Total Revenue" },
              ]}
              xAxisKey="month"
              height={320}
            />
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Revenue by Type
              </h2>
              <div className="space-y-4">
                {revenueByTypeData.map((item: any) => (
                  <div
                    key={item.type}
                    className="flex items-center justify-between py-3 border-b border-gray-300"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 border border-slate-200 rounded"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-medium text-slate-900">
                        {item.type}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
                <div className="pt-4 flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span className="text-amber-600">
                    {formatCurrency(
                      revenueByTypeData.reduce((sum: any, item: any) => sum + item.amount, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Revenue Sources
              </h2>
              <SimpleBarChart
                data={revenueByTypeData.map((item: any) => ({
                  type: item.type,
                  amount: item.amount,
                }))}
                dataKey="amount"
                nameKey="type"
                color="#D97706"
                height={280}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <div className="space-y-8">
          {/* Payment Methods Chart */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Payment Methods Distribution
              </h2>
              <SimplePieChart data={paymentMethodsData} height={320} />
            </div>

            {/* Payment Stats */}
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Payment Statistics
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                  <p className="text-xs font-semibold text-slate-500 mb-2">
                    Success Rate
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-green-600">97.2%</p>
                    <p className="text-sm text-slate-500">of all payments</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                  <p className="text-xs font-semibold text-slate-500 mb-2">
                    Avg Processing Time
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-blue-600">2.3s</p>
                    <p className="text-sm text-slate-500">per transaction</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                  <p className="text-xs font-semibold text-slate-500 mb-2">
                    Failed Payments
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-red-600">
                      {securitySummary.blockedPayments}
                    </p>
                    <p className="text-sm text-slate-500">require action</p>
                  </div>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="space-y-3 mt-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Methods Breakdown
                </h3>
                {[
                  { method: "Credit Card", percentage: 65, color: "#D97706" },
                  { method: "ACH", percentage: 20, color: "#3b82f6" },
                  { method: "Wire Transfer", percentage: 10, color: "#10b981" },
                  { method: "Other", percentage: 5, color: "#9ca3af" },
                ].map((item) => (
                  <div key={item.method} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-700">
                        {item.method}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {item.percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 border border-slate-200 bg-slate-100 rounded">
                      <div
                        className="h-full rounded"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: item.color,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security Summary */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Payment Security Overview
            </h3>
            <div className="grid grid-cols-5 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  Suspicious Payments
                </p>
                <p className="text-3xl font-bold text-amber-600">
                  {securitySummary.suspiciousPayments}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  Blocked Payments
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {securitySummary.blockedPayments}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  Refund Abuse Cases
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {securitySummary.refundAbuse}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  Webhook Issues
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {securitySummary.webhookIssues}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  Risk Level
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {securitySummary.riskLevel}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regions Tab */}
      {activeTab === "regions" && (
        <div className="space-y-8">
          {/* Revenue by Region Chart */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Revenue by Region (Top 8 Cities)
            </h2>
            <SimpleBarChart
              data={revenueByRegionData}
              dataKey="revenue"
              nameKey="city"
              color="#D97706"
              height={320}
            />
          </div>

          {/* Regional Payment Preferences Table */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Regional Payment Preferences
            </h2>
            <DataTable
              columns={[
                { key: "region", label: "Region" },
                {
                  key: "card",
                  label: "Card %",
                  render: (value) => <span className="font-medium">{value}%</span>,
                },
                {
                  key: "ach",
                  label: "ACH %",
                  render: (value) => <span className="font-medium">{value}%</span>,
                },
                {
                  key: "wire",
                  label: "Wire %",
                  render: (value) => <span className="font-medium">{value}%</span>,
                },
                {
                  key: "other",
                  label: "Other %",
                  render: (value) => <span className="font-medium">{value}%</span>,
                },
                {
                  key: "volume",
                  label: "Volume",
                  render: (value) => (
                    <span className="font-bold text-amber-600">
                      {formatCurrency(value)}
                    </span>
                  ),
                },
              ]}
              data={regionalPaymentData}
              emptyMessage="No regional data available"
            />
          </div>

          {/* Regional Summary Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              {
                region: "New York",
                volume: 658000,
                trend: 8.5,
                methodPreference: "Card",
              },
              {
                region: "San Francisco",
                volume: 486000,
                trend: 12.3,
                methodPreference: "Card",
              },
              {
                region: "Los Angeles",
                volume: 412000,
                trend: 6.8,
                methodPreference: "Card",
              },
            ].map((stat) => (
              <div
                key={stat.region}
                className="bg-white border border-slate-200 rounded-lg shadow-sm p-6"
              >
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  {stat.region}
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      Volume
                    </p>
                    <p className="text-2xl font-bold text-amber-600">
                      {formatCurrency(stat.volume)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      Growth
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      +{stat.trend}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      Preferred Method
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {stat.methodPreference}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
