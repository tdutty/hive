"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import {
  RefreshCw,
  Search,
  Building2,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  TrendingUp,
  Users,
} from "lucide-react";

interface TenantDemand {
  tenantCount: number;
  tenants: Array<{ name: string; email: string; city: string; status: string }>;
  selectedListingIds: string[];
  activeCities: string[];
}

interface Holder {
  brokerName: string;
  markets: string[];
  marketCount: number;
  totalUnits: number;
  avgRent: number;
  annualRevenue: number;
  primaryContact: string | null;
  phone: string | null;
  email: string | null;
  demand: TenantDemand | null;
}

interface Listing {
  brokerName: string;
  address: string;
  city: string;
  state: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  agentName: string | null;
  agentPhone: string | null;
  ownerEmail: string | null;
  zillowUrl: string | null;
  daysOnMarket: number | null;
}

interface CityOption {
  city: string;
  state: string;
  count: number;
}

interface PortfolioData {
  holders: Holder[];
  listings: Listing[];
  stats: {
    totalHolders: number;
    totalUnits: number;
    totalAnnualRevenue: number;
    totalMarkets: number;
  };
  cities: CityOption[];
}

export default function PortfolioHoldersPage() {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [minUnits, setMinUnits] = useState("2");
  const [sort, setSort] = useState("units_desc");
  const [demandFilter, setDemandFilter] = useState("all"); // 'all' | 'with_demand' | 'no_demand'

  // Expanded rows
  const [expandedBroker, setExpandedBroker] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { minUnits, sort };
      if (cityFilter) {
        const [city, state] = cityFilter.split("|");
        params.city = city;
        params.state = state;
      }
      if (search) params.search = search;

      const result = await api.get<PortfolioData>(
        "/api/admin/portfolio-holders",
        params
      );
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cityFilter, minUnits, sort]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchData(), 400);
    return () => clearTimeout(t);
  }, [search]);

  const filteredHolders = useMemo(() => {
    if (!data) return [];
    return data.holders.filter((h) => {
      if (demandFilter === "with_demand") return h.demand && h.demand.tenantCount > 0;
      if (demandFilter === "no_demand") return !h.demand || h.demand.tenantCount === 0;
      return true;
    });
  }, [data, demandFilter]);

  const brokerListings = useMemo(() => {
    if (!data) return {};
    const map: Record<string, Listing[]> = {};
    for (const l of data.listings) {
      if (!map[l.brokerName]) map[l.brokerName] = [];
      map[l.brokerName].push(l);
    }
    return map;
  }, [data]);

  const fmt = (n: number) =>
    "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portfolio Holders</h1>
          <p className="text-sm text-gray-400 mt-1">
            Property managers and brokers across your listings — ranked by portfolio size
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-5 gap-4">
          <StatCard
            icon={<TrendingUp size={20} />}
            label="With Tenant Demand"
            value={String(data.holders.filter(h => h.demand && h.demand.tenantCount > 0).length)}
            color="amber"
          />
          <StatCard
            icon={<Building2 size={20} />}
            label="Portfolio Holders"
            value={data.stats.totalHolders.toLocaleString()}
            color="blue"
          />
          <StatCard
            icon={<Users size={20} />}
            label="Total Units"
            value={data.stats.totalUnits.toLocaleString()}
            color="purple"
          />
          <StatCard
            icon={<DollarSign size={20} />}
            label="Annual Revenue"
            value={fmt(data.stats.totalAnnualRevenue)}
            color="green"
          />
          <StatCard
            icon={<MapPin size={20} />}
            label="Markets"
            value={data.stats.totalMarkets.toLocaleString()}
            color="amber"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-[#2a2a3d] p-4 rounded-xl border border-[#3a3a52]">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search broker or agent name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#1e1e2d] border border-[#3a3a52] rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="px-3 py-2 bg-[#1e1e2d] border border-[#3a3a52] rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="">All Markets</option>
          {data?.cities.map((c) => (
            <option key={`${c.city}|${c.state}`} value={`${c.city}|${c.state}`}>
              {c.city}, {c.state} ({c.count})
            </option>
          ))}
        </select>

        <select
          value={minUnits}
          onChange={(e) => setMinUnits(e.target.value)}
          className="px-3 py-2 bg-[#1e1e2d] border border-[#3a3a52] rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="2">2+ units</option>
          <option value="5">5+ units</option>
          <option value="10">10+ units</option>
          <option value="20">20+ units</option>
          <option value="50">50+ units</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 bg-[#1e1e2d] border border-[#3a3a52] rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
        >
          <option value="units_desc">Most Units</option>
          <option value="units_asc">Fewest Units</option>
          <option value="revenue_desc">Highest Revenue</option>
          <option value="avg_rent_desc">Highest Avg Rent</option>
          <option value="markets_desc">Most Markets</option>
          <option value="name_asc">Name A-Z</option>
        </select>

        <select
          value={demandFilter}
          onChange={(e) => setDemandFilter(e.target.value)}
          className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-amber-500 ${
            demandFilter === "with_demand"
              ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
              : "bg-[#1e1e2d] border-[#3a3a52] text-white"
          }`}
        >
          <option value="all">All Holders</option>
          <option value="with_demand">Has Tenant Demand</option>
          <option value="no_demand">No Demand Yet</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      {data && (
        <div className="bg-[#2a2a3d] rounded-xl border border-[#3a3a52] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_80px_100px_120px_140px_160px] gap-2 px-4 py-3 border-b border-[#3a3a52] text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>Broker / Property Manager</span>
            <span>Markets</span>
            <span className="text-right">Units</span>
            <span className="text-right">Avg Rent</span>
            <span className="text-right">Annual Rev</span>
            <span>Contact</span>
            <span>Phone</span>
          </div>

          {/* Rows */}
          {filteredHolders.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No portfolio holders found with current filters.
            </div>
          )}

          {filteredHolders.map((holder) => {
            const isExpanded = expandedBroker === holder.brokerName;
            const holderListings = brokerListings[holder.brokerName] || [];
            const hasDemand = !!holder.demand && holder.demand.tenantCount > 0;

            return (
              <div key={holder.brokerName}>
                {/* Main Row */}
                <div
                  onClick={() =>
                    setExpandedBroker(isExpanded ? null : holder.brokerName)
                  }
                  className={`grid grid-cols-[2fr_1fr_80px_100px_120px_140px_160px] gap-2 px-4 py-3 cursor-pointer transition hover:bg-[#32324a] ${
                    isExpanded ? "bg-[#32324a]" : ""
                  } ${
                    hasDemand ? "border-l-4 border-l-amber-400 bg-amber-500/5" : ""
                  } border-b border-[#3a3a52]/50`}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-amber-400 shrink-0" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm truncate">
                          {holder.brokerName}
                        </span>
                        {hasDemand && (
                          <span className="shrink-0 px-1.5 py-0.5 bg-amber-400/20 text-amber-300 text-[10px] font-bold rounded-full flex items-center gap-1">
                            <Users size={10} />
                            {holder.demand!.tenantCount} {holder.demand!.tenantCount === 1 ? "tenant" : "tenants"}
                          </span>
                        )}
                      </div>
                      {holder.primaryContact && (
                        <div className="text-gray-500 text-xs truncate">
                          {holder.primaryContact}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="flex flex-wrap gap-1">
                      {holder.markets.slice(0, 3).map((m) => (
                        <span
                          key={m}
                          className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded"
                        >
                          {m}
                        </span>
                      ))}
                      {holder.markets.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-gray-500/10 text-gray-400 text-[10px] rounded">
                          +{holder.markets.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-white font-semibold text-sm flex items-center justify-end">
                    {holder.totalUnits}
                  </div>

                  <div className="text-right text-green-400 text-sm flex items-center justify-end">
                    {fmt(holder.avgRent)}/mo
                  </div>

                  <div className="text-right text-emerald-400 font-medium text-sm flex items-center justify-end">
                    {fmt(holder.annualRevenue)}
                  </div>

                  <div className="flex items-center">
                    {holder.email ? (
                      <a
                        href={`mailto:${holder.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-amber-400 text-xs hover:underline truncate"
                      >
                        <Mail size={12} />
                        <span className="truncate">{holder.email}</span>
                      </a>
                    ) : (
                      <span className="text-gray-600 text-xs">No email</span>
                    )}
                  </div>

                  <div className="flex items-center">
                    {holder.phone ? (
                      <a
                        href={`tel:${holder.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-blue-400 text-xs hover:underline"
                      >
                        <Phone size={12} />
                        {holder.phone}
                      </a>
                    ) : (
                      <span className="text-gray-600 text-xs">No phone</span>
                    )}
                  </div>
                </div>

                {/* Expanded: Tenant Demand */}
                {isExpanded && hasDemand && (
                  <div className="bg-amber-500/5 border-b border-amber-500/20 px-6 py-3">
                    <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <TrendingUp size={12} />
                      Active Tenant Demand
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {holder.demand!.tenants.map((t) => (
                        <div
                          key={t.email}
                          className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg"
                        >
                          <div className="w-6 h-6 rounded-full bg-amber-500/30 flex items-center justify-center text-amber-300 text-[10px] font-bold">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-white text-xs font-medium">{t.name}</div>
                            <div className="text-gray-400 text-[10px]">
                              {t.city} &middot;{" "}
                              <span
                                className={
                                  t.status === "selections_confirmed"
                                    ? "text-indigo-400"
                                    : t.status === "leased"
                                    ? "text-green-400"
                                    : t.status === "negotiating"
                                    ? "text-amber-400"
                                    : "text-gray-400"
                                }
                              >
                                {t.status.replace(/_/g, " ")}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500">
                      {holder.demand!.selectedListingIds.length} listing{holder.demand!.selectedListingIds.length !== 1 ? "s" : ""} selected across{" "}
                      {holder.demand!.activeCities.join(", ")}
                    </div>
                  </div>
                )}

                {/* Expanded: Individual Listings */}
                {isExpanded && holderListings.length > 0 && (
                  <div className="bg-[#1e1e2d] border-b border-[#3a3a52]">
                    <div className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-[#2a2a3d]">
                      {holderListings.length} Listings
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {holderListings.map((l, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-[2fr_100px_60px_60px_100px_140px_120px] gap-2 px-6 py-2 text-xs border-b border-[#2a2a3d]/50 hover:bg-[#25253a]"
                        >
                          <div className="text-gray-300 truncate flex items-center gap-1">
                            {l.zillowUrl ? (
                              <a
                                href={l.zillowUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-amber-400 flex items-center gap-1 truncate"
                              >
                                {l.address}
                                <ExternalLink size={10} className="shrink-0" />
                              </a>
                            ) : (
                              l.address
                            )}
                          </div>
                          <div className="text-gray-400">
                            {l.city}, {l.state}
                          </div>
                          <div className="text-green-400 text-right">
                            {l.price ? fmt(l.price) : "-"}
                          </div>
                          <div className="text-gray-400 text-center">
                            {l.bedrooms ?? "-"}bd / {l.bathrooms ?? "-"}ba
                          </div>
                          <div className="text-gray-500">
                            {l.agentName || "-"}
                          </div>
                          <div className="text-gray-500">
                            {l.agentPhone ? (
                              <a
                                href={`tel:${l.agentPhone}`}
                                className="text-blue-400 hover:underline"
                              >
                                {l.agentPhone}
                              </a>
                            ) : (
                              "-"
                            )}
                          </div>
                          <div className="text-gray-500 truncate">
                            {l.ownerEmail ? (
                              <a
                                href={`mailto:${l.ownerEmail}`}
                                className="text-amber-400 hover:underline truncate"
                              >
                                {l.ownerEmail}
                              </a>
                            ) : (
                              "-"
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isExpanded && holderListings.length === 0 && (
                  <div className="bg-[#1e1e2d] border-b border-[#3a3a52] px-6 py-4 text-xs text-gray-500">
                    Listings not loaded for this broker. Try filtering by their market.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={24} className="animate-spin text-amber-400" />
          <span className="ml-3 text-gray-400">Loading portfolio holders...</span>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${colors[color] || colors.blue}`}
    >
      <div className="flex items-center gap-2 mb-2 opacity-70">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs mt-1 opacity-60">{label}</div>
    </div>
  );
}
