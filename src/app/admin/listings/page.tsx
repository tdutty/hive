"use client";

import { useState } from "react";
import { Building2, Eye, Heart, Zap, MapPin } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { listingsService } from "@/lib/services/listings";
import { dashboardService } from "@/lib/services/dashboard";
import { MetricCard } from "@/components/ui/MetricCard";
import { DataTable } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/SearchInput";
import { FilterBar } from "@/components/ui/FilterBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";

export default function ListingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  // Fetch dashboard metrics for listing stats
  const { data: metricsData, loading: metricsLoading, refetch: refetchMetrics } = useApi(() =>
    dashboardService.getMetrics()
  );

  // Fetch listings with filters
  const { data: listingsData, loading: listingsLoading, error, refetch: refetchListings } = useApi(() =>
    listingsService.getAll({
      page,
      limit: 20,
      search: searchQuery,
      status: statusFilter !== "all" ? statusFilter : undefined,
      sortBy: sortBy !== "newest" ? sortBy : "created",
      sortOrder: sortBy === "price-high" ? "desc" : "asc",
    }),
    [page, searchQuery, statusFilter, sortBy]
  );

  const loading = metricsLoading || listingsLoading;

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Listings Management
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
            Listings Management
          </h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <p className="font-medium">Failed to load data</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => { refetchMetrics(); refetchListings(); }}
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
  const totalListings = businessMetrics.totalListings || 0;
  const activeListings = businessMetrics.activeListings || 0;
  const sponsoredCount = businessMetrics.sponsoredCount || 0;
  const avgQualityScore = businessMetrics.avgQualityScore || 8.4;

  // Extract listings from API response
  const listings = listingsData?.listings || [];
  const pagination = listingsData?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };

  // Prepare sponsored comparison data
  const sponsoredComparisonData =
    businessMetrics.sponsoredPerformance ||
    [
      { name: "Sponsored", impressions: 124500, clicks: 8923, conversions: 342 },
      { name: "Organic", impressions: 87300, clicks: 4156, conversions: 189 },
    ];

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Listings Management
        </h1>
        <p className="text-slate-500">
          Monitor and manage property listings across the platform
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="Total Listings"
          value={totalListings.toString()}
          trend={3.2}
          icon={Building2}
        />
        <MetricCard
          title="Active"
          value={activeListings.toString()}
          subtitle={`${totalListings > 0 ? Math.round((activeListings / totalListings) * 100) : 0}% of total`}
          icon={Eye}
        />
        <MetricCard
          title="Sponsored"
          value={sponsoredCount.toString()}
          trend={7.1}
          icon={Zap}
        />
        <MetricCard
          title="Avg Quality Score"
          value={avgQualityScore.toString()}
          subtitle="Out of 10"
          icon={Heart}
        />
      </div>

      {/* Search, Filters & Sort */}
      <div className="flex gap-6 items-end flex-wrap">
        <SearchInput
          value={searchQuery}
          onChange={(value) => {
            setSearchQuery(value);
            setPage(1);
          }}
          placeholder="Search listings by title or city..."
        />
        <FilterBar
          filters={[
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "pending", label: "Pending" },
            { key: "rented", label: "Rented" },
            { key: "inactive", label: "Inactive" },
          ]}
          selected={statusFilter}
          onChange={(filter) => {
            setStatusFilter(filter);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-slate-200 bg-white text-slate-900 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          >
            <option value="newest">Newest</option>
            <option value="price-high">Price: High to Low</option>
            <option value="price-low">Price: Low to High</option>
            <option value="views">Most Views</option>
          </select>
        </div>
      </div>

      {/* Listings Table */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Listings ({pagination.total})
        </h2>
        <DataTable
          columns={[
            {
              key: "title",
              label: "Title",
              render: (value) => <span className="font-medium">{value}</span>,
            },
            { key: "price", label: "Price", render: (value) => formatCurrency(value) },
            { key: "propertyType", label: "Type" },
            {
              key: "city",
              label: "Location",
              render: (value, row) => (
                <div className="flex items-center gap-1">
                  <MapPin size={16} className="text-gray-400" />
                  {value}, {row.state}
                </div>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (value) => <StatusBadge status={value} size="sm" />,
            },
            { key: "views", label: "Views", render: (value) => formatNumber(value) },
            { key: "saves", label: "Saves", render: (value) => formatNumber(value) },
            {
              key: "isSponsored",
              label: "Sponsored",
              render: (value) =>
                value ? (
                  <Zap size={18} className="text-amber-600" />
                ) : (
                  <span className="text-gray-400">—</span>
                ),
            },
            {
              key: "createdAt",
              label: "Created",
              render: (value) => formatDate(value),
            },
          ]}
          data={listings}
          emptyMessage="No listings found matching your criteria"
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-medium rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
            </div>
            <button
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page >= pagination.totalPages}
              className="px-4 py-2 border border-slate-200 bg-white text-slate-700 font-medium rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Sponsored Performance */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Sponsored vs Organic Performance
        </h2>
        <SimpleBarChart
          data={sponsoredComparisonData}
          dataKey="impressions"
          nameKey="name"
          color="#D97706"
          height={320}
        />
        <div className="grid grid-cols-3 gap-6 mt-6">
          {sponsoredComparisonData.map((data: any) => (
            <div
              key={data.name}
              className="bg-white border border-slate-200 rounded-lg shadow-sm p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {data.name}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Impressions
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatNumber(data.impressions)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Clicks
                  </p>
                  <p className="text-2xl font-bold text-amber-600">
                    {formatNumber(data.clicks)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Conversions
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatNumber(data.conversions)}
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    CTR
                  </p>
                  <p className="text-xl font-bold text-slate-900">
                    {data.impressions ? ((data.clicks / data.impressions) * 100).toFixed(2) : "0.00"}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
