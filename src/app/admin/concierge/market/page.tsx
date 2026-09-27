"use client";

import { useState, useEffect, useCallback } from "react";
import { sweetleaseApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Button, Card, Badge, statusTone, StatTile, PageHeader, Table, THead, TH, TBody, TR, TD } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, RefreshCw, Zap, BarChart3, Mail, Phone } from "lucide-react";

// --- Types ---

interface Resident {
  id: string;
  name: string;
  budget: number | null;
  bedrooms: number | null;
  moveInDate: string | null;
  email: string | null;
  phone: string | null;
}

interface PM {
  id: string;
  companyName: string;
  doors: number | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  responded: boolean;
  placements: number;
}

interface Coordinator {
  id: string;
  programName: string;
  clicked: boolean;
  engagementRate: number | null;
}

interface CityMarket {
  city: string;
  demand: {
    activeResidents: number;
    residents: Resident[];
    earliestMoveIn: string | null;
    coordinatorsClicked: number;
    coordinatorEngagementRate: number | null;
    coordinators: Coordinator[];
  };
  supply: {
    totalPMs: number;
    respondedPMs: number;
    placements: number;
    pms: PM[];
  };
  match: {
    status: "green" | "amber" | "red";
    draftsPending: number;
    daysUntilMoveIn: number | null;
  };
}

interface MarketReport {
  summary: {
    activeResidents: number;
    responsivePMs: number;
    citiesWithDemand: number;
    pendingDrafts: number;
  };
  cities: CityMarket[];
}

// --- Helpers ---

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const now = new Date();
  const target = new Date(dateStr);
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "-";
  return `$${amount.toLocaleString()}`;
}

type MatchStatus = "green" | "amber" | "red";

/** The API speaks in traffic-light colors; translate to the app's status vocabulary so Badge/statusTone own the color. */
const MATCH_STATUS: Record<MatchStatus, string> = { green: "healthy", amber: "warning", red: "critical" };
const MATCH_LABEL: Record<MatchStatus, string> = {
  green: "Supply meets demand",
  amber: "Demand exists, no PM responses",
  red: "Urgent, no PM response",
};

// --- Page Component ---

