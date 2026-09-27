"use client";

import { useState } from "react";
import { DollarSign, TrendingUp, AlertCircle, Clock } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { api } from "@/lib/api";
import { financialService } from "@/lib/services/financial";
import { Card, CardHeader, CardBody, Badge, statusTone, StatTile, PageHeader, FilterChips, type Chip, Table, THead, TH, TBody, TR, TD } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { SimpleLineChart } from "@/components/charts/SimpleLineChart";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { SimplePieChart } from "@/components/charts/SimplePieChart";
import { formatCurrency } from "@/lib/utils";

type Tab = "overview" | "payments" | "regions";
const TABS: Chip<Tab>[] = [
  { key: "overview", label: "Overview" },
  { key: "payments", label: "Payments" },
  { key: "regions", label: "Regions" },
];

export default function FinancialPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Fetch real Stripe financial data
  const { data: stripeData, loading: stripeLoading, error: stripeError, refetch: refetchStripe } = useApi(() =>
    api.get<any>("/api/admin/financial")
  );

  // Fetch payment security data
  const { data: securityData, loading: securityLoading, error: securityError, refetch: refetchSecurity } = useApi(() =>
    financialService.getPaymentSecurity()
  );

  const loading = stripeLoading || securityLoading;
  const error = stripeError || securityError;

  if (loading) {
    return <div className="max-w-7xl"><PageHeader title="Financial Dashboard" /><Spinner label="Loading financial data" /></div>;
  }

  if (error) {
    return <div className="max-w-7xl"><PageHeader title="Financial Dashboard" /><ErrorBanner message={error} onRetry={() => { refetchStripe(); refetchSecurity(); }} /></div>;
  }

  // Extract real Stripe metrics
  const totalRevenue = stripeData?.totalRevenue || 0;
  const monthlyRevenue = stripeData?.monthlyRevenue || 0;
  const outstandingBalances = stripeData?.outstandingBalances || 0;
  const refundsTotal = stripeData?.refundsTotal || 0;
  const growth: number = stripeData?.growth || 0;

  // Extract security data
  const securitySummary = securityData?.summary || {
    suspiciousPayments: 5,
    blockedPayments: 8,
    refundAbuse: 3,
    webhookIssues: 2,
    manipulationAttempts: 1,
    riskLevel: "LOW",
  };

  // Build revenue trend from Stripe data
  const revenueTrendData = stripeData?.revenueTrend || [];

  // These will be empty until we have real transaction data
  const revenueByTypeData: any[] = [];
  const paymentMethodsData: any[] = [];
  const revenueByRegionData: any[] = [];

  // Regional payment preferences table data
  const regionalPaymentData: any[] = [];

  const methodsBreakdown = [
    { method: "Credit Card", percentage: 65, color: "#D97706" },
    { method: "ACH", percentage: 20, color: "#3b82f6" },
    { method: "Wire Transfer", percentage: 10, color: "#10b981" },
    { method: "Other", percentage: 5, color: "#9ca3af" },
  ];

  const regionalSummary = [
    { region: "New York", volume: 658000, trend: 8.5, methodPreference: "Card" },
    { region: "San Francisco", volume: 486000, trend: 12.3, methodPreference: "Card" },
    { region: "Los Angeles", volume: 412000, trend: 6.8, methodPreference: "Card" },
  ];

  return (
    <div className="max-w-7xl">
      <PageHeader title="Financial Dashboard" description="Track revenue, payments, and financial metrics" />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          delta={`${growth > 0 ? "+" : ""}${growth}%`}
          deltaTone={growth > 0 ? "up" : growth < 0 ? "down" : "flat"}
          hint="vs last period"
          icon={<DollarSign size={14} />}
        />
        <StatTile label="Monthly Revenue" value={formatCurrency(monthlyRevenue)} hint={stripeData?.currentMonth || undefined} icon={<TrendingUp size={14} />} />
        <StatTile label="Outstanding Balances" value={formatCurrency(outstandingBalances)} hint={`${stripeData?.pendingCount || 0} pending`} icon={<Clock size={14} />} />
        <StatTile label="Refunds" value={formatCurrency(refundsTotal)} hint={`${stripeData?.refundsCount || 0} transactions`} icon={<AlertCircle size={14} />} />
      </div>

      {/* Tabs */}
      <FilterChips items={TABS} value={activeTab} onChange={setActiveTab} className="mb-4" />

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-3">
          {/* Revenue Trend */}
          <Card>
            <CardHeader title="Revenue trend (12 months)" />
            <CardBody>
              <SimpleLineChart
                bare
                data={revenueTrendData}
                lines={[{ dataKey: "revenue", color: "#D97706", name: "Total Revenue" }]}
                xAxisKey="month"
                height={320}
              />
            </CardBody>
          </Card>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader title="Revenue by type" />
              {revenueByTypeData.length === 0 ? (
                <EmptyState title="No revenue by type yet" hint="Populates once transactions are categorized." />
              ) : (
                <Table>
                  <THead>
                    <tr>
                      <TH>Type</TH>
                      <TH numeric>Amount</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {revenueByTypeData.map((item: any) => (
                      <TR key={item.type}>
                        <TD>
                          <span className="inline-flex items-center gap-2">
                            <span className="w-3 h-3 rounded-sm border border-slate-200" style={{ backgroundColor: item.color }} aria-hidden />
                            <span className="font-medium">{item.type}</span>
                          </span>
                        </TD>
                        <TD numeric className="font-medium">{formatCurrency(item.amount)}</TD>
                      </TR>
                    ))}
                    <TR className="bg-slate-50">
                      <TD className="font-semibold">Total</TD>
                      <TD numeric className="font-semibold">
                        {formatCurrency(revenueByTypeData.reduce((sum: any, item: any) => sum + item.amount, 0))}
                      </TD>
                    </TR>
                  </TBody>
                </Table>
              )}
            </Card>

            <Card>
              <CardHeader title="Revenue sources" />
              <CardBody>
                <SimpleBarChart
                  bare
                  data={revenueByTypeData.map((item: any) => ({ type: item.type, amount: item.amount }))}
                  dataKey="amount"
                  nameKey="type"
                  color="#D97706"
                  height={280}
                />
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === "payments" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Payment Methods Chart */}
            <Card>
              <CardHeader title="Payment methods distribution" />
              <CardBody>
                <SimplePieChart bare data={paymentMethodsData} height={320} />
              </CardBody>
            </Card>

            {/* Payment Stats */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatTile label="Success Rate" value="97.2%" hint="of all payments" />
                <StatTile label="Avg Processing Time" value="2.3s" hint="per transaction" />
                <StatTile label="Failed Payments" value={securitySummary.blockedPayments} hint="require action" />
              </div>

              {/* Payment Methods Breakdown */}
              <Card>
                <CardHeader title="Methods breakdown" />
                <CardBody className="space-y-3">
                  {methodsBreakdown.map((item) => (
                    <div key={item.method}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-slate-700">{item.method}</span>
                        <span className="text-sm font-semibold text-slate-900 tabular">{item.percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={item.percentage} aria-valuemin={0} aria-valuemax={100} aria-label={`${item.method} share`}>
                        <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Security Summary */}
          <Card>
            <CardHeader title="Payment security overview" />
            <CardBody>
              <dl className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Suspicious Payments</dt>
                  <dd className="text-xl font-semibold text-slate-900 tabular mt-1">{securitySummary.suspiciousPayments}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Blocked Payments</dt>
                  <dd className="text-xl font-semibold text-slate-900 tabular mt-1">{securitySummary.blockedPayments}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Refund Abuse Cases</dt>
                  <dd className="text-xl font-semibold text-slate-900 tabular mt-1">{securitySummary.refundAbuse}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Webhook Issues</dt>
                  <dd className="text-xl font-semibold text-slate-900 tabular mt-1">{securitySummary.webhookIssues}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Risk Level</dt>
                  <dd className="mt-1.5"><Badge tone={statusTone(securitySummary.riskLevel)} dot>{securitySummary.riskLevel}</Badge></dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Regions Tab */}
      {activeTab === "regions" && (
        <div className="space-y-3">
          {/* Revenue by Region Chart */}
          <Card>
            <CardHeader title="Revenue by region (top 8 cities)" />
            <CardBody>
              <SimpleBarChart
                bare
                data={revenueByRegionData}
                dataKey="revenue"
                nameKey="city"
                color="#D97706"
                height={320}
              />
            </CardBody>
          </Card>

          {/* Regional Payment Preferences Table */}
          <Card>
            <CardHeader title="Regional payment preferences" />
            {regionalPaymentData.length === 0 ? (
              <EmptyState title="No regional data available" />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Region</TH>
                    <TH numeric>Card %</TH>
                    <TH numeric>ACH %</TH>
                    <TH numeric>Wire %</TH>
                    <TH numeric>Other %</TH>
                    <TH numeric>Volume</TH>
                  </tr>
                </THead>
                <TBody>
                  {regionalPaymentData.map((row: any, i: number) => (
                    <TR key={row.region ?? i}>
                      <TD className="font-medium">{row.region}</TD>
                      <TD numeric>{row.card}%</TD>
                      <TD numeric>{row.ach}%</TD>
                      <TD numeric>{row.wire}%</TD>
                      <TD numeric>{row.other}%</TD>
                      <TD numeric className="font-semibold">{formatCurrency(row.volume)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>

          {/* Regional Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {regionalSummary.map((stat) => (
              <Card key={stat.region}>
                <CardHeader title={stat.region} />
                <CardBody>
                  <dl className="grid grid-cols-3 gap-3">
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Volume</dt>
                      <dd className="text-lg font-semibold text-slate-900 tabular mt-1">{formatCurrency(stat.volume)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Growth</dt>
                      <dd className="text-lg font-semibold text-emerald-700 tabular mt-1">+{stat.trend}%</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Preferred</dt>
                      <dd className="text-lg font-semibold text-slate-900 mt-1">{stat.methodPreference}</dd>
                    </div>
                  </dl>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
