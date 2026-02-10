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
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">API Usage</h1>
        <p className="text-slate-500">Monitor third-party API consumption and costs</p>
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