export default function MarketIntelligencePage() {
  const [report, setReport] = useState<MarketReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matching, setMatching] = useState(false);
  const [generatingCity, setGeneratingCity] = useState<string | null>(null);
  const [expandedCity, setExpandedCity] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sweetleaseApi.get<MarketReport>(
 "/api/admin/concierge/demand-supply"
      );
      setReport(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load market report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleRunMatching = async () => {
    setMatching(true);
    try {
      await sweetleaseApi.post("/api/admin/concierge/demand-supply");
      await fetchReport();
    } catch (err: any) {
      toast.error("Matching failed", { description: err?.message });
    } finally {
      setMatching(false);
    }
  };

  const handleGenerateDrafts = async (city: string) => {
    setGeneratingCity(city);
    try {
      await sweetleaseApi.post("/api/admin/concierge/demand-supply", { city });
      await fetchReport();
    } catch (err: any) {
      toast.error("Draft generation failed", { description: err?.message });
    } finally {
      setGeneratingCity(null);
    }
  };

  const toggleCity = (city: string) => {
    setExpandedCity(expandedCity === city ? null : city);
  };

  const summary = report?.summary || {
    activeResidents: 0,
    responsivePMs: 0,
    citiesWithDemand: 0,
    pendingDrafts: 0,
  };

  const cities = report?.cities || [];

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Market Intelligence"
        meta="Concierge · two-sided marketplace"
        description="Demand (residents) against supply (property managers), city by city."
        actions={
          <Button variant="primary" icon={<Zap size={14} />} loading={matching} onClick={handleRunMatching}>
            Run matching
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile label="Active residents" value={summary.activeResidents.toLocaleString()} />
        <StatTile label="Responsive PMs" value={summary.responsivePMs.toLocaleString()} />
        <StatTile label="Cities with demand" value={summary.citiesWithDemand.toLocaleString()} />
        <StatTile label="Pending matches" value={summary.pendingDrafts.toLocaleString()} hint="drafts awaiting review" />
      </div>

      {loading ? (
        <Card><Spinner label="Loading market data" /></Card>
      ) : error ? (
        <ErrorBanner message={error} onRetry={fetchReport} />
      ) : cities.length === 0 ? (
        <Card>
          <EmptyState icon={<BarChart3 size={28} className="mx-auto" aria-hidden />} title="No market data available" hint="Run matching to generate the market report." />
        </Card>
      ) : (
        <div className="space-y-3">
          {cities.map((cityData) => {
            const isExpanded = expandedCity === cityData.city;
            const isUrgent = cityData.match.daysUntilMoveIn !== null && cityData.match.daysUntilMoveIn < 30;
            const status = cityData.match.status;

            return (
              <Card key={cityData.city} className="overflow-hidden">
                {/* City row */}
                <button
                  onClick={() => toggleCity(cityData.city)}
                  aria-expanded={isExpanded}
                  className="w-full px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 text-left hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-slate-400 shrink-0" aria-hidden>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{cityData.city}</span>
                        <Badge tone={statusTone(MATCH_STATUS[status])} dot>{MATCH_LABEL[status]}</Badge>
                        {cityData.match.draftsPending > 0 && <Badge tone="outline">{cityData.match.draftsPending} drafts</Badge>}
                      </div>
                      {isUrgent && (
                        <p className="text-xs text-red-700 font-medium mt-0.5">Urgent: move-in in {cityData.match.daysUntilMoveIn} days</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 sm:gap-8 pl-7 sm:pl-0 shrink-0">
                    <div className="sm:text-right">
                      <p className="text-sm font-medium text-slate-800 tabular">{cityData.demand.activeResidents} residents</p>
                      <p className="text-xs text-slate-500 tabular">{cityData.demand.coordinatorsClicked} coordinators clicked</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm font-medium text-slate-800 tabular">{cityData.supply.respondedPMs}/{cityData.supply.totalPMs} PMs</p>
                      <p className="text-xs text-slate-500 tabular">{cityData.supply.placements} placements</p>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 grid grid-cols-1 md:grid-cols-[1fr_260px_1fr] divide-y md:divide-y-0 md:divide-x divide-slate-200">
                    {/* DEMAND */}
                    <div>
                      <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Demand: residents</span>
                        <span className="text-xs text-slate-500 tabular">{cityData.demand.residents.length}</span>
                      </div>
                      {cityData.demand.residents.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-slate-500">No active residents</p>
                      ) : (
                        <Table>
                          <THead>
                            <TR className="h-9">
                              <TH>Resident</TH>
                              <TH numeric>Budget</TH>
                              <TH numeric>Beds</TH>
                              <TH>Move-in</TH>
                            </TR>
                          </THead>
                          <TBody>
                            {cityData.demand.residents.map((r) => {
                              const days = daysUntil(r.moveInDate);
                              const urgent = days !== null && days < 30;
                              return (
                                <TR key={r.id}>
                                  <TD className="font-medium text-slate-900">{r.name}</TD>
                                  <TD numeric muted>{r.budget ? `${formatCurrency(r.budget)}/mo` : "-"}</TD>
                                  <TD numeric muted>{r.bedrooms ?? "-"}</TD>
                                  <TD>
                                    <div className="flex items-center gap-2">
                                      <span className={urgent ? "text-red-700 font-medium tabular" : "text-slate-500 tabular"}>
                                        {r.moveInDate ? formatDate(r.moveInDate) : "-"}
                                        {days !== null && ` (${days}d)`}
                                      </span>
                                      {urgent && <Badge tone={statusTone("critical")} dot>Urgent</Badge>}
                                    </div>
                                  </TD>
                                </TR>
                              );
                            })}
                          </TBody>
                        </Table>
                      )}

                      {cityData.demand.coordinators.length > 0 && (
                        <>
                          <div className="px-4 py-2.5 border-y border-slate-200 bg-slate-50 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Coordinators</span>
                            <span className="text-xs text-slate-500 tabular">{cityData.demand.coordinators.length}</span>
                          </div>
                          <Table>
                            <TBody>
                              {cityData.demand.coordinators.map((c) => (
                                <TR key={c.id} className="h-9">
                                  <TD>{c.programName}</TD>
                                  <TD className="w-28">
                                    {c.clicked && <Badge tone={statusTone("clicked")} dot>Clicked</Badge>}
                                  </TD>
                                  <TD numeric muted className="w-20">
                                    {c.engagementRate !== null ? `${(c.engagementRate * 100).toFixed(0)}%` : "-"}
                                  </TD>
                                </TR>
                              ))}
                            </TBody>
                          </Table>
                        </>
                      )}
                    </div>

                    {/* MATCH */}
                    <div className="p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Badge tone={statusTone(MATCH_STATUS[status])} dot>{MATCH_LABEL[status]}</Badge>
                      </div>
                      <dl className="text-xs text-slate-500 space-y-1">
                        {cityData.match.draftsPending > 0 && (
                          <div className="flex justify-between gap-2"><dt>Drafts pending</dt><dd className="tabular text-slate-800">{cityData.match.draftsPending}</dd></div>
                        )}
                        {cityData.match.daysUntilMoveIn !== null && (
                          <div className="flex justify-between gap-2"><dt>Earliest move-in</dt><dd className="tabular text-slate-800">{cityData.match.daysUntilMoveIn} days</dd></div>
                        )}
                        {cityData.demand.coordinatorEngagementRate !== null && (
                          <div className="flex justify-between gap-2"><dt>Coordinator engagement</dt><dd className="tabular text-slate-800">{(cityData.demand.coordinatorEngagementRate * 100).toFixed(0)}%</dd></div>
                        )}
                      </dl>

                      <div className="grid grid-cols-2 gap-2">
                        <StatTile label="Demand" value={cityData.demand.activeResidents} className="px-3 py-2" />
                        <StatTile label="Supply" value={cityData.supply.respondedPMs} className="px-3 py-2" />
                      </div>

                      <Button
                        size="sm"
                        icon={<RefreshCw size={12} />}
                        loading={generatingCity === cityData.city}
                        onClick={(e) => { e.stopPropagation(); handleGenerateDrafts(cityData.city); }}
                      >
                        Generate drafts
                      </Button>
                    </div>

                    {/* SUPPLY */}
                    <div>
                      <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Supply: property managers</span>
                        <span className="text-xs text-slate-500 tabular">{cityData.supply.pms.length}</span>
                      </div>
                      {cityData.supply.pms.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-slate-500">No PMs with contact info</p>
                      ) : (
                        <Table>
                          <THead>
                            <TR className="h-9">
                              <TH>Company</TH>
                              <TH numeric>Doors</TH>
                              <TH numeric>Placed</TH>
                              <TH>Status</TH>
                            </TR>
                          </THead>
                          <TBody>
                            {cityData.supply.pms.map((pm) => (
                              <TR key={pm.id} className="h-auto">
                                <TD>
                                  <p className="font-medium text-slate-900">{pm.companyName}</p>
                                  {pm.contactName && <p className="text-xs text-slate-500">{pm.contactName}</p>}
                                  {(pm.email || pm.phone) && (
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-slate-500">
                                      {pm.email && <span className="inline-flex items-center gap-1 min-w-0"><Mail size={11} aria-hidden /><span className="truncate">{pm.email}</span></span>}
                                      {pm.phone && <span className="inline-flex items-center gap-1"><Phone size={11} aria-hidden />{pm.phone}</span>}
                                    </div>
                                  )}
                                </TD>
                                <TD numeric muted>{pm.doors !== null ? pm.doors : "-"}</TD>
                                <TD numeric muted>{pm.placements > 0 ? pm.placements : "-"}</TD>
                                <TD>{pm.responded && <Badge tone={statusTone("Responded")} dot>Responded</Badge>}</TD>
                              </TR>
                            ))}
                          </TBody>
                        </Table>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
