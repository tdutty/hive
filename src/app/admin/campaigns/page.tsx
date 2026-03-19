"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await api.get<CampaignData>(
        "/api/admin/campaign-analytics",
        { days }
      );
      setData(result);
    } catch (err) {
      console.error("Failed to load campaign data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ad performance, referral tracking, and funnel conversion by source
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 180 days</option>
            <option value={365}>Last year</option>
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-6 gap-4">
            <SummaryCard
              icon={<Users size={20} className="text-blue-600" />}
              bg="bg-blue-100"
              value={data.summary.totalSignups}
              label="Signups"
            />
            <SummaryCard
              icon={<BarChart3 size={20} className="text-purple-600" />}
              bg="bg-purple-100"
              value={data.summary.totalSurveys}
              label="Surveys"
            />
            <SummaryCard
              icon={<Target size={20} className="text-indigo-600" />}
              bg="bg-indigo-100"
              value={data.summary.totalMatched}
              label="Matched"
            />
            <SummaryCard
              icon={<TrendingUp size={20} className="text-green-600" />}
              bg="bg-green-100"
              value={data.summary.totalLeased}
              label="Leased"
            />
            <SummaryCard
              icon={<DollarSign size={20} className="text-amber-600" />}
              bg="bg-amber-100"
              value={`$${data.summary.totalRevenue.toLocaleString()}`}
              label="Revenue"
            />
            <SummaryCard
              icon={<Share2 size={20} className="text-pink-600" />}
              bg="bg-pink-100"
              value={data.summary.totalReferrals}
              label="Referrals"
            />
          </div>

          {/* Conversion Rate */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                Overall Conversion: Signup → Leased
              </h3>
              <span className="text-2xl font-bold text-green-600">
                {data.summary.conversionRate}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(100, data.summary.conversionRate)}%` }}
              />
            </div>
          </div>

          {/* Source Breakdown + Referrals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-4">
                Traffic Sources
              </h3>
              <div className="space-y-3">
                {data.sources.map((s) => {
                  const maxSignups = data.sources[0]?.signups || 1;
                  return (
                    <div key={s.source}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {s.source}
                        </span>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{s.signups} signups</span>
                          <span>{s.surveys} surveys</span>
                          <span className="text-green-600 font-medium">
                            {s.leased} leased
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(s.signups / maxSignups) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Share2 size={18} className="text-pink-600" />
                <h3 className="font-semibold text-gray-900">
                  Referral Performance
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {data.referrals.signups}
                  </div>
                  <div className="text-xs text-gray-500">Referred Signups</div>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {data.referrals.surveys}
                  </div>
                  <div className="text-xs text-gray-500">Completed Survey</div>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {data.referrals.leased}
                  </div>
                  <div className="text-xs text-gray-500">Leased</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Conversion:{" "}
                <span className="font-medium text-gray-900">
                  {data.referrals.signups > 0
                    ? Math.round(
                        (data.referrals.leased / data.referrals.signups) * 100
                      )
                    : 0}
                  %
                </span>{" "}
                referral → leased
              </div>
            </div>
          </div>

          {/* Daily Signups Chart */}
          {data.dailySignups.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-4">
                Daily Signups
              </h3>
              <div className="flex items-end gap-1 h-32">
                {data.dailySignups.slice(-60).map((d) => {
                  const max = Math.max(
                    ...data.dailySignups.slice(-60).map((x) => x.count),
                    1
                  );
                  return (
                    <div
                      key={d.date}
                      className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors group relative"
                      style={{
                        height: `${(d.count / max) * 100}%`,
                        minHeight: d.count > 0 ? "4px" : "0",
                      }}
                      title={`${d.date}: ${d.count}`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>
                  {data.dailySignups.slice(-60)[0]?.date || ""}
                </span>
                <span>
                  {data.dailySignups[data.dailySignups.length - 1]?.date || ""}
                </span>
              </div>
            </div>
          )}

          {/* Campaign Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                All Campaigns
              </h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3">Source</th>
                  <th className="text-left px-5 py-3">Medium</th>
                  <th className="text-left px-5 py-3">Campaign</th>
                  <th className="text-right px-5 py-3">Signups</th>
                  <th className="text-right px-5 py-3">Surveys</th>
                  <th className="text-right px-5 py-3">Matched</th>
                  <th className="text-right px-5 py-3">Leased</th>
                  <th className="text-right px-5 py-3">Conv %</th>
                  <th className="text-left px-5 py-3">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.campaigns.map((c, i) => {
                  const conv =
                    c.signups > 0
                      ? Math.round((c.leased / c.signups) * 100)
                      : 0;
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm font-medium text-gray-900 capitalize">
                        {c.source}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {c.medium}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">
                        {c.campaign === "none" ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          c.campaign
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-900 text-right font-medium">
                        {c.signups}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700 text-right">
                        {c.surveys}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700 text-right">
                        {c.matched}
                      </td>
                      <td className="px-5 py-3 text-sm text-right">
                        <span
                          className={
                            c.leased > 0
                              ? "text-green-600 font-bold"
                              : "text-gray-400"
                          }
                        >
                          {c.leased}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-right">
                        <span
                          className={
                            conv >= 10
                              ? "text-green-600 font-bold"
                              : conv > 0
                                ? "text-amber-600 font-medium"
                                : "text-gray-400"
                          }
                        >
                          {conv}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">
                        {new Date(c.lastSeen).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {data.campaigns.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">
                No campaign data yet. UTM parameters will be tracked
                automatically when visitors arrive via ad links.
              </div>
            )}
          </div>

          {/* UTM Guide */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h3 className="font-semibold text-gray-900 mb-3">
              How to Track Campaigns
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Add UTM parameters to your ad URLs. They&apos;ll be automatically
              tracked through the entire funnel.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs text-gray-700 break-all">
              sweetlease.io/site-access?<span className="text-blue-600">utm_source</span>=tiktok&<span className="text-purple-600">utm_medium</span>=paid&<span className="text-green-600">utm_campaign</span>=match-day-2026
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <strong>utm_source:</strong> tiktok, instagram, google, facebook, referral &nbsp;|&nbsp;
              <strong>utm_medium:</strong> paid, organic, email, referral &nbsp;|&nbsp;
              <strong>utm_campaign:</strong> your campaign name
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  bg,
  value,
  label,
}: {
  icon: React.ReactNode;
  bg: string;
  value: number | string;
  label: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}
        >
          {icon}
        </div>
        <div>
          <div className="text-xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}
