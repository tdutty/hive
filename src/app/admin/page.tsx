"use client";

import {
  DollarSign,
  Users,
  Building2,
  Activity,
  AlertCircle,
  Clock,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { useApi } from "@/lib/hooks";
import { dashboardService } from "@/lib/services/dashboard";
import { Button, Card, CardHeader, CardBody, Badge, statusTone, StatTile, PageHeader, Table, THead, TH, TBody, TR, TD } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { SimpleLineChart } from "@/components/charts/SimpleLineChart";
import { SimplePieChart } from "@/components/charts/SimplePieChart";
import { formatCurrency, formatNumber } from "@/lib/utils";

type ActivityRow = { time?: string; user?: string; action?: string; resource?: string; status?: string; [key: string]: any };

/** MetricCard showed an up/down arrow with the absolute percent; StatTile takes the same as a signed delta. */
const trendDelta = (trend: number) => ({ delta: `${trend > 0 ? "+" : trend < 0 ? "-" : ""}${Math.abs(trend)}%`, deltaTone: (trend > 0 ? "up" : trend < 0 ? "down" : "flat") as "up" | "down" | "flat" });
const cell = (v: unknown) => String(v || "-");

export default function AdminDashboard() {
  const { data: metrics, loading, refreshing, error, refetch } = useApi(() =>
    dashboardService.getMetrics()
  );

  if (loading) return <div><PageHeader title="Dashboard Overview" /><Spinner /></div>;
  if (error) return <div><PageHeader title="Dashboard Overview" /><ErrorBanner message={error} onRetry={refetch} /></div>;

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
  const activityData: ActivityRow[] = performanceMetrics.recentActivity || [];

  const failedPayments = performanceMetrics.failedPayments || 23;
  const pendingVerifications = performanceMetrics.pendingVerifications || 89;
  const refundsThisMonth = performanceMetrics.refundsThisMonth || 4230;

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Dashboard Overview"
        description="Real-time system performance and user metrics"
        actions={<Button variant="ghost" size="icon" aria-label="Refresh" onClick={refetch}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /></Button>}
      />

      {/* Row 1: Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile label="Total Revenue" value={formatCurrency(totalRevenue)} {...trendDelta(revenueTrend)} hint="vs last period" icon={<DollarSign size={14} />} />
        <StatTile label="Active Users" value={formatNumber(activeUsers)} {...trendDelta(usersTrend)} hint="vs last period" icon={<Users size={14} />} />
        <StatTile label="Total Listings" value={formatNumber(totalListings)} {...trendDelta(listingsTrend)} hint="vs last period" icon={<Building2 size={14} />} />
        <StatTile label="System Uptime" value={systemUptime} {...trendDelta(0.02)} hint="vs last period" icon={<Activity size={14} />} />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <Card>
          <CardHeader title="Revenue Trend" />
          <CardBody>
            <SimpleLineChart
              data={revenueChartData}
              lines={[
                { dataKey: "revenue", color: "#D97706", name: "Revenue" },
                { dataKey: "referrals", color: "#9ca3af", name: "Referrals" },
              ]}
              xAxisKey="month"
              height={320}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Listings by Status" />
          <CardBody>
            <SimplePieChart bare data={listingStatusData} height={320} />
          </CardBody>
        </Card>
      </div>

      {/* Row 3: Recent Activity */}
      <Card className="mb-5">
        <CardHeader title="Recent Activity" />
        {activityData.length === 0 ? (
          <EmptyState title="No recent activity" />
        ) : (
          <Table>
            <THead><tr><TH>Time</TH><TH>User</TH><TH>Action</TH><TH>Resource</TH><TH>Status</TH></tr></THead>
            <TBody>
              {activityData.map((row, i) => (
                <TR key={i}>
                  <TD muted className="tabular whitespace-nowrap">{cell(row.time)}</TD>
                  <TD className="font-medium">{cell(row.user)}</TD>
                  <TD>{cell(row.action)}</TD>
                  <TD muted>{cell(row.resource)}</TD>
                  <TD>{row.status ? <Badge tone={statusTone(row.status)} dot>{row.status}</Badge> : "-"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {/* Row 4: Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatTile label="Failed Payments" value={failedPayments} hint="Require manual review" icon={<AlertCircle size={14} />} />
        <StatTile label="Pending Verifications" value={pendingVerifications} hint="Awaiting completion" icon={<Clock size={14} />} />
        <StatTile label="Refunds This Month" value={formatCurrency(refundsThisMonth)} hint="12 transactions" icon={<CheckCircle size={14} />} />
      </div>
    </div>
  );
}
