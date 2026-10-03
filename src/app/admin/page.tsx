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

const cell = (v: unknown) => String(v || "-");

export default function AdminDashboard() {
  const { data: metrics, loading, refreshing, error, refetch } = useApi(() =>
    dashboardService.getMetrics()
  );

  if (loading) return <div><PageHeader title="Dashboard Overview" /><Spinner /></div>;
  if (error) return <div><PageHeader title="Dashboard Overview" /><ErrorBanner message={error} onRetry={refetch} /></div>;

  // Only real numbers from the SweetLease database: no demo fallbacks, no invented trends.
  const b = metrics?.businessMetrics || {};
  const totalRevenue = Number(b.totalRevenue) || 0;
  const totalListings = Number(b.totalListings) || 0;
  const approvedListings = Number(b.approvedListings) || 0;
  const signupsTotal = b.signupsTotal;
  const signups30d = b.signups30d;
  const mr: Record<string, number> = b.matchRequestsByStatus || {};
  const CLOSED = new Set(["leased", "cancelled", "canceled", "failed", "expired", "lost"]);
  const inPipeline = Object.entries(mr).filter(([k]) => !CLOSED.has(k)).reduce((n, [, v]) => n + v, 0);
  const pipelineHint = Object.entries(mr).filter(([k]) => !CLOSED.has(k)).sort((a, z) => z[1] - a[1]).slice(0, 2).map(([k, v]) => `${v} ${k.replace(/_/g, " ")}`).join(", ");
  const monthly: Array<{ month: string; revenue: number; signups: number }> = b.monthly || [];
  const hasRevenue = monthly.some(m => m.revenue > 0);
  const COLORS = ["#D97706", "#10b981", "#3b82f6", "#9ca3af", "#8b5cf6", "#ef4444", "#14b8a6", "#f59e0b"];
  const listingStatusData = (b.listingsByStatus || []).map((d: any, i: number) => ({ ...d, color: COLORS[i % COLORS.length] }));
  const activityData: ActivityRow[] = [];
  const failedPayments = Number(b.failedPayments) || 0;
  const pendingVerifications = Number(b.pendingVerification) || 0;
  const refundsTotal = Number(b.refundsTotal) || 0;
  const refundCount = Number(b.refundCount) || 0;

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Dashboard Overview"
        description="Live numbers from the SweetLease database"
        actions={<Button variant="ghost" size="icon" aria-label="Refresh" onClick={refetch}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /></Button>}
      />

      {/* Row 1: Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile label="Revenue Collected" value={formatCurrency(totalRevenue)} hint={failedPayments ? `${failedPayments} failed payments` : "Completed payments, all time"} icon={<DollarSign size={14} />} />
        <StatTile label="Signups" value={signupsTotal == null ? "-" : formatNumber(signupsTotal)} hint={signups30d == null ? undefined : `${signups30d} in the last 30 days`} icon={<Users size={14} />} />
        <StatTile label="Total Listings" value={formatNumber(totalListings)} hint={`${formatNumber(approvedListings)} approved for matching`} icon={<Building2 size={14} />} />
        <StatTile label="Tenants in Pipeline" value={formatNumber(inPipeline)} hint={pipelineHint || "No open match requests"} icon={<Activity size={14} />} />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <Card>
          <CardHeader title={hasRevenue ? "Revenue and Signups, Last 6 Months" : "Signups, Last 6 Months"} />
          <CardBody>
            {monthly.length === 0 ? <EmptyState title="No data yet" /> : (
              <SimpleLineChart
                data={monthly}
                lines={hasRevenue
                  ? [{ dataKey: "revenue", color: "#D97706", name: "Revenue" }, { dataKey: "signups", color: "#9ca3af", name: "Signups" }]
                  : [{ dataKey: "signups", color: "#D97706", name: "Signups" }]}
                xAxisKey="month"
                height={320}
              />
            )}
            {!hasRevenue && monthly.length > 0 && <p className="text-xs text-slate-500 mt-2">No completed payments in the last 6 months.</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Listings by Status" />
          <CardBody>
            {listingStatusData.length === 0 ? <EmptyState title="No listings" /> : <SimplePieChart bare data={listingStatusData} height={320} />}
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
        <StatTile label="Failed Payments" value={failedPayments} hint="All time" icon={<AlertCircle size={14} />} />
        <StatTile label="Pending Verifications" value={pendingVerifications} hint="Users with a verification step left" icon={<Clock size={14} />} />
        <StatTile label="Refunds" value={formatCurrency(refundsTotal)} hint={`${refundCount} refunds, all time`} icon={<CheckCircle size={14} />} />
      </div>
    </div>
  );
}
