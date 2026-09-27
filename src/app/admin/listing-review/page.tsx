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
  Download,
  Star,
  Search,
  MapPin,
  Send,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/lib/hooks";
import { api } from "@/lib/api";
import { Button, Card, CardBody, Badge, statusTone, StatTile, PageHeader, FilterChips, Field, Input, Select, Textarea } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

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

  const displayLabel = value === "all" ? "All cities" : value;
  const pick = (v: string) => { onChange(v); setOpen(false); setSearch(""); };
  const optionCls = (active: boolean, indent = false) =>
    cn("w-full py-2 text-left text-sm hover:bg-slate-50 flex items-center justify-between gap-2", indent ? "px-8" : "px-4", active ? "bg-amber-50 text-amber-800 font-medium" : "text-slate-700");

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full sm:w-auto sm:min-w-[200px] justify-between font-normal"
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown size={14} className={cn("text-slate-400 transition-transform", open && "rotate-180")} aria-hidden />
      </Button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-200">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
              <Input
                type="text"
                placeholder="Search cities..."
                aria-label="Search cities"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
          </div>

          <div role="listbox" aria-label="City" className="max-h-[400px] overflow-y-auto">
            <button type="button" role="option" aria-selected={value === "all"} onClick={() => pick("all")} className={optionCls(value === "all")}>
              All cities
            </button>

            {demandCities && demandCities.length > 0 && !q && (
              <div className="border-t border-slate-100">
                <div className="px-4 py-2 text-xs uppercase tracking-wide text-amber-700 font-medium bg-amber-50/60">
                  Active tenant demand
                </div>
                {demandCities.map((dc) => {
                  const v = `${dc.city}, ${dc.state}`;
                  return (
                    <button key={dc.city} type="button" role="option" aria-selected={value === v} onClick={() => pick(v)} className={optionCls(value === v)}>
                      <span className="flex items-center gap-2 min-w-0">
                        <MapPin size={12} className="text-amber-500 shrink-0" aria-hidden />
                        <span className="truncate">{dc.city}, {dc.state}</span>
                      </span>
                      <Badge tone="warning">{dc.tenants.length} tenant{dc.tenants.length > 1 ? "s" : ""}</Badge>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="border-t border-slate-100">
              {filteredStates.map(({ state, cities: stateCities }) => {
                const isExpanded = expandedStates.has(state) || !!q;
                return (
                  <div key={state}>
                    <button
                      type="button"
                      onClick={() => !q && toggleState(state)}
                      aria-expanded={isExpanded}
                      className="w-full px-4 py-2 flex items-center justify-between text-xs uppercase tracking-wide text-slate-500 font-medium bg-slate-50 hover:bg-slate-100"
                    >
                      <span>{state}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-xs font-normal text-slate-400 tabular">{stateCities.length}</span>
                        {!q && (isExpanded ? <ChevronUp size={12} aria-hidden /> : <ChevronDown size={12} aria-hidden />)}
                      </span>
                    </button>
                    {isExpanded && stateCities.map((c) => (
                      <button key={c} type="button" role="option" aria-selected={value === c} onClick={() => pick(c)} className={optionCls(value === c, true)}>
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

/** Prefer the API's own error text, then the thrown message. */
const errMsg = (err: any) => err?.data?.error || err?.message || "Unknown error";

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
      tenants: Array<{ name: string; email: string; budgetMax: number; bedrooms: number; wantsRoommate: boolean; genderPref: string | null; moveInDate: string; status: string }>;
    }>;
  };
}

type TabStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";
const TAB_LABEL: Record<TabStatus, string> = { PENDING_REVIEW: "Pending review", APPROVED: "Approved", REJECTED: "Rejected" };
const statusLabel = (s: string) => TAB_LABEL[s as TabStatus] || s.toLowerCase().replace(/_/g, " ");
const scoreTone = (score: number): "success" | "info" | "warning" | "danger" => (score >= 75 ? "success" : score >= 50 ? "info" : score >= 25 ? "warning" : "danger");
const beds = (n: number) => (n === 0 ? "Studio" : `${n}BR`);

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
    } catch (err: any) {
      toast.error("Scoring failed", { description: errMsg(err) });
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
    } catch (err: any) {
      toast.error("Auto-approve failed", { description: errMsg(err) });
    } finally {
      setAutoApproving(false);
    }
  };

  const sendMatchesToTenants = async (city: string) => {
    setSendingMatches(city);
    try {
      const result = await api.post<{ notified: number; message: string }>("/api/admin/listings/send-matches", { city });
      toast.success(result.message || `Sent matches to ${result.notified} tenant(s) in ${city}`);
      refetch();
    } catch (err: any) {
      toast.error("Failed to send matches", { description: errMsg(err) });
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
    } catch (err: any) {
      toast.error("Could not load cities with tenant demand", { description: errMsg(err) });
    }
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

  // Lightbox: Escape closes it.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

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
      toast.error("Review failed", { description: errMsg(err) });
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
      toast.error("Boost failed", { description: errMsg(err) });
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
      const results = await Promise.allSettled(
        ids.map((id) =>
          api.post(`/api/admin/listings/${id}/review`, {
            action,
            notes: bulkNotes || undefined,
          })
        )
      );
      const failedIds = ids.filter((_, i) => results[i].status === "rejected");
      const okCount = ids.length - failedIds.length;
      const verb = action === "approve" ? "approved" : "rejected";
      if (failedIds.length === 0) {
        toast.success(`${okCount} ${verb}`);
      } else {
        const firstReason = (results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined)?.reason;
        toast.error(`${okCount} ${verb}, ${failedIds.length} failed`, {
          description: `${errMsg(firstReason)}. Failed: ${failedIds.join(", ")}`,
        });
      }
      setSelectedIds(new Set());
      setBulkNotes("");
      refetch();
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
    { key: "PENDING_REVIEW", label: TAB_LABEL.PENDING_REVIEW, count: counts.pending },
    { key: "APPROVED", label: TAB_LABEL.APPROVED, count: counts.approved },
    { key: "REJECTED", label: TAB_LABEL.REJECTED, count: counts.rejected },
  ];
  const hasFilters = !!searchQuery || cityFilter !== "all" || bedsFilter !== "all" || priceFilter !== "all";
  const cityShort = cityFilter !== "all" ? cityFilter.split(",")[0] : "";

  const headerActions = (
    <>
      <Button icon={<Sparkles size={14} />} loading={scoring} onClick={runScoring}>
        {scoring ? "Scoring..." : "Score all"}
      </Button>
      <Button icon={<CheckCircle size={14} />} loading={autoApproving} onClick={() => runAutoApprove(false)}>
        {autoApproving ? "Approving..." : `Auto-approve${cityShort ? " " + cityShort : ""}`}
      </Button>
      <Button variant="primary" icon={<Download size={14} />} onClick={openImportModal}>
        Import listings
      </Button>
    </>
  );

  if (loading) {
    return (
      <div>
        <PageHeader title="Listing Review" description="Review and approve tenant-match listings" />
        <Spinner label="Loading review queue" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Listing Review" />
        <ErrorBanner message={`Failed to load review queue: ${error}`} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Listing Review"
        meta="Listings · tenant matches"
        description="Review and approve tenant-match listings before they appear to tenants."
        actions={headerActions}
      />

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatTile label="Pending review" value={counts.pending} icon={<CheckCircle size={14} />} />
        <StatTile label="Approved" value={counts.approved} icon={<CheckCircle size={14} />} />
        <StatTile label="Rejected" value={counts.rejected} icon={<XCircle size={14} />} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <Field label="Search" className="w-full sm:w-64">
          <Input
            type="search"
            placeholder="Address or title"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Field>
        <div className="w-full sm:w-auto">
          <span className="block text-xs font-medium text-slate-600 mb-1">City</span>
          <CityPicker
            value={cityFilter}
            onChange={(v) => { setCityFilter(v); setPage(1); }}
            cities={cities}
            demandCities={data?.filters?.demandCities}
          />
        </div>
        <Field label="Beds" className="w-[calc(50%-0.375rem)] sm:w-auto">
          <Select value={bedsFilter} onChange={(e) => setBedsFilter(e.target.value)}>
            <option value="all">All beds</option>
            {bedOptions.map((b) => (
              <option key={b} value={String(b)}>
                {b === 0 ? "Studio" : `${b} Bed${b > 1 ? "s" : ""}`}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Price" className="w-[calc(50%-0.375rem)] sm:w-auto">
          <Select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
            <option value="all">All prices</option>
            <option value="under1000">Under $1,000</option>
            <option value="1000-1500">$1,000 - $1,500</option>
            <option value="1500-2000">$1,500 - $2,000</option>
            <option value="2000-2500">$2,000 - $2,500</option>
            <option value="2500-3000">$2,500 - $3,000</option>
            <option value="over3000">$3,000+</option>
          </Select>
        </Field>
        <Field label="Sort" className="w-[calc(50%-0.375rem)] sm:w-auto">
          <Select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
            <option value="newest">Newest first</option>
            <option value="score">Best quality</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </Select>
        </Field>
        {hasFilters && (
          <Button variant="ghost" onClick={() => { setSearchQuery(""); setCityFilter("all"); setBedsFilter("all"); setPriceFilter("all"); setPage(1); }}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Demand cities */}
      {data?.filters?.demandCities && data.filters.demandCities.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-5">
          {data.filters.demandCities.map((dc) => {
            const value = `${dc.city}, ${dc.state}`;
            const isActive = cityFilter === value;
            const progress = dc.approved >= 20 ? 100 : Math.round((dc.approved / 40) * 100);
            const isReady = dc.approved >= 20;
            const toggle = () => { setCityFilter(isActive ? "all" : value); setPage(1); };
            return (
              <Card
                key={dc.city}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                onClick={toggle}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
                className={cn(
                  "text-left p-3 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                  isActive ? "border-amber-500 bg-amber-50" : isReady ? "border-emerald-300 hover:border-emerald-400" : "hover:border-slate-400"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-semibold text-sm text-slate-900 truncate">{dc.city}</span>
                  <Badge tone={isReady ? "success" : "warning"}>{dc.tenants.length} tenant{dc.tenants.length > 1 ? "s" : ""}</Badge>
                </div>
                <div className="text-xs text-slate-500 mb-2 tabular">
                  ${dc.tenants[0]?.budgetMax.toLocaleString()}/mo · {dc.tenants[0]?.bedrooms === 0 ? "Studio" : dc.tenants[0]?.bedrooms + "BR"}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={dc.approved} aria-valuemin={0} aria-valuemax={20} aria-label={`${dc.city} approved listings`}>
                    <div className={cn("h-full rounded-full transition-all", isReady ? "bg-emerald-500" : "bg-amber-500")} style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-500 whitespace-nowrap tabular">{dc.approved}/20</span>
                </div>
                <div className="flex items-center justify-between mt-1.5 min-h-[2rem]">
                  <span className="text-xs text-slate-500 tabular">{dc.pending} pending</span>
                  {isReady && (
                    <Button
                      size="sm"
                      icon={<Send size={12} />}
                      loading={sendingMatches === dc.city}
                      onClick={(e) => { e.stopPropagation(); sendMatchesToTenants(dc.city); }}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {sendingMatches === dc.city ? "Sending..." : "Send matches"}
                    </Button>
                  )}
                </div>
                {isActive && (
                  <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5">
                    {dc.tenants.map((t, i) => (
                      <div key={i} className="text-xs flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-700 truncate max-w-[100px]">{t.name}</span>
                        <span className="text-slate-500 tabular">${t.budgetMax.toLocaleString()}</span>
                        <span className="text-slate-500">{beds(t.bedrooms)}</span>
                        {t.wantsRoommate && <Badge tone="info">Roommate</Badge>}
                        {t.moveInDate && <span className="text-slate-500 tabular">{t.moveInDate.slice(0, 7)}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Tabs + count */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <FilterChips items={tabs} value={activeTab} onChange={setActiveTab} />
        <span className="text-xs text-slate-500 tabular">{listings.length} of {rawListings.length} listings</span>
      </div>

      {/* Result notices */}
      {autoApproveResult && (
        <div role="status" className="mb-4 rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 flex items-center justify-between gap-3">
          <span className="font-medium">{autoApproveResult.summary}</span>
          <Button size="sm" variant="ghost" onClick={() => setAutoApproveResult(null)}>Dismiss</Button>
        </div>
      )}

      {scoreResult && (
        <div role="status" className="mb-4 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 flex flex-wrap items-center justify-between gap-3">
          <span className="tabular">
            <span className="font-medium">Scored {scoreResult.processed.toLocaleString()} listings</span>
            {" · "}avg {scoreResult.avgScore}/100
            {" · "}{scoreResult.distribution.excellent} excellent, {scoreResult.distribution.good} good, {scoreResult.distribution.fair} fair, {scoreResult.distribution.poor} poor
          </span>
          <Button size="sm" variant="ghost" onClick={() => { setSortBy("score"); setScoreResult(null); }}>Sort by quality</Button>
        </div>
      )}

      {/* Bulk actions */}
      {activeTab === "PENDING_REVIEW" && listings.length > 0 && (
        <Card className="mb-4">
          <CardBody className="p-3 flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={toggleSelectAll}>
              {selectedIds.size === listings.length ? "Deselect all" : "Select all"}
            </Button>
            {selectedIds.size > 0 && (
              <>
                <span className="text-sm text-slate-500 tabular">{selectedIds.size} selected</span>
                <Input
                  type="text"
                  placeholder="Bulk notes (optional)"
                  aria-label="Bulk review notes"
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  className="h-8 w-full sm:w-64"
                />
                <Button size="sm" icon={<CheckCircle size={14} className="text-emerald-600" />} onClick={() => bulkReview("approve")}>
                  Approve ({selectedIds.size})
                </Button>
                <Button size="sm" variant="danger" icon={<XCircle size={14} />} onClick={() => bulkReview("reject")}>
                  Reject ({selectedIds.size})
                </Button>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Listings grouped by city */}
      {listings.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox size={26} className="mx-auto" />}
            title={`No ${activeTab === "PENDING_REVIEW" ? "pending" : activeTab.toLowerCase()} listings`}
            hint={hasFilters ? "Try clearing a filter." : undefined}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {cityGroups.map(([city, cityListings]) => (
            <section key={city} aria-label={city}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">{city}</h3>
                <Badge>{cityListings.length}</Badge>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cityListings.map((listing) => {
                  const isExpanded = expandedId === listing.id;
                  const isSelected = selectedIds.has(listing.id);
                  const isLoading = !!actionLoading[listing.id];
                  const isBoosted = !!listing.qualityScore && listing.qualityScore >= 90;
                  const isPending = activeTab === "PENDING_REVIEW";

                  return (
                    <Card key={listing.id} className={cn("flex flex-col overflow-hidden transition-colors", isSelected && "border-amber-400 ring-1 ring-amber-200")}>
                      {/* Photo */}
                      <div className="relative">
                        <button
                          type="button"
                          disabled={listing.images.length === 0}
                          onClick={() => { if (listing.images.length > 0) setLightbox({ images: listing.images, index: 0 }); }}
                          aria-label={listing.images.length > 0 ? `Open ${listing.images.length} photo${listing.images.length > 1 ? "s" : ""} of ${listing.title}` : "No photos"}
                          className="block w-full aspect-[4/3] bg-slate-100 overflow-hidden group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 disabled:cursor-default"
                        >
                          {listing.primaryImage ? (
                            <img
                              src={listing.primaryImage}
                              alt={listing.title}
                              width={640}
                              height={480}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon size={28} className="text-slate-300" aria-hidden />
                            </div>
                          )}
                        </button>
                        {listing.images.length > 1 && (
                          <span className="absolute bottom-2 right-2 bg-slate-950/70 text-white text-xs font-medium px-1.5 py-0.5 rounded-sm tabular pointer-events-none">
                            1/{listing.images.length}
                          </span>
                        )}
                        {isPending && (
                          <label className="absolute top-2 left-2 flex items-center justify-center h-7 w-7 rounded-sm bg-white/95 border border-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(listing.id)}
                              className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="sr-only">Select {listing.title}</span>
                          </label>
                        )}
                        <div className="absolute top-2 right-2 flex items-center gap-1.5">
                          {listing.qualityScore != null && (
                            <Badge tone={scoreTone(listing.qualityScore)} className="tabular">{listing.qualityScore}/100</Badge>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <CardBody className="p-3 flex-1 flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-slate-900 text-sm truncate" title={listing.title}>{listing.title}</h4>
                          <span className="font-semibold text-slate-900 text-sm tabular shrink-0">{formatCurrency(listing.price)}/mo</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {listing.address
                            ? `${listing.address.street}, ${listing.address.city}, ${listing.address.state} ${listing.address.zipCode}`
                            : "No address"}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                          <span className="tabular">{listing.bedrooms} bed / {listing.bathrooms} bath</span>
                          {listing.propertyType && <span>· {listing.propertyType}</span>}
                          {listing.daysOnMarket !== null && <Badge tone="neutral" className="tabular">{listing.daysOnMarket}d on market</Badge>}
                          {!isPending && <Badge tone={statusTone(listing.status)} dot>{statusLabel(listing.status)}</Badge>}
                        </div>

                        {listing.reviewedBy && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Reviewed by {listing.reviewedBy} on {formatDate(listing.reviewedAt!)}
                            {listing.reviewNotes && <span className="italic"> &ldquo;{listing.reviewNotes}&rdquo;</span>}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1 mt-auto pt-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8", isBoosted ? "text-amber-500 bg-amber-50 hover:text-amber-600" : "hover:text-amber-500")}
                            disabled={isLoading}
                            onClick={() => boostListing(listing.id)}
                            title={isBoosted ? "Boosted" : "Boost ranking"}
                            aria-label={isBoosted ? "Boosted" : "Boost ranking"}
                            aria-pressed={isBoosted}
                          >
                            <Star size={16} fill={isBoosted ? "currentColor" : "none"} aria-hidden />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setExpandedId(isExpanded ? null : listing.id)}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "Hide details" : "Show details"}
                          >
                            {isExpanded ? <ChevronUp size={16} aria-hidden /> : <ChevronDown size={16} aria-hidden />}
                          </Button>
                          {isPending && (
                            <div className="ml-auto flex items-center gap-1.5">
                              <Button size="sm" icon={<CheckCircle size={14} className="text-emerald-600" />} loading={isLoading} onClick={() => reviewListing(listing.id, "approve")}>
                                Approve
                              </Button>
                              <Button size="sm" variant="dangerOutline" icon={<XCircle size={14} />} loading={isLoading} onClick={() => reviewListing(listing.id, "reject")}>
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardBody>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t border-slate-200 px-3 py-3 space-y-3 bg-slate-50/50">
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                            <div className="min-w-0"><dt className="inline font-medium text-slate-500">Owner: </dt><dd className="inline text-slate-900 break-words">{listing.ownerName || "Unknown"}</dd></div>
                            <div className="min-w-0"><dt className="inline font-medium text-slate-500">Email: </dt><dd className="inline text-slate-900 break-all">{listing.ownerEmail || "N/A"}</dd></div>
                            <div className="min-w-0">
                              <dt className="inline font-medium text-slate-500">Phone: </dt>
                              <dd className="inline">
                                {listing.ownerPhone ? (
                                  <a href={`tel:${listing.ownerPhone}`} className="text-sky-700 hover:underline tabular">{listing.ownerPhone}</a>
                                ) : (
                                  <span className="text-slate-500">N/A</span>
                                )}
                              </dd>
                            </div>
                            <div className="min-w-0"><dt className="inline font-medium text-slate-500">Created: </dt><dd className="inline text-slate-900 tabular">{formatDate(listing.createdAt)}</dd></div>
                            <div className="min-w-0">
                              <dt className="inline font-medium text-slate-500">Zillow: </dt>
                              <dd className="inline">
                                {listing.zillowUrl ? (
                                  <a href={listing.zillowUrl} target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:underline inline-flex items-center gap-1">
                                    View on Zillow <ExternalLink size={12} aria-hidden />
                                  </a>
                                ) : (
                                  <span className="text-slate-500">N/A</span>
                                )}
                              </dd>
                            </div>
                          </dl>

                          {listing.images.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Photos ({listing.images.length})</p>
                              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
                                {listing.images.map((url, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setLightbox({ images: listing.images, index: i })}
                                    aria-label={`Open photo ${i + 1} of ${listing.images.length}`}
                                    className="w-28 aspect-[4/3] rounded-sm overflow-hidden bg-slate-100 shrink-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                                  >
                                    <img
                                      src={url}
                                      alt={`${listing.title} photo ${i + 1}`}
                                      width={224}
                                      height={168}
                                      loading="lazy"
                                      className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {isPending && (
                            <Field label="Review notes" hint="Optional. Saved with approve or reject.">
                              <Textarea
                                rows={2}
                                placeholder="Add review notes"
                                value={notes[listing.id] || ""}
                                onChange={(e) => setNotes((prev) => ({ ...prev, [listing.id]: e.target.value }))}
                                className="resize-none"
                              />
                            </Field>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
          <span className="text-sm text-slate-500 tabular">
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
          </span>
          <div className="flex gap-2">
            <Button size="sm" icon={<ChevronLeft size={14} />} disabled={!pagination.hasPrevPage} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button size="sm" disabled={!pagination.hasNextPage} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight size={14} aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${lightbox.index + 1} of ${lightbox.images.length}`}
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close photo viewer"
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X size={24} aria-hidden />
          </button>

          {lightbox.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox({
                    ...lightbox,
                    index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length,
                  });
                }}
                aria-label="Previous photo"
                className="absolute left-4 text-white/80 hover:text-white p-2 bg-white/10 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronLeft size={28} aria-hidden />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox({
                    ...lightbox,
                    index: (lightbox.index + 1) % lightbox.images.length,
                  });
                }}
                aria-label="Next photo"
                className="absolute right-4 text-white/80 hover:text-white p-2 bg-white/10 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronRight size={28} aria-hidden />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[85vh] relative px-14" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.images[lightbox.index]}
              alt={`Photo ${lightbox.index + 1}`}
              width={1280}
              height={960}
              loading="lazy"
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950/70 text-white text-sm px-3 py-1 rounded-full tabular">
              {lightbox.index + 1} / {lightbox.images.length}
            </div>
          </div>
        </div>
      )}

      {/* Import Listings Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import listings" size="lg">
        <p className="text-sm text-slate-500">Search Zillow for new listings in a city. Duplicates are automatically skipped.</p>

        <div className="mt-4 space-y-4">
          {importCities.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-600 mb-1.5">Cities with tenant demand</p>
              <div className="space-y-1.5" role="radiogroup" aria-label="Cities with tenant demand">
                {importCities.map((c) => {
                  const selected = importCity === c.city && importState === c.state;
                  return (
                    <button
                      key={`${c.city}-${c.state}`}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => { setImportCity(c.city); setImportState(c.state); setCustomCity(""); setCustomState(""); }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                        selected ? "border-amber-400 bg-amber-50 ring-1 ring-amber-200" : "border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-slate-900">{c.city}, {c.state}</span>
                          <span className="ml-2 text-xs text-slate-500 tabular">{c.tenantCount} tenant{c.tenantCount !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge tone="success" className="tabular">{c.approved} approved</Badge>
                          <Badge tone="warning" className="tabular">{c.pending} pending</Badge>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 tabular">
                        <span>Budget: <span className="font-medium text-slate-700">${c.budgetMin?.toLocaleString() || "0"} - ${c.budgetMax?.toLocaleString() || "?"}</span></span>
                        <span>Search up to: <span className="font-medium text-amber-700">${c.searchMax?.toLocaleString()}</span> <span className="text-slate-400">(+22%)</span></span>
                        <span>Beds: <span className="font-medium text-slate-700">{c.bedroomRange?.map(beds).join(", ") || "-"}</span></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-slate-600 mb-1.5">Or enter a custom city</p>
            <div className="flex gap-2">
              <Field label="City" className="flex-1">
                <Input
                  type="text"
                  placeholder="City name"
                  value={customCity}
                  onChange={(e) => { setCustomCity(e.target.value); setImportCity(""); setImportState(""); }}
                />
              </Field>
              <Field label="State" className="w-24">
                <Input
                  type="text"
                  placeholder="e.g. PA"
                  value={customState}
                  onChange={(e) => { setCustomState(e.target.value.toUpperCase()); setImportCity(""); setImportState(""); }}
                  maxLength={2}
                />
              </Field>
            </div>
          </div>

          {importResult && (
            importResult.success ? (
              <div role="status" className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{importResult.message}</div>
            ) : (
              <ErrorBanner message={importResult.message} />
            )
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
          <p className="text-xs text-slate-500 mr-auto">
            {(importCity || customCity) ? `Importing for: ${importCity || customCity}, ${importState || customState}` : "Select a city to import"}
          </p>
          <Button onClick={() => setShowImportModal(false)}>Cancel</Button>
          <Button
            variant="primary"
            icon={<Download size={14} />}
            loading={importLoading}
            disabled={!(importCity && importState) && !(customCity && customState)}
            onClick={triggerImport}
          >
            {importLoading ? "Importing..." : "Start import"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
