"use client";

import { useState, useEffect, useRef } from "react";
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ExternalLink,
  X,
  Sparkles,
  Loader2,
  Download,
  Star,
  Search,
  MapPin,
} from "lucide-react";

// Custom city picker with search, demand cities, and collapsible state groups
function CityPicker({
  value,
  onChange,
  cities,
  demandCities,
}: {
  value: string;
  onChange: (v: string) => void;
  cities: string[];
  demandCities?: Array<{ city: string; state: string; tenants: Array<{ name: string; budgetMax: number; bedrooms: number }> }>;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleState = (state: string) => {
    setExpandedStates((prev) => {
      const next = new Set(prev);
      next.has(state) ? next.delete(state) : next.add(state);
      return next;
    });
  };

  const byState: Record<string, string[]> = {};
  cities.forEach((c) => {
    const parts = c.split(", ");
    const state = parts[parts.length - 1] || "Other";
    if (!byState[state]) byState[state] = [];
    byState[state].push(c);
  });

  const q = search.toLowerCase();
  const filteredStates = Object.entries(byState)
    .map(([state, stateCities]) => ({
      state,
      cities: q ? stateCities.filter((c) => c.toLowerCase().includes(q)) : stateCities,
    }))
    .filter((s) => s.cities.length > 0)
    .sort((a, b) => a.state.localeCompare(b.state));

  const displayLabel = value === "all" ? "All Cities" : value;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white hover:bg-slate-50 min-w-[200px] justify-between"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown size={14} className={`text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search cities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {/* All Cities option */}
            <button
              onClick={() => { onChange("all"); setOpen(false); setSearch(""); }}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${value === "all" ? "bg-amber-50 text-amber-700 font-medium" : "text-slate-700"}`}
            >
              All Cities
            </button>

            {/* Demand cities */}
            {demandCities && demandCities.length > 0 && !q && (
              <div className="border-t border-slate-100">
                <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-amber-600 font-semibold bg-amber-50/50">
                  Active Tenant Demand
                </div>
                {demandCities.map((dc) => (
                  <button
                    key={dc.city}
                    onClick={() => { onChange(`${dc.city}, ${dc.state}`); setOpen(false); setSearch(""); }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-amber-50 flex items-center justify-between ${value === `${dc.city}, ${dc.state}` ? "bg-amber-50 text-amber-700 font-medium" : "text-slate-700"}`}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin size={12} className="text-amber-500" />
                      {dc.city}, {dc.state}
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      {dc.tenants.length} tenant{dc.tenants.length > 1 ? "s" : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* States — collapsible */}
            <div className="border-t border-slate-100">
              {filteredStates.map(({ state, cities: stateCities }) => {
                const isExpanded = expandedStates.has(state) || !!q;
                return (
                  <div key={state}>
                    <button
                      onClick={() => !q && toggleState(state)}
                      className="w-full px-4 py-2 flex items-center justify-between text-xs uppercase tracking-wider text-slate-500 font-semibold bg-slate-50 hover:bg-slate-100"
                    >
                      <span>{state}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-[10px] font-normal text-slate-400">{stateCities.length}</span>
                        {!q && (isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                      </span>
                    </button>
                    {isExpanded && stateCities.map((c) => (
                      <button
                        key={c}
                        onClick={() => { onChange(c); setOpen(false); setSearch(""); }}
                        className={`w-full px-8 py-2 text-left text-sm hover:bg-slate-50 ${value === c ? "bg-amber-50 text-amber-700 font-medium" : "text-slate-600"}`}
                      >
                        {c.split(", ")[0]}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useApi } from "@/lib/hooks";
import { api } from "@/lib/api";
import { MetricCard } from "@/components/ui/MetricCard";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ListingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

interface ReviewListing {
  id: string;
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  status: string;
  propertyType: string | null;
  createdAt: string;
  address: ListingAddress | null;
  primaryImage: string | null;
  images: string[];
  qualityScore: number | null;
  daysOnMarket: number | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  zillowUrl: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
}

interface ReviewQueueResponse {
  listings: ReviewListing[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  counts: {
    pending: number;
    approved: number;
    rejected: number;
  };
  filters?: {
    cities: string[];
    bedrooms: number[];
    demandCities: Array<{
      city: string;
      state: string;
      approved: number;
      pending: number;
      tenants: Array<{ name: string; budgetMax: number; bedrooms: number }>;
    }>;
  };
}

type TabStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export default function ListingReviewPage() {
  const [activeTab, setActiveTab] = useState<TabStatus>("PENDING_REVIEW");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkNotes, setBulkNotes] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [bedsFilter, setBedsFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [scoring, setScoring] = useState(false);
  const [autoApproving, setAutoApproving] = useState(false);
  const [autoApproveResult, setAutoApproveResult] = useState<{ approved: number; skipped: number; summary: string } | null>(null);
  const [sendingMatches, setSendingMatches] = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<{ processed: number; avgScore: number; distribution: Record<string, number> } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCities, setImportCities] = useState<Array<{ city: string; state: string; tenantCount: number; approved: number; pending: number; total: number; budgetMin: number; budgetMax: number; searchMax: number; bedroomRange: number[]; tenants: Array<{ name: string; bedrooms: number; budget: string; status: string }> }>>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [importCity, setImportCity] = useState("");
  const [importState, setImportState] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [customState, setCustomState] = useState("");

  const {
    data,
    loading,
    error,
    refetch,
  } = useApi<ReviewQueueResponse>(
    () =>
      api.get<ReviewQueueResponse>("/api/admin/listings/review-queue", {
        status: activeTab,
        page,
        limit: 20,
        sort: sortBy,
        city: cityFilter !== "all" ? cityFilter.split(",")[0].trim() : undefined,
        bedrooms: bedsFilter !== "all" ? bedsFilter : undefined,
        minPrice: priceFilter === "under1000" ? 0 : priceFilter === "1000-1500" ? 1000 : priceFilter === "1500-2000" ? 1500 : priceFilter === "2000-2500" ? 2000 : priceFilter === "2500-3000" ? 2500 : priceFilter === "over3000" ? 3000 : undefined,
        maxPrice: priceFilter === "under1000" ? 1000 : priceFilter === "1000-1500" ? 1500 : priceFilter === "1500-2000" ? 2000 : priceFilter === "2000-2500" ? 2500 : priceFilter === "2500-3000" ? 3000 : undefined,
      }),
    [activeTab, page, sortBy, cityFilter, bedsFilter, priceFilter]
  );

  const runScoring = async () => {
    setScoring(true);
    setScoreResult(null);
    try {
      const result = await api.post<{ processed: number; avgScore: number; distribution: Record<string, number> }>("/api/admin/listings/score", {});
      setScoreResult(result);
      refetch();
    } catch (err) {
      console.error("Scoring failed:", err);
    } finally {
      setScoring(false);
    }
  };

  const runAutoApprove = async (dryRun = false) => {
    setAutoApproving(true);
    setAutoApproveResult(null);
    try {
      const city = cityFilter !== "all" ? cityFilter.split(",")[0].trim() : undefined;
      const result = await api.post<{ approved: number; skipped: number; summary: string; reasons: Record<string, number> }>(
        "/api/admin/listings/auto-approve",
        { city, dryRun }
      );
      setAutoApproveResult(result);
      if (!dryRun) refetch();
    } catch (err) {
      console.error("Auto-approve failed:", err);
    } finally {
      setAutoApproving(false);
    }
  };

  const sendMatchesToTenants = async (city: string) => {
    setSendingMatches(city);
    try {
      const result = await api.post<{ notified: number; message: string }>("/api/admin/listings/send-matches", { city });
      alert(result.message || `Sent matches to ${result.notified} tenant(s) in ${city}`);
      refetch();
    } catch (err: any) {
      alert(err?.data?.error || "Failed to send matches");
    } finally {
      setSendingMatches(null);
    }
  };

  const openImportModal = async () => {
    setShowImportModal(true);
    setImportResult(null);
    try {
      const data = await api.get<{ cities: typeof importCities }>("/api/admin/listings/import-city");
      setImportCities(data.cities || []);
    } catch {}
  };

  const triggerImport = async () => {
    const city = importCity || customCity;
    const state = importState || customState;
    if (!city || !state) return;

    setImportLoading(true);
    setImportResult(null);
    try {
      const result = await api.post<{ success: boolean; message: string }>("/api/admin/listings/import-city", { city, state });
      setImportResult(result);
    } catch (err: any) {
      setImportResult({ success: false, message: err?.data?.error || "Import failed" });
    } finally {
      setImportLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
    setExpandedId(null);
  }, [activeTab]);

  const rawListings = data?.listings || [];
  const pagination = data?.pagination;
  const counts = data?.counts || { pending: 0, approved: 0, rejected: 0 };

  // Use API-provided filter options (all cities/beds for this status, not just current page)
  const cities = data?.filters?.cities || [];
  const bedOptions = data?.filters?.bedrooms || [];

  // Client-side filtering
  const listings = rawListings.filter((l) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const addrStr = l.address
        ? `${l.address.street} ${l.address.city} ${l.address.state} ${l.address.zipCode}`.toLowerCase()
        : "";
      const matchesSearch =
        l.title?.toLowerCase().includes(q) || addrStr.includes(q);
      if (!matchesSearch) return false;
    }
    // City, beds, and price filtering handled server-side via API params
    return true;
  });

  // Group listings by city
  const groupedByCity = listings.reduce<Record<string, ReviewListing[]>>((acc, listing) => {
    const city = listing.address ? `${listing.address.city}, ${listing.address.state}` : "Unknown Location";
    if (!acc[city]) acc[city] = [];
    acc[city].push(listing);
    return acc;
  }, {});
  const cityGroups = Object.entries(groupedByCity).sort((a, b) => b[1].length - a[1].length);

  const reviewListing = async (id: string, action: "approve" | "reject") => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await api.post(`/api/admin/listings/${id}/review`, {
        action,
        notes: notes[id] || undefined,
      });
      setNotes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      refetch();
    } catch (err: any) {
      alert(err?.data?.error || "Review failed");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const boostListing = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await api.post(`/api/admin/listings/${id}/review`, {
        action: "boost",
        qualityScore: 95,
      });
      refetch();
    } catch (err: any) {
      alert(err?.data?.error || "Boost failed");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const bulkReview = async (action: "approve" | "reject") => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    setActionLoading((prev) => {
      const next = { ...prev };
      ids.forEach((id) => (next[id] = true));
      return next;
    });
    try {
      await Promise.allSettled(
        ids.map((id) =>
          api.post(`/api/admin/listings/${id}/review`, {
            action,
            notes: bulkNotes || undefined,
          }).catch(() => {}) // Skip already-approved or other errors
        )
      );
      setSelectedIds(new Set());
      setBulkNotes("");
      refetch();
    } catch (err) {
      console.error("Bulk review failed:", err);
    } finally {
      setActionLoading({});
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === listings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(listings.map((l) => l.id)));
    }
  };

  const tabs: { key: TabStatus; label: string; count: number }[] = [
    { key: "PENDING_REVIEW", label: "Pending Review", count: counts.pending },
    { key: "APPROVED", label: "Approved", count: counts.approved },
    { key: "REJECTED", label: "Rejected", count: counts.rejected },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Listing Review</h1>
          <p className="text-slate-500">Review and approve tenant-match listings</p>
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
          <h1 className="text-2xl font-semibold text-slate-900">Listing Review</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <p className="font-medium">Failed to load review queue</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={refetch}
            className="mt-3 bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          Listing Review
        </h1>
        <p className="text-slate-500">
          Review and approve tenant-match listings before they appear to tenants
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-6">
        <MetricCard
          title="Pending Review"
          value={counts.pending.toString()}
          icon={CheckCircle}
        />
        <MetricCard
          title="Approved"
          value={counts.approved.toString()}
          icon={CheckCircle}
        />
        <MetricCard
          title="Rejected"
          value={counts.rejected.toString()}
          icon={XCircle}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                activeTab === tab.key
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search address or title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-64 focus:outline-none focus:border-amber-500"
        />
        <CityPicker
          value={cityFilter}
          onChange={(v) => { setCityFilter(v); setPage(1); }}
          cities={cities}
          demandCities={data?.filters?.demandCities}
        />
        <select
          value={bedsFilter}
          onChange={(e) => setBedsFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="all">All Beds</option>
          {bedOptions.map((b) => (
            <option key={b} value={String(b)}>
              {b === 0 ? "Studio" : `${b} Bed${b > 1 ? "s" : ""}`}
            </option>
          ))}
        </select>
        <select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="all">All Prices</option>
          <option value="under1000">Under $1,000</option>
          <option value="1000-1500">$1,000 – $1,500</option>
          <option value="1500-2000">$1,500 – $2,000</option>
          <option value="2000-2500">$2,000 – $2,500</option>
          <option value="2500-3000">$2,500 – $3,000</option>
          <option value="over3000">$3,000+</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="newest">Newest First</option>
          <option value="score">Best Quality</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
        {(searchQuery || cityFilter !== "all" || bedsFilter !== "all" || priceFilter !== "all") && (
          <button
            onClick={() => { setSearchQuery(""); setCityFilter("all"); setBedsFilter("all"); setPriceFilter("all"); setPage(1); }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Demand Cities — cards */}
      {data?.filters?.demandCities && data.filters.demandCities.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 -mt-1">
          {data.filters.demandCities.map((dc) => {
            const isActive = cityFilter === `${dc.city}, ${dc.state}`;
            const progress = dc.approved >= 40 ? 100 : Math.round((dc.approved / 40) * 100);
            const isReady = dc.approved >= 40;
            return (
              <button
                key={dc.city}
                onClick={() => { setCityFilter(isActive ? "all" : `${dc.city}, ${dc.state}`); setPage(1); }}
                className={`text-left p-3 rounded-lg border-2 transition ${
                  isActive
                    ? "border-amber-500 bg-amber-50"
                    : isReady
                    ? "border-green-300 bg-green-50/50 hover:border-green-400"
                    : "border-slate-200 bg-white hover:border-amber-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm text-slate-900">{dc.city}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    isReady ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {dc.tenants.length} tenant{dc.tenants.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mb-2">
                  ${dc.tenants[0]?.budgetMax.toLocaleString()}/mo · {dc.tenants[0]?.bedrooms === 0 ? "Studio" : dc.tenants[0]?.bedrooms + "BR"}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isReady ? "bg-green-500" : "bg-amber-500"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">
                    {dc.approved}/{40}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-slate-400">{dc.pending} pending</span>
                  {isReady && (
                    <button
                      onClick={(e) => { e.stopPropagation(); sendMatchesToTenants(dc.city); }}
                      disabled={sendingMatches === dc.city}
                      className="text-[10px] px-2 py-0.5 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {sendingMatches === dc.city ? "Sending..." : "Send Matches"}
                    </button>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => runAutoApprove(false)}
            disabled={autoApproving}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {autoApproving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            {autoApproving ? "Approving..." : `Auto-Approve${cityFilter !== "all" ? " " + cityFilter.split(",")[0] : ""}`}
          </button>
          <button
            onClick={openImportModal}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Download size={14} />
            Import Listings
          </button>
          <button
            onClick={runScoring}
            disabled={scoring}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 disabled:opacity-50 transition-colors"
          >
            {scoring ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {scoring ? "Scoring..." : "Score All"}
          </button>
          <span className="text-sm text-slate-400">
            {listings.length} of {rawListings.length} listings
          </span>
        </div>
      </div>

      {/* Score result banner */}
      {autoApproveResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <div className="text-sm text-green-800">
            <span className="font-semibold">{autoApproveResult.summary}</span>
          </div>
          <button onClick={() => setAutoApproveResult(null)} className="text-sm font-medium text-green-700 hover:text-green-900">
            Dismiss
          </button>
        </div>
      )}

      {scoreResult && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
          <div className="text-sm text-amber-800">
            <span className="font-semibold">Scored {scoreResult.processed.toLocaleString()} listings</span>
            {" — "}Avg: {scoreResult.avgScore}/100
            {" | "}
            <span className="text-green-700">{scoreResult.distribution.excellent} excellent</span>
            {", "}
            <span className="text-blue-700">{scoreResult.distribution.good} good</span>
            {", "}
            <span className="text-amber-700">{scoreResult.distribution.fair} fair</span>
            {", "}
            <span className="text-red-700">{scoreResult.distribution.poor} poor</span>
          </div>
          <button onClick={() => { setSortBy("score"); setScoreResult(null); }} className="text-sm font-medium text-amber-700 hover:text-amber-900">
            Sort by quality →
          </button>
        </div>
      )}

      {/* Bulk actions */}
      {activeTab === "PENDING_REVIEW" && listings.length > 0 && (
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
          <button
            onClick={toggleSelectAll}
            className="px-3 py-1.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50"
          >
            {selectedIds.size === listings.length ? "Deselect All" : "Select All"}
          </button>
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm text-slate-500">
                {selectedIds.size} selected
              </span>
              <input
                type="text"
                placeholder="Bulk notes (optional)"
                value={bulkNotes}
                onChange={(e) => setBulkNotes(e.target.value)}
                className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
              <button
                onClick={() => bulkReview("approve")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                <CheckCircle size={16} />
                Approve ({selectedIds.size})
              </button>
              <button
                onClick={() => bulkReview("reject")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <XCircle size={16} />
                Reject ({selectedIds.size})
              </button>
            </>
          )}
        </div>
      )}

      {/* Listings grouped by city */}
      {listings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500">
          No {activeTab === "PENDING_REVIEW" ? "pending" : activeTab.toLowerCase()} listings.
        </div>
      ) : (
        <div className="space-y-6">
          {cityGroups.map(([city, cityListings]) => (
            <div key={city}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">{city}</h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">{cityListings.length}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="space-y-3">
          {cityListings.map((listing) => {
            const isExpanded = expandedId === listing.id;
            const isSelected = selectedIds.has(listing.id);
            const isLoading = actionLoading[listing.id];

            return (
              <div
                key={listing.id}
                className={`bg-white border rounded-lg transition-all ${
                  isSelected
                    ? "border-amber-400 ring-1 ring-amber-200"
                    : "border-slate-200"
                }`}
              >
                <div className="p-4 flex items-start gap-4">
                  {/* Checkbox */}
                  {activeTab === "PENDING_REVIEW" && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(listing.id)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                  )}

                  {/* Thumbnail */}
                  <div
                    className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 relative cursor-pointer group"
                    onClick={() => {
                      if (listing.images.length > 0) {
                        setLightbox({ images: listing.images, index: 0 });
                      }
                    }}
                  >
                    {listing.primaryImage ? (
                      <>
                        <img
                          src={listing.primaryImage}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                        />
                        {listing.images.length > 1 && (
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                            1/{listing.images.length}
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={24} className="text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">
                        {listing.title}
                      </h3>
                      {listing.qualityScore != null && (
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                          listing.qualityScore >= 75 ? "bg-green-50 text-green-700 border-green-200" :
                          listing.qualityScore >= 50 ? "bg-blue-50 text-blue-700 border-blue-200" :
                          listing.qualityScore >= 25 ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {listing.qualityScore}/100
                        </span>
                      )}
                      {listing.daysOnMarket !== null && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 rounded-full">
                          {listing.daysOnMarket}d on market
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {listing.address
                        ? `${listing.address.street}, ${listing.address.city}, ${listing.address.state} ${listing.address.zipCode}`
                        : "No address"}
                    </p>
                    <div className="flex items-center gap-4 mt-1.5 text-sm">
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(listing.price)}/mo
                      </span>
                      <span className="text-slate-500">
                        {listing.bedrooms} bed / {listing.bathrooms} bath
                      </span>
                      {listing.propertyType && (
                        <span className="text-slate-400">{listing.propertyType}</span>
                      )}
                    </div>

                    {/* Review info for approved/rejected */}
                    {listing.reviewedBy && (
                      <p className="text-xs text-slate-400 mt-1.5">
                        Reviewed by {listing.reviewedBy} on{" "}
                        {formatDate(listing.reviewedAt!)}
                        {listing.reviewNotes && (
                          <span className="italic"> — &ldquo;{listing.reviewNotes}&rdquo;</span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      disabled={isLoading}
                      onClick={() => boostListing(listing.id)}
                      className={`p-2 rounded-md transition-colors ${
                        listing.qualityScore && listing.qualityScore >= 90
                          ? "text-amber-500 bg-amber-50"
                          : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                      }`}
                      title={listing.qualityScore && listing.qualityScore >= 90 ? "Boosted" : "Boost ranking"}
                    >
                      <Star size={18} fill={listing.qualityScore && listing.qualityScore >= 90 ? "currentColor" : "none"} />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : listing.id)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {activeTab === "PENDING_REVIEW" && (
                      <>
                        <button
                          disabled={isLoading}
                          onClick={() => reviewListing(listing.id, "approve")}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                          Approve
                        </button>
                        <button
                          disabled={isLoading}
                          onClick={() => reviewListing(listing.id, "reject")}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <XCircle size={16} />
                          )}
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="border-t border-slate-100 pt-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-slate-500">Owner:</span>{" "}
                          <span className="text-slate-900">{listing.ownerName || "Unknown"}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">Email:</span>{" "}
                          <span className="text-slate-900">{listing.ownerEmail || "N/A"}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">Phone:</span>{" "}
                          {listing.ownerPhone ? (
                            <a href={`tel:${listing.ownerPhone}`} className="text-blue-600 hover:underline">
                              {listing.ownerPhone}
                            </a>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">Created:</span>{" "}
                          <span className="text-slate-900">{formatDate(listing.createdAt)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-slate-500">Zillow:</span>{" "}
                          {listing.zillowUrl ? (
                            <a
                              href={listing.zillowUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-600 hover:underline inline-flex items-center gap-1"
                            >
                              View on Zillow
                              <ExternalLink size={12} />
                            </a>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </div>
                      </div>

                      {/* Photo gallery */}
                      {listing.images.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Photos ({listing.images.length})
                          </p>
                          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                            {listing.images.map((url, i) => (
                              <div
                                key={i}
                                className="w-32 h-24 rounded-lg overflow-hidden bg-slate-100 cursor-pointer group flex-shrink-0"
                                onClick={() => setLightbox({ images: listing.images, index: i })}
                              >
                                <img
                                  src={url}
                                  alt={`${listing.title} photo ${i + 1}`}
                                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes input for pending */}
                      {activeTab === "PENDING_REVIEW" && (
                        <div className="mt-4">
                          <textarea
                            placeholder="Add review notes (optional)..."
                            value={notes[listing.id] || ""}
                            onChange={(e) =>
                              setNotes((prev) => ({
                                ...prev,
                                [listing.id]: e.target.value,
                              }))
                            }
                            className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
          >
            <X size={24} />
          </button>

          {lightbox.images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox({
                    ...lightbox,
                    index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length,
                  });
                }}
                className="absolute left-4 text-white/80 hover:text-white p-2 bg-white/10 rounded-full"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox({
                    ...lightbox,
                    index: (lightbox.index + 1) % lightbox.images.length,
                  });
                }}
                className="absolute right-4 text-white/80 hover:text-white p-2 bg-white/10 rounded-full"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.images[lightbox.index]}
              alt={`Photo ${lightbox.index + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
              {lightbox.index + 1} / {lightbox.images.length}
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
          </span>
          <div className="flex gap-2">
            <button
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 px-4 py-2 border border-slate-200 bg-white text-slate-700 font-medium rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <button
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 px-4 py-2 border border-slate-200 bg-white text-slate-700 font-medium rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Import Listings Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setShowImportModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-[560px] max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Import Listings</h2>
                <p className="text-sm text-slate-500">Search Zillow for new listings in a city. Duplicates are automatically skipped.</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4 max-h-[55vh] overflow-y-auto">
              {/* Cities with tenant demand */}
              {importCities.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                    Cities with tenant demand
                  </label>
                  <div className="space-y-1.5">
                    {importCities.map((c) => (
                      <button
                        key={`${c.city}-${c.state}`}
                        onClick={() => { setImportCity(c.city); setImportState(c.state); setCustomCity(""); setCustomState(""); }}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                          importCity === c.city && importState === c.state
                            ? "border-amber-400 bg-amber-50 ring-1 ring-amber-200"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className="text-sm font-medium text-slate-900">{c.city}, {c.state}</span>
                            <span className="ml-2 text-xs text-slate-500">{c.tenantCount} tenant{c.tenantCount !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-green-600">{c.approved} approved</span>
                            <span className="text-amber-600">{c.pending} pending</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Budget: <span className="font-medium text-slate-700">${c.budgetMin?.toLocaleString() || '0'} – ${c.budgetMax?.toLocaleString() || '?'}</span></span>
                          <span>Search up to: <span className="font-medium text-amber-700">${c.searchMax?.toLocaleString()}</span> <span className="text-slate-400">(+22%)</span></span>
                          <span>Beds: <span className="font-medium text-slate-700">{c.bedroomRange?.map(b => b === 0 ? 'Studio' : `${b}BR`).join(', ') || '—'}</span></span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom city input */}
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                  Or enter a custom city
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="City name"
                    value={customCity}
                    onChange={(e) => { setCustomCity(e.target.value); setImportCity(""); setImportState(""); }}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="State (e.g. PA)"
                    value={customState}
                    onChange={(e) => { setCustomState(e.target.value.toUpperCase()); setImportCity(""); setImportState(""); }}
                    className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                    maxLength={2}
                  />
                </div>
              </div>

              {/* Result message */}
              {importResult && (
                <div className={`p-3 rounded-lg text-sm ${
                  importResult.success
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}>
                  {importResult.message}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
              <p className="text-xs text-slate-400">
                {(importCity || customCity) ? `Importing for: ${importCity || customCity}, ${importState || customState}` : "Select a city to import"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={triggerImport}
                  disabled={importLoading || (!(importCity && importState) && !(customCity && customState))}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition"
                >
                  {importLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {importLoading ? "Importing..." : "Start Import"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
