"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { Button, Card, CardHeader, CardBody, Badge, StatTile, PageHeader, Table, THead, TH, TBody, TR, TD, Select } from "@/components/kit";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import {
  RefreshCw,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Share2,
  BarChart3,
} from "lucide-react";

interface Campaign {
  source: string;
  medium: string;
  campaign: string;
  signups: number;
  surveys: number;
  matched: number;
  confirmed: number;
  negotiating: number;
  leased: number;
  revenue: number;
  firstSeen: string;
  lastSeen: string;
}

interface SourceBreakdown {
  source: string;
  signups: number;
  surveys: number;
  leased: number;
}

interface DailySignup {
  date: string;
  count: number;
}

interface CampaignData {
  summary: {
    totalSignups: number;
    totalSurveys: number;
    totalMatched: number;
    totalLeased: number;
    totalRevenue: number;
    conversionRate: number;
    totalReferrals: number;
    referralSurveys: number;
    period: string;
  };
  campaigns: Campaign[];
  sources: SourceBreakdown[];
  dailySignups: DailySignup[];
  referrals: {
    signups: number;
    surveys: number;
    leased: number;
  };
}

export default function CampaignsPage() {
  const [data, setData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await api.get<CampaignData>(
        "/api/admin/campaign-analytics",
        { days }
      );
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load campaign data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  const recentDaily = data?.dailySignups.slice(-60) ?? [];

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Campaigns"
        description="Ad performance, referral tracking, and funnel conversion by source"
        actions={
          <>
            <Select
              aria-label="Period"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-auto"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 180 days</option>
              <option value={365}>Last year</option>
            </Select>
            <Button variant="primary" icon={<RefreshCw size={14} />} loading={loading} onClick={fetchData}>
              Refresh
            </Button>
          </>
        }
      />

      {error && <ErrorBanner message={error} onRetry={fetchData} className="mb-5" />}
      {loading && !data && !error && <Spinner />}

      {data && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatTile label="Signups" value={data.summary.totalSignups} icon={<Users size={14} />} />
            <StatTile label="Surveys" value={data.summary.totalSurveys} icon={<BarChart3 size={14} />} />
            <StatTile label="Matched" value={data.summary.totalMatched} icon={<Target size={14} />} />
            <StatTile label="Leased" value={data.summary.totalLeased} icon={<TrendingUp size={14} />} />
            <StatTile label="Revenue" value={`$${data.summary.totalRevenue.toLocaleString()}`} icon={<DollarSign size={14} />} />
            <StatTile label="Referrals" value={data.summary.totalReferrals} icon={<Share2 size={14} />} />
          </div>

          <Card>
            <CardHeader
              title="Overall Conversion: Signup to Leased"
              actions={<span className="text-xl font-semibold text-slate-900 tabular">{data.summary.conversionRate}%</span>}
            />
            <CardBody>
              <div className="w-full bg-slate-100 rounded-full h-2" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={data.summary.conversionRate} aria-label="Conversion rate">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, data.summary.conversionRate)}%` }}
                />
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader title="Traffic Sources" />
              <CardBody>
                {data.sources.length === 0 ? (
                  <p className="text-sm text-slate-500">No traffic sources yet.</p>
                ) : (
                  <div className="space-y-3">
                    {data.sources.map((s) => {
                      const maxSignups = data.sources[0]?.signups || 1;
                      return (
                        <div key={s.source}>
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-700 capitalize">{s.source}</span>
                            <div className="flex items-center gap-3 text-xs text-slate-500 tabular">
                              <span>{s.signups} signups</span>
                              <span>{s.surveys} surveys</span>
                              <Badge tone="success">{s.leased} leased</Badge>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            <div
                              className="bg-amber-600 h-1.5 rounded-full"
                              style={{ width: `${(s.signups / maxSignups) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Referral Performance" />
              <CardBody>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <StatTile label="Referred Signups" value={data.referrals.signups} />
                  <StatTile label="Completed Survey" value={data.referrals.surveys} />
                  <StatTile label="Leased" value={data.referrals.leased} />
                </div>
                <p className="text-sm text-slate-500">
                  Conversion:{" "}
                  <span className="font-medium text-slate-900 tabular">
                    {data.referrals.signups > 0
                      ? Math.round((data.referrals.leased / data.referrals.signups) * 100)
                      : 0}
                    %
                  </span>{" "}
                  referral to leased
                </p>
              </CardBody>
            </Card>
          </div>

          {data.dailySignups.length > 0 && (
            <Card>
              <CardHeader title="Daily Signups" description={`${recentDaily[0]?.date || ""} to ${data.dailySignups[data.dailySignups.length - 1]?.date || ""}`} />
              <CardBody>
                <SimpleBarChart bare data={recentDaily} dataKey="count" nameKey="date" height={160} />
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="All Campaigns" />
            {data.campaigns.length === 0 ? (
              <EmptyState
                title="No campaign data yet"
                hint="UTM parameters will be tracked automatically when visitors arrive via ad links."
              />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Source</TH>
                    <TH>Medium</TH>
                    <TH>Campaign</TH>
                    <TH numeric>Signups</TH>
                    <TH numeric>Surveys</TH>
                    <TH numeric>Matched</TH>
                    <TH numeric>Leased</TH>
                    <TH numeric>Conv %</TH>
                    <TH>Last Seen</TH>
                  </tr>
                </THead>
                <TBody>
                  {data.campaigns.map((c, i) => {
                    const conv = c.signups > 0 ? Math.round((c.leased / c.signups) * 100) : 0;
                    return (
                      <TR key={i} className="hover:bg-slate-50">
                        <TD className="font-medium capitalize">{c.source}</TD>
                        <TD muted>{c.medium}</TD>
                        <TD muted>{c.campaign === "none" ? <span className="text-slate-400">-</span> : c.campaign}</TD>
                        <TD numeric className="font-medium">{c.signups}</TD>
                        <TD numeric>{c.surveys}</TD>
                        <TD numeric>{c.matched}</TD>
                        <TD numeric>
                          {c.leased > 0 ? (
                            <Badge tone="success">{c.leased}</Badge>
                          ) : (
                            <span className="text-slate-400">{c.leased}</span>
                          )}
                        </TD>
                        <TD numeric>
                          {conv >= 10 ? (
                            <Badge tone="success">{conv}%</Badge>
                          ) : conv > 0 ? (
                            <Badge tone="warning">{conv}%</Badge>
                          ) : (
                            <span className="text-slate-400">{conv}%</span>
                          )}
                        </TD>
                        <TD muted className="tabular whitespace-nowrap">{new Date(c.lastSeen).toLocaleDateString()}</TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader title="How to Track Campaigns" description="Add UTM parameters to your ad URLs. They'll be automatically tracked through the entire funnel." />
            <CardBody>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs text-slate-700 break-all">
                sweetlease.io/site-access?<span className="text-amber-700">utm_source</span>=tiktok&<span className="text-amber-700">utm_medium</span>=paid&<span className="text-amber-700">utm_campaign</span>=match-day-2026
              </div>
              <div className="mt-3 text-xs text-slate-500">
                <strong>utm_source:</strong> tiktok, instagram, google, facebook, referral &nbsp;|&nbsp;
                <strong>utm_medium:</strong> paid, organic, email, referral &nbsp;|&nbsp;
                <strong>utm_campaign:</strong> your campaign name
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
