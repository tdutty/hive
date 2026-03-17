"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { apiUsageService } from "@/lib/services/api-usage";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { DollarSign, Zap } from "lucide-react";

interface APIProvider {
  id: string;
  name: string;
  category: string;
  requests: number;
  cost: number;
  avgResponseTime: number;
  errorRate: number;
  usagePercentage: number;
  errors: { endpoint: string; statusCode: number; message: string; timestamp: string }[];
}

interface Subscription {
  name: string;
  category: string;
  plan: string;
  monthlyCost: number;
  billingCycle: "monthly" | "annual";
  renewalDate: string;
  status: "active" | "trial" | "cancelled";
  creditsUsed?: number;
  creditsTotal?: number;
  costPerCall?: string;
  notes?: string;
}

const SUBSCRIPTIONS: Subscription[] = [
  {
    name: "DigitalOcean",
    category: "Infrastructure",
    plan: "Apps + DB + Redis + Droplet + Spaces",
    monthlyCost: 160,
    billingCycle: "monthly",
    renewalDate: "2026-04-01",
    status: "active",
    notes: "SweetLease app $107 (2x pro-m), Locust $11, API $11, Postgres $16 (+$1 storage), Redis/Valkey $16, Grasshopper droplet $6, Spaces $5. Jan: $146, Feb: $160, Mar MTD: $89",
  },
  {
    name: "Resend",
    category: "Email",
    plan: "Pro",
    monthlyCost: 20,
    billingCycle: "monthly",
    renewalDate: "2026-04-01",
    status: "active",
    notes: "Transactional emails (SweetLease) + outbound sequences (Locust). Restricted API key for sending only.",
  },
  {
    name: "RentCast",
    category: "Property Data",
    plan: "Developer (Free)",
    monthlyCost: 0,
    billingCycle: "monthly",
    renewalDate: "N/A",
    status: "active",
    creditsUsed: 0,
    creditsTotal: 50,
    costPerCall: "$0.20 overage after 50",
    notes: "Account: terrellgilb5@gmail.com. 50 free calls/mo. Upgrade path: Foundation $74/mo (1,000 calls, $0.06 overage), Growth $199/mo (5,000), Scale $449/mo (25,000)",
  },
  {
    name: "Apollo.io",
    category: "Contact Enrichment",
    plan: "Paid (check dashboard)",
    monthlyCost: 49,
    billingCycle: "monthly",
    renewalDate: "2026-04-01",
    status: "active",
    creditsUsed: 1,
    creditsTotal: 50000,
    costPerCall: "Credit-based",
    notes: "Rate limits: 50k/day, 6k/hr, 200/min. People + org search for owner enrichment. Plans: Basic $49/mo (5k credits), Pro $79/mo (10k), Org $119/mo (15k). Check apollo.io dashboard for exact plan.",
  },
  {
    name: "PropertyReach",
    category: "Skip Tracing",
    plan: "Trial ($10/30 days)",
    monthlyCost: 10,
    billingCycle: "monthly",
    renewalDate: "2026-04-16",
    status: "trial",
    costPerCall: "Per lookup",
    notes: "API key: test_NY4k... Property details, skip trace, linked properties (portfolio). After trial: Lite $29, Starter $79, Core $159, Pro $599/mo",
  },
  {
    name: "Anthropic (Claude)",
    category: "AI",
    plan: "API - Pay as you go",
    monthlyCost: 5,
    billingCycle: "monthly",
    renewalDate: "N/A",
    status: "active",
    costPerCall: "$3/M in, $15/M out (Sonnet 4)",
    notes: "Used for AI email generation in Locust outbound sequences. Model: claude-sonnet-4. Standard service tier.",
  },
  {
    name: "Stripe",
    category: "Payments",
    plan: "Standard (TEST MODE)",
    monthlyCost: 0,
    billingCycle: "monthly",
    renewalDate: "N/A",
    status: "active",
    costPerCall: "2.9% + $0.30/txn (live)",
    notes: "Currently in test mode (sk_test_*). Test balance: $22,421. No live transactions yet. Switch to live keys before first real tenant payment.",
  },
  {
    name: "Mapbox",
    category: "Maps",
    plan: "Pay-as-you-go (Free tier)",
    monthlyCost: 0,
    billingCycle: "monthly",
    renewalDate: "N/A",
    status: "active",
    notes: "Account: tdutty. 100k free geocoding requests/mo, 50k free map loads/mo. City autocomplete on onboarding survey.",
  },
  {
    name: "Cal.com",
    category: "Scheduling",
    plan: "Free",
    monthlyCost: 0,
    billingCycle: "monthly",
    renewalDate: "N/A",
    status: "active",
    notes: "Account: terrell-gilbert-bnq7m3. Booking URL in Locust follow-up emails. 0 meetings booked to date via Cal.com.",
  },
  {
    name: "Porkbun",
    category: "Email / DNS",
    plan: "Domain + Email Hosting",
    monthlyCost: 2,
    billingCycle: "annual",
    renewalDate: "2027-02-01",
    status: "active",
    notes: "sweetlease.io domain. SMTP/IMAP for tgilbert@ (replies) and rgilbert@ (outbound). DNS for all subdomains.",
  },
  {
    name: "ScraperAPI",
    category: "Web Scraping",
    plan: "Hobby",
    monthlyCost: 49,
    billingCycle: "monthly",
    renewalDate: "2026-04-01",
    status: "active",
    costPerCall: "$0.001/request",
    notes: "Proxy for Zillow scraping (photos + contact). 100k requests/mo on Hobby plan.",
  },
];

