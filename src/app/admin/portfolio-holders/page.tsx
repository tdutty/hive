"use client";

import { Fragment, useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import { Button, Card, Badge, statusTone, StatTile, PageHeader, Table, THead, TH, TBody, TR, TD, Input, Select } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import {
  RefreshCw,
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
    <div className="max-w-7xl space-y-5">
      <PageHeader
        title="Portfolio Holders"
        description="Property managers and brokers across your listings, ranked by portfolio size"
        actions={
          <Button variant="ghost" size="icon" aria-label="Refresh" onClick={fetchData} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </Button>
        }
      />

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatTile
            icon={<TrendingUp size={14} />}
            label="With Tenant Demand"
            value={String(data.holders.filter(h => h.demand && h.demand.tenantCount > 0).length)}
          />
          <StatTile icon={<Building2 size={14} />} label="Portfolio Holders" value={data.stats.totalHolders.toLocaleString()} />
          <StatTile icon={<Users size={14} />} label="Total Units" value={data.stats.totalUnits.toLocaleString()} />
          <StatTile icon={<DollarSign size={14} />} label="Annual Revenue" value={fmt(data.stats.totalAnnualRevenue)} />
          <StatTile icon={<MapPin size={14} />} label="Markets" value={data.stats.totalMarkets.toLocaleString()} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <Input
          type="search"
          aria-label="Search broker or agent name"
          placeholder="Search broker or agent name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:flex-1 sm:min-w-[200px] sm:max-w-md"
        />

        <Select aria-label="Market" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="sm:w-52">
          <option value="">All Markets</option>
          {data?.cities.map((c) => (
            <option key={`${c.city}|${c.state}`} value={`${c.city}|${c.state}`}>
              {c.city}, {c.state} ({c.count})
            </option>
          ))}
        </Select>

        <Select aria-label="Minimum units" value={minUnits} onChange={(e) => setMinUnits(e.target.value)} className="sm:w-32">
          <option value="2">2+ units</option>
          <option value="5">5+ units</option>
          <option value="10">10+ units</option>
          <option value="20">20+ units</option>
          <option value="50">50+ units</option>
        </Select>

        <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} className="sm:w-44">
          <option value="units_desc">Most Units</option>
          <option value="units_asc">Fewest Units</option>
          <option value="revenue_desc">Highest Revenue</option>
          <option value="avg_rent_desc">Highest Avg Rent</option>
          <option value="markets_desc">Most Markets</option>
          <option value="name_asc">Name A-Z</option>
        </Select>

        <Select aria-label="Tenant demand" value={demandFilter} onChange={(e) => setDemandFilter(e.target.value)} className="sm:w-48">
          <option value="all">All Holders</option>
          <option value="with_demand">Has Tenant Demand</option>
          <option value="no_demand">No Demand Yet</option>
        </Select>
      </div>

      {error && <ErrorBanner message={error} onRetry={fetchData} />}

      {/* Table */}
      {data && (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Broker / Property Manager</TH>
                <TH>Markets</TH>
                <TH numeric>Units</TH>
                <TH numeric>Avg Rent</TH>
                <TH numeric>Annual Rev</TH>
                <TH>Contact</TH>
                <TH>Phone</TH>
              </tr>
            </THead>
            <TBody>
              {filteredHolders.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState title="No portfolio holders found" hint="Try loosening the current filters." />
                  </td>
                </tr>
              )}

              {filteredHolders.map((holder) => {
                const isExpanded = expandedBroker === holder.brokerName;
                const holderListings = brokerListings[holder.brokerName] || [];
                const hasDemand = !!holder.demand && holder.demand.tenantCount > 0;

                return (
                  <Fragment key={holder.brokerName}>
                    <TR
                      clickable
                      selected={isExpanded}
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedBroker(isExpanded ? null : holder.brokerName)}
                    >
                      <TD>
                        <div className="flex items-center gap-2 min-w-0">
                          {isExpanded ? (
                            <ChevronDown size={16} className="text-slate-500 shrink-0" aria-hidden />
                          ) : (
                            <ChevronRight size={16} className="text-slate-400 shrink-0" aria-hidden />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 truncate">{holder.brokerName}</span>
                              {hasDemand && (
                                <Badge tone="accent" className="shrink-0">
                                  <Users size={12} aria-hidden />
                                  {holder.demand!.tenantCount} {holder.demand!.tenantCount === 1 ? "tenant" : "tenants"}
                                </Badge>
                              )}
                            </div>
                            {holder.primaryContact && (
                              <div className="text-xs text-slate-500 truncate">{holder.primaryContact}</div>
                            )}
                          </div>
                        </div>
                      </TD>

                      <TD>
                        <div className="flex flex-wrap gap-1">
                          {holder.markets.slice(0, 3).map((m) => (
                            <Badge key={m} tone="outline">{m}</Badge>
                          ))}
                          {holder.markets.length > 3 && (
                            <Badge tone="neutral">+{holder.markets.length - 3}</Badge>
                          )}
                        </div>
                      </TD>

                      <TD numeric className="font-semibold">{holder.totalUnits}</TD>
                      <TD numeric>{fmt(holder.avgRent)}/mo</TD>
                      <TD numeric className="font-medium">{fmt(holder.annualRevenue)}</TD>

                      <TD>
                        {holder.email ? (
                          <a
                            href={`mailto:${holder.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 hover:underline max-w-[180px]"
                          >
                            <Mail size={12} className="shrink-0" aria-hidden />
                            <span className="truncate">{holder.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">No email</span>
                        )}
                      </TD>

                      <TD>
                        {holder.phone ? (
                          <a
                            href={`tel:${holder.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 hover:underline tabular whitespace-nowrap"
                          >
                            <Phone size={12} aria-hidden />
                            {holder.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400">No phone</span>
                        )}
                      </TD>
                    </TR>

                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-0 bg-slate-50 border-b border-slate-200">
                          {/* Tenant demand */}
                          {hasDemand && (
                            <div className="px-4 py-3 border-b border-slate-200">
                              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <TrendingUp size={12} aria-hidden />
                                Active Tenant Demand
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {holder.demand!.tenants.map((t) => (
                                  <div key={t.email} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 text-xs font-semibold" aria-hidden>
                                      {t.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium text-slate-900">{t.name}</div>
                                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                                        {t.city}
                                        <Badge tone={statusTone(t.status)} dot>{t.status.replace(/_/g, " ")}</Badge>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-2 text-xs text-slate-500">
                                {holder.demand!.selectedListingIds.length} listing{holder.demand!.selectedListingIds.length !== 1 ? "s" : ""} selected across{" "}
                                {holder.demand!.activeCities.join(", ")}
                              </div>
                            </div>
                          )}

                          {/* Listings */}
                          {holderListings.length > 0 ? (
                            <div className="bg-white">
                              <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-slate-200">
                                {holderListings.length} Listings
                              </div>
                              <div className="max-h-[400px] overflow-y-auto">
                                <Table>
                                  <THead>
                                    <tr>
                                      <TH>Address</TH>
                                      <TH>City</TH>
                                      <TH numeric>Price</TH>
                                      <TH>Beds / Baths</TH>
                                      <TH>Agent</TH>
                                      <TH>Phone</TH>
                                      <TH>Email</TH>
                                    </tr>
                                  </THead>
                                  <TBody>
                                    {holderListings.map((l, i) => (
                                      <TR key={i} className="hover:bg-slate-50">
                                        <TD className="max-w-[260px]">
                                          {l.zillowUrl ? (
                                            <a
                                              href={l.zillowUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 hover:underline max-w-full"
                                            >
                                              <span className="truncate">{l.address}</span>
                                              <ExternalLink size={12} className="shrink-0" aria-hidden />
                                            </a>
                                          ) : (
                                            <span className="truncate block">{l.address}</span>
                                          )}
                                        </TD>
                                        <TD muted className="whitespace-nowrap">{l.city}, {l.state}</TD>
                                        <TD numeric>{l.price ? fmt(l.price) : "-"}</TD>
                                        <TD muted className="tabular whitespace-nowrap">{l.bedrooms ?? "-"}bd / {l.bathrooms ?? "-"}ba</TD>
                                        <TD muted>{l.agentName || "-"}</TD>
                                        <TD muted className="whitespace-nowrap">
                                          {l.agentPhone ? (
                                            <a href={`tel:${l.agentPhone}`} className="text-slate-700 hover:underline tabular">{l.agentPhone}</a>
                                          ) : (
                                            "-"
                                          )}
                                        </TD>
                                        <TD muted className="max-w-[200px]">
                                          {l.ownerEmail ? (
                                            <a href={`mailto:${l.ownerEmail}`} className="text-slate-700 hover:underline truncate block">{l.ownerEmail}</a>
                                          ) : (
                                            "-"
                                          )}
                                        </TD>
                                      </TR>
                                    ))}
                                  </TBody>
                                </Table>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white px-4 py-3 text-xs text-slate-500">
                              Listings not loaded for this broker. Try filtering by their market.
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </TBody>
          </Table>
        </Card>
      )}

      {/* Loading */}
      {loading && !data && <Spinner label="Loading portfolio holders" />}
    </div>
  );
}
