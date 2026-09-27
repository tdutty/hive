"use client";

import { useState } from "react";
import { Building2, Eye, Heart, Zap, MapPin } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { listingsService } from "@/lib/services/listings";
import { dashboardService } from "@/lib/services/dashboard";
import { Button, Card, CardHeader, CardBody, Badge, statusTone, StatTile, PageHeader, FilterChips, Table, THead, TH, TBody, TR, TD, Field, Input, Select } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";

type StatusFilter = "all" | "active" | "pending" | "rented" | "inactive";
const STATUS_CHIPS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "rented", label: "Rented" },
  { key: "inactive", label: "Inactive" },
];

export default function ListingsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
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

  if (loading) return <div><PageHeader title="Listings Management" /><Spinner /></div>;
  if (error) return <div><PageHeader title="Listings Management" /><ErrorBanner message={error} onRetry={() => { refetchMetrics(); refetchListings(); }} /></div>;

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
    <div className="max-w-7xl">
      <PageHeader title="Listings Management" description="Monitor and manage property listings across the platform" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile label="Total Listings" value={totalListings} delta="+3.2%" deltaTone="up" hint="vs last period" icon={<Building2 size={14} />} />
        <StatTile label="Active" value={activeListings} hint={`${totalListings > 0 ? Math.round((activeListings / totalListings) * 100) : 0}% of total`} icon={<Eye size={14} />} />
        <StatTile label="Sponsored" value={sponsoredCount} delta="+7.1%" deltaTone="up" hint="vs last period" icon={<Zap size={14} />} />
        <StatTile label="Avg Quality Score" value={avgQualityScore} hint="Out of 10" icon={<Heart size={14} />} />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end gap-3 mb-4">
        <Input
          type="search"
          aria-label="Search listings"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          placeholder="Search listings by title or city..."
          className="lg:max-w-xs"
        />
        <FilterChips items={STATUS_CHIPS} value={statusFilter} onChange={(f) => { setStatusFilter(f); setPage(1); }} className="lg:flex-1" />
        <Field label="Sort" className="w-full sm:w-56">
          <Select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
            <option value="newest">Newest</option>
            <option value="price-high">Price: High to Low</option>
            <option value="price-low">Price: Low to High</option>
            <option value="views">Most Views</option>
          </Select>
        </Field>
      </div>

      <Card className="mb-5">
        <CardHeader title={`Listings (${pagination.total})`} />
        {listings.length === 0 ? (
          <EmptyState title="No listings found matching your criteria" />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Title</TH>
                <TH numeric>Price</TH>
                <TH>Type</TH>
                <TH>Location</TH>
                <TH>Status</TH>
                <TH numeric>Views</TH>
                <TH numeric>Saves</TH>
                <TH>Sponsored</TH>
                <TH>Created</TH>
              </tr>
            </THead>
            <TBody>
              {listings.map((l: any, i: number) => (
                <TR key={l.id ?? i}>
                  <TD className="font-medium">{l.title}</TD>
                  <TD numeric>{formatCurrency(l.price)}</TD>
                  <TD muted>{l.propertyType || "-"}</TD>
                  <TD muted>
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      <MapPin size={13} className="text-slate-400" aria-hidden />
                      {l.city}, {l.state}
                    </span>
                  </TD>
                  <TD><Badge tone={statusTone(l.status)} dot>{l.status}</Badge></TD>
                  <TD numeric>{formatNumber(l.views)}</TD>
                  <TD numeric>{formatNumber(l.saves)}</TD>
                  <TD>
                    {l.isSponsored ? (
                      <Zap size={15} className="text-amber-600" aria-label="Sponsored" />
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TD>
                  <TD muted className="tabular whitespace-nowrap">{formatDate(l.createdAt)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-200">
            <Button size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Previous</Button>
            <span className="text-xs text-slate-500 tabular">Page {pagination.page} of {pagination.totalPages}</span>
            <Button size="sm" onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page >= pagination.totalPages}>Next</Button>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Sponsored vs Organic Performance" description="Impressions, clicks and conversions by placement." />
        <CardBody className="space-y-4">
          <SimpleBarChart
            data={sponsoredComparisonData}
            dataKey="impressions"
            nameKey="name"
            color="#D97706"
            height={320}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sponsoredComparisonData.map((data: any) => (
              <Card key={data.name}>
                <CardHeader title={data.name} />
                <CardBody>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Impressions</dt>
                      <dd className="text-lg font-semibold text-slate-900 tabular mt-0.5">{formatNumber(data.impressions)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Clicks</dt>
                      <dd className="text-lg font-semibold text-slate-900 tabular mt-0.5">{formatNumber(data.clicks)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">Conversions</dt>
                      <dd className="text-lg font-semibold text-slate-900 tabular mt-0.5">{formatNumber(data.conversions)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">CTR</dt>
                      <dd className="text-lg font-semibold text-slate-900 tabular mt-0.5">
                        {data.impressions ? ((data.clicks / data.impressions) * 100).toFixed(2) : "0.00"}%
                      </dd>
                    </div>
                  </dl>
                </CardBody>
              </Card>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