export default function APIUsagePage() {
  const [sortBy, setSortBy] = useState("cost");
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  // Fetch metrics
  const {
    data: metricsData,
    loading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics
  } = useApi(
    () => apiUsageService.getMetrics(),
    []
  );

  // Fetch cost data
  const {
    loading: costLoading,
    error: costError,
    refetch: refetchCosts
  } = useApi(
    () => apiUsageService.getDailyCosts(30),
    []
  );

  // Extract providers from metricsData
  const providers: APIProvider[] = metricsData?.providers || [];

  const sortedProviders = [...providers].sort((a, b) => {
    switch (sortBy) {
      case "cost":
        return b.cost - a.cost;
      case "requests":
        return b.requests - a.requests;
      case "errors":
        return b.errorRate - a.errorRate;
      default:
        return 0;
    }
  });

  const totalCost = providers.reduce((sum, p) => sum + p.cost, 0);
  const totalRequests = providers.reduce((sum, p) => sum + p.requests, 0);

  const handleRetry = () => {
    refetchMetrics();
    refetchCosts();
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">API Usage &amp; Costs</h1>
        <p className="text-slate-500">Monitor third-party API consumption, costs, and subscriptions</p>
      </div>

      {/* Subscriptions & Renewals */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Subscriptions &amp; Renewals</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 mb-1">Monthly Burn</p>
            <p className="text-2xl font-semibold text-amber-600">
              {formatCurrency(SUBSCRIPTIONS.reduce((sum, s) => sum + (s.billingCycle === "monthly" ? s.monthlyCost : s.monthlyCost / 12), 0))}
              <span className="text-sm text-slate-400 font-normal">/mo</span>
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 mb-1">Active Services</p>
            <p className="text-2xl font-semibold text-slate-900">
              {SUBSCRIPTIONS.filter(s => s.status === "active").length}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-500 mb-1">Next Renewal</p>
            <p className="text-2xl font-semibold text-slate-900">
              {(() => {
                const upcoming = SUBSCRIPTIONS
                  .filter(s => s.renewalDate !== "N/A")
                  .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime());
                if (upcoming.length === 0) return "None";
                const next = upcoming[0];
                const days = Math.ceil((new Date(next.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return `${days}d`;
              })()}
              <span className="text-sm text-slate-400 font-normal ml-1">
                ({(() => {
                  const upcoming = SUBSCRIPTIONS
                    .filter(s => s.renewalDate !== "N/A")
                    .sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime());
                  return upcoming[0]?.name || "";
                })()})
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left font-semibold text-slate-600 px-5 py-3">Service</th>
                <th className="text-left font-semibold text-slate-600 px-5 py-3">Category</th>
                <th className="text-left font-semibold text-slate-600 px-5 py-3">Plan</th>
                <th className="text-right font-semibold text-slate-600 px-5 py-3">Cost</th>
                <th className="text-left font-semibold text-slate-600 px-5 py-3">Per Call</th>
                <th className="text-left font-semibold text-slate-600 px-5 py-3">Renewal</th>
                <th className="text-left font-semibold text-slate-600 px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {SUBSCRIPTIONS.map((sub) => {
                const daysUntil = sub.renewalDate !== "N/A"
                  ? Math.ceil((new Date(sub.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;
                return (
                  <tr key={sub.name} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{sub.name}</div>
                      {sub.notes && <div className="text-xs text-slate-400 mt-0.5">{sub.notes}</div>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{sub.category}</td>
                    <td className="px-5 py-3 text-slate-600">{sub.plan}</td>
                    <td className="px-5 py-3 text-right">
                      {sub.monthlyCost > 0 ? (
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(sub.monthlyCost)}
                          <span className="text-slate-400 font-normal">/{sub.billingCycle === "annual" ? "yr" : "mo"}</span>
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">Free</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{sub.costPerCall || "—"}</td>
                    <td className="px-5 py-3">
                      {sub.renewalDate === "N/A" ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <div>
                          <div className="text-slate-900">{new Date(sub.renewalDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                          {daysUntil !== null && daysUntil <= 14 && (
                            <div className={`text-xs font-medium ${daysUntil <= 3 ? "text-red-600" : "text-amber-600"}`}>
                              {daysUntil <= 0 ? "Overdue" : `${daysUntil}d away`}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        sub.status === "active" ? "bg-green-50 text-green-700" :
                        sub.status === "trial" ? "bg-amber-50 text-amber-700" :
                        "bg-red-50 text-red-700"
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error States */}
      {(metricsError || costError) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-900">Failed to load API usage data</span>
          <button
            onClick={handleRetry}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {(metricsLoading || costLoading) && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-amber-600" size={32} />
        </div>
      )}

      {!metricsLoading && !costLoading && (
        <>
          {/* Top Metrics */}
          <div className="grid grid-cols-2 gap-6">
            <MetricCard
              title="Total Cost This Month"
              value={formatCurrency(totalCost)}
              trend={metricsData?.costTrend || 0}
              icon={DollarSign}
            />
            <MetricCard
              title="Total Requests"
              value={formatNumber(totalRequests)}
              trend={metricsData?.requestTrend || 0}
              icon={Zap}
            />
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-slate-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-slate-200 rounded-md px-4 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white font-medium"
            >
              <option value="cost">By Cost</option>
              <option value="requests">By Requests</option>
              <option value="errors">By Error Rate</option>
            </select>
          </div>

          {/* Provider Cards */}
          <div className="space-y-4">
            {sortedProviders.map((provider) => (
              <div
                key={provider.id}
                className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {provider.name}
                    </h3>
                    <span className="inline-block border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-600 bg-slate-50">
                      {provider.category}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setExpandedProvider(
                        expandedProvider === provider.id ? null : provider.id
                      )
                    }
                    className="p-2 hover:bg-slate-100 transition-colors"
                  >
                    {expandedProvider === provider.id ? (
                      <ChevronUp size={20} className="text-slate-600" />
                    ) : (
                      <ChevronDown size={20} className="text-slate-600" />
                    )}
                  </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      Requests
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {formatNumber(provider.requests)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      Total Cost
                    </p>
                    <p className="text-lg font-semibold text-amber-600">
                      {formatCurrency(provider.cost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      Avg Response
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {provider.avgResponseTime}ms
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">
                      Error Rate
                    </p>
                    <p className="text-lg font-semibold text-red-600">
                      {provider.errorRate}%
                    </p>
                  </div>
                </div>

                {/* Usage Progress */}
                <div>
                  <label className="text-sm font-semibold text-slate-600 mb-2 block">
                    Monthly Usage: {provider.usagePercentage}%
                  </label>
                  <ProgressBar
                    value={provider.usagePercentage}
                    color={
                      provider.usagePercentage > 80
                        ? "bg-red-600"
                        : provider.usagePercentage > 60
                        ? "bg-amber-600"
                        : "bg-green-600"
                    }
                  />
                </div>

                {/* Expandable Errors Section */}
                {expandedProvider === provider.id && provider.errors.length > 0 && (
                  <div className="pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-3">Recent Errors</h4>
                    <div className="space-y-2">
                      {provider.errors.map((error, idx) => (
                        <div
                          key={idx}
                          className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm"
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className="font-semibold text-red-900">
                              {error.endpoint}
                            </span>
                            <span className="text-xs text-red-700 font-semibold">
                              {error.statusCode}
                            </span>
                          </div>
                          <p className="text-red-800 text-xs mb-1">
                            {error.message}
                          </p>
                          <p className="text-red-700 text-xs">
                            {error.timestamp}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {expandedProvider === provider.id && provider.errors.length === 0 && (
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm text-green-600 font-semibold">
                      No recent errors
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          {providers.length > 0 && (
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  Average Cost Per Provider
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {formatCurrency(totalCost / providers.length)}
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  Most Expensive
                </p>
                <p className="text-2xl font-semibold text-amber-600">
                  {sortedProviders.length > 0 ? sortedProviders[0].name : "N/A"}
                </p>
                <p className="text-sm text-slate-500">
                  {formatCurrency(sortedProviders.length > 0 ? sortedProviders[0].cost : 0)}/mo
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  Highest Error Rate
                </p>
                <p className="text-2xl font-semibold text-red-600">
                  {providers.length > 0
                    ? providers.reduce((max, p) => (p.errorRate > max.errorRate ? p : max)).name
                    : "N/A"}
                </p>
                <p className="text-sm text-slate-500">
                  {providers.length > 0
                    ? `${providers.reduce((max, p) => (p.errorRate > max.errorRate ? p : max)).errorRate}%`
                    : "0%"}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
