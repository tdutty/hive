"use client";

import { useState, useEffect, useCallback } from "react";
import { sweetleaseApi } from "@/lib/api";
import {
  Users,
  Building2,
  MapPin,
  FileText,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  DoorOpen,
  Phone,
  Mail,
  Zap,
  BarChart3,
} from "lucide-react";

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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return "-";
  return `$${amount.toLocaleString()}`;
}

function statusIcon(status: "green" | "amber" | "red") {
  switch (status) {
    case "green":
      return <CheckCircle2 size={24} className="text-green-500" />;
    case "amber":
      return <AlertTriangle size={24} className="text-amber-500" />;
    case "red":
      return <AlertTriangle size={24} className="text-red-500" />;
  }
}

function statusBg(status: "green" | "amber" | "red") {
  switch (status) {
    case "green":
      return "bg-green-50 border-green-200";
    case "amber":
      return "bg-amber-50 border-amber-200";
    case "red":
      return "bg-red-50 border-red-200";
  }
}

// --- Page Component ---

export default function MarketIntelligencePage() {
  const [report, setReport] = useState<MarketReport | null>(null);
  const [loading, setLoading] = useState(true);
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
    } catch (err) {
      console.error("Failed to fetch market report:", err);
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
    } catch (err) {
      console.error("Matching failed:", err);
    } finally {
      setMatching(false);
    }
  };

  const handleGenerateDrafts = async (city: string) => {
    setGeneratingCity(city);
    try {
      await sweetleaseApi.post("/api/admin/concierge/demand-supply", { city });
      await fetchReport();
    } catch (err) {
      console.error("Draft generation failed:", err);
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

  const statCards = [
    {
      label: "Active Residents",
      value: summary.activeResidents,
      icon: <Users size={20} className="text-blue-600" />,
    },
    {
      label: "Responsive PMs",
      value: summary.responsivePMs,
      icon: <Building2 size={20} className="text-green-600" />,
    },
    {
      label: "Cities with Demand",
      value: summary.citiesWithDemand,
      icon: <MapPin size={20} className="text-amber-600" />,
    },
    {
      label: "Pending Matches",
      value: summary.pendingDrafts,
      icon: <FileText size={20} className="text-purple-600" />,
    },
  ];

  const cities = report?.cities || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Market Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">
            Two-sided marketplace view - demand (residents) vs supply (PMs) by city
          </p>
        </div>
        <button
          onClick={handleRunMatching}
          disabled={matching}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          {matching ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Zap size={16} />
          )}
          Run Matching
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {card.value.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Market Grid */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-slate-400" />
          <span className="ml-2 text-sm text-slate-500">Loading market data...</span>
        </div>
      ) : cities.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-20 text-slate-400">
          <BarChart3 size={40} className="mb-3" />
          <p className="text-sm">No market data available</p>
          <p className="text-xs mt-1">Run matching to generate the market report</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cities.map((cityData) => {
            const isExpanded = expandedCity === cityData.city;
            const isUrgent =
              cityData.match.daysUntilMoveIn !== null &&
              cityData.match.daysUntilMoveIn < 30;

            return (
              <div
                key={cityData.city}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                {/* City Header */}
                <button
                  onClick={() => toggleCity(cityData.city)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">
                      {isExpanded ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                    </span>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {cityData.city}
                      </h3>
                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium mt-0.5">
                          <Clock size={12} />
                          Urgent - move-in in {cityData.match.daysUntilMoveIn} days
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    {/* Demand Summary */}
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium text-slate-700">
                          {cityData.demand.activeResidents} residents
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cityData.demand.coordinatorsClicked} coordinators clicked
                      </p>
                    </div>

                    {/* Match Status */}
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusBg(
                        cityData.match.status
                      )}`}
                    >
                      {statusIcon(cityData.match.status)}
                      {cityData.match.draftsPending > 0 && (
                        <span className="text-xs font-medium text-slate-600">
                          {cityData.match.draftsPending} drafts
                        </span>
                      )}
                    </div>

                    {/* Supply Summary */}
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium text-slate-700">
                          {cityData.supply.respondedPMs}/{cityData.supply.totalPMs} PMs
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cityData.supply.placements} placements
                      </p>
                    </div>
                  </div>
                </button>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-6 py-5">
                    <div className="grid grid-cols-3 gap-6">
                      {/* DEMAND Column */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-600 mb-3 flex items-center gap-2">
                          <Users size={14} />
                          Demand - Residents
                        </h4>
                        {cityData.demand.residents.length === 0 ? (
                          <p className="text-xs text-slate-400">No active residents</p>
                        ) : (
                          <div className="space-y-2">
                            {cityData.demand.residents.map((r) => {
                              const days = daysUntil(r.moveInDate);
                              const urgent = days !== null && days < 30;
                              return (
                                <div
                                  key={r.id}
                                  className={`p-3 rounded-lg border text-sm ${
                                    urgent
                                      ? "border-red-200 bg-red-50"
                                      : "border-slate-100 bg-slate-50"
                                  }`}
                                >
                                  <p className="font-medium text-slate-900">{r.name}</p>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                    {r.budget && (
                                      <span>{formatCurrency(r.budget)}/mo</span>
                                    )}
                                    {r.bedrooms && (
                                      <span className="flex items-center gap-1">
                                        <DoorOpen size={12} />
                                        {r.bedrooms} bed
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 mt-1 text-xs">
                                    <Calendar size={12} className={urgent ? "text-red-500" : "text-slate-400"} />
                                    <span className={urgent ? "text-red-600 font-medium" : "text-slate-500"}>
                                      {formatDate(r.moveInDate)}
                                      {days !== null && ` (${days}d)`}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Coordinators */}
                        {cityData.demand.coordinators.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-xs font-semibold text-slate-500 mb-2">
                              Coordinators
                            </h5>
                            <div className="space-y-1">
                              {cityData.demand.coordinators.map((c) => (
                                <div
                                  key={c.id}
                                  className="flex items-center justify-between text-xs p-2 rounded bg-slate-50"
                                >
                                  <span className="text-slate-700">{c.programName}</span>
                                  <div className="flex items-center gap-2">
                                    {c.clicked && (
                                      <span className="text-green-600 font-medium">
                                        Clicked
                                      </span>
                                    )}
                                    {c.engagementRate !== null && (
                                      <span className="text-slate-400">
                                        {(c.engagementRate * 100).toFixed(0)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* MATCH Column (center) */}
                      <div className="flex flex-col items-center justify-start pt-6">
                        <div
                          className={`w-full p-4 rounded-xl border text-center ${statusBg(
                            cityData.match.status
                          )}`}
                        >
                          <div className="flex justify-center mb-2">
                            {statusIcon(cityData.match.status)}
                          </div>
                          <p className="text-sm font-medium text-slate-700">
                            {cityData.match.status === "green" &&
                              "Supply meets demand"}
                            {cityData.match.status === "amber" &&
                              "Demand exists, no PM responses"}
                            {cityData.match.status === "red" &&
                              "Urgent - no PM response"}
                          </p>
                          {cityData.match.draftsPending > 0 && (
                            <p className="text-xs text-slate-500 mt-1">
                              {cityData.match.draftsPending} drafts pending
                            </p>
                          )}
                          {cityData.match.daysUntilMoveIn !== null && (
                            <p className="text-xs text-slate-500 mt-1">
                              Earliest move-in: {cityData.match.daysUntilMoveIn} days
                            </p>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateDrafts(cityData.city);
                          }}
                          disabled={generatingCity === cityData.city}
                          className="mt-4 flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 text-sm font-medium"
                        >
                          {generatingCity === cityData.city ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <RefreshCw size={14} />
                          )}
                          Generate Drafts
                        </button>

                        {/* Quick Stats */}
                        <div className="mt-4 w-full grid grid-cols-2 gap-2">
                          <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <p className="text-lg font-bold text-blue-700">
                              {cityData.demand.activeResidents}
                            </p>
                            <p className="text-[10px] text-blue-500 uppercase font-medium">
                              Demand
                            </p>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded-lg">
                            <p className="text-lg font-bold text-green-700">
                              {cityData.supply.respondedPMs}
                            </p>
                            <p className="text-[10px] text-green-500 uppercase font-medium">
                              Supply
                            </p>
                          </div>
                        </div>

                        {cityData.demand.coordinatorEngagementRate !== null && (
                          <div className="mt-2 w-full text-center p-2 bg-slate-50 rounded-lg">
                            <p className="text-lg font-bold text-slate-700">
                              {(cityData.demand.coordinatorEngagementRate * 100).toFixed(0)}%
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase font-medium">
                              Coordinator Engagement
                            </p>
                          </div>
                        )}
                      </div>

                      {/* SUPPLY Column */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-green-600 mb-3 flex items-center gap-2">
                          <Building2 size={14} />
                          Supply - Property Managers
                        </h4>
                        {cityData.supply.pms.length === 0 ? (
                          <p className="text-xs text-slate-400">
                            No PMs with contact info
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {cityData.supply.pms.map((pm) => (
                              <div
                                key={pm.id}
                                className={`p-3 rounded-lg border text-sm ${
                                  pm.responded
                                    ? "border-green-200 bg-green-50"
                                    : "border-slate-100 bg-slate-50"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-slate-900">
                                    {pm.companyName}
                                  </p>
                                  {pm.responded && (
                                    <span className="text-[10px] font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                                      Responded
                                    </span>
                                  )}
                                </div>
                                {pm.contactName && (
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {pm.contactName}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                  {pm.doors !== null && (
                                    <span>{pm.doors} doors</span>
                                  )}
                                  {pm.placements > 0 && (
                                    <span className="text-green-600">
                                      {pm.placements} placed
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                  {pm.email && (
                                    <span className="flex items-center gap-1 text-xs text-slate-400">
                                      <Mail size={10} />
                                      {pm.email}
                                    </span>
                                  )}
                                  {pm.phone && (
                                    <span className="flex items-center gap-1 text-xs text-slate-400">
                                      <Phone size={10} />
                                      {pm.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
