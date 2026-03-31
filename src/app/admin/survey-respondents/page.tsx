"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { RefreshCw, MapPin, Calendar, Users, Search, ChevronDown, ChevronUp, DollarSign, Bed, Home, UserCheck } from "lucide-react";

interface Respondent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string;
  state: string;
  budget: string;
  budgetMax: number;
  bedrooms: number;
  moveInDate: string;
  roommates: string;
  status: string;
  matchCount: number;
  confirmed: boolean;
  inNegotiation: boolean;
  wantsPhysicianMatch: boolean;
  genderPreference: string | null;
  createdAt: string;
}

interface CityCount {
  city: string;
  count: number;
}

interface MoveInCount {
  month: string;
  count: number;
}

interface SurveyData {
  total: number;
  topCities: CityCount[];
  topMoveIns: MoveInCount[];
  statusBreakdown: Record<string, number>;
  respondents: Respondent[];
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-500/20 text-gray-400",
  searching: "bg-blue-500/20 text-blue-400",
  matched: "bg-purple-500/20 text-purple-400",
  selections_confirmed: "bg-indigo-500/20 text-indigo-400",
  outreach: "bg-cyan-500/20 text-cyan-400",
  landlord_responded: "bg-teal-500/20 text-teal-400",
  negotiating: "bg-amber-500/20 text-amber-400",
  lease_pending: "bg-orange-500/20 text-orange-400",
  leased: "bg-green-500/20 text-green-400",
};

export default function SurveyRespondentsPage() {
  const [data, setData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (cityFilter) params.city = cityFilter;
      if (statusFilter) params.status = statusFilter;
      const result = await api.get<SurveyData>(
        "/api/admin/survey-respondents",
        params
      );
      setData(result);
    } catch (err) {
      console.error("Failed to load survey data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cityFilter, statusFilter]);

  const filtered = data?.respondents.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.state.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Survey Respondents
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Everyone who completed the onboarding survey — where they&apos;re
            going and when
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.total}
                  </div>
                  <div className="text-xs text-gray-500">Total Respondents</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <MapPin size={20} className="text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.topCities.length}
                  </div>
                  <div className="text-xs text-gray-500">Cities</div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Calendar size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.topMoveIns[0]?.month || "—"}
                  </div>
                  <div className="text-xs text-gray-500">
                    Top Move-in ({data.topMoveIns[0]?.count || 0})
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Users size={20} className="text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {data.statusBreakdown["leased"] || 0}
                  </div>
                  <div className="text-xs text-gray-500">Leased</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Cities + Move-in Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-3">
                Top Destinations
              </h3>
              <div className="space-y-2">
                {data.topCities.slice(0, 10).map((c) => (
                  <div
                    key={c.city}
                    className="flex items-center justify-between"
                  >
                    <button
                      onClick={() => setCityFilter(c.city.split(",")[0].trim())}
                      className="text-sm text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      {c.city}
                    </button>
                    <span className="text-sm font-medium text-gray-900">
                      {c.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-3">
                Move-in Timeline
              </h3>
              <div className="space-y-2">
                {data.topMoveIns.slice(0, 8).map((m) => (
                  <div
                    key={m.month}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-700">{m.month}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{
                          width: `${Math.min(200, (m.count / (data.topMoveIns[0]?.count || 1)) * 200)}px`,
                        }}
                      />
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {m.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search by name, email, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="searching">Searching</option>
              <option value="matched">Matched</option>
              <option value="selections_confirmed">Confirmed</option>
              <option value="outreach">Outreach</option>
              <option value="negotiating">Negotiating</option>
              <option value="lease_pending">Lease Pending</option>
              <option value="leased">Leased</option>
            </select>
            {cityFilter && (
              <button
                onClick={() => setCityFilter("")}
                className="px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-200"
              >
                {cityFilter} &times;
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3">Name</th>
                  <th className="text-left px-5 py-3">Destination</th>
                  <th className="text-left px-5 py-3">Move-in</th>
                  <th className="text-left px-5 py-3">Phone</th>
                  <th className="text-left px-5 py-3">Roommates</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Signed Up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(filtered || []).map((r) => {
                  const isExpanded = expandedId === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      <tr
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                            <div>
                              <div className="font-medium text-sm text-gray-900">{r.name}</div>
                              <div className="text-xs text-gray-400">{r.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="text-sm text-gray-900 font-medium">
                            {r.city}, {r.state}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">
                          {r.moveInDate || "Flexible"}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">
                          {r.phone ? r.phone : "-"}
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-700">
                          {r.roommates || "No"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[r.status] || "bg-gray-100 text-gray-600"}`}
                          >
                            {r.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-5 py-4 bg-gray-50/50">
                            <div className="grid grid-cols-4 gap-4">
                              <div className="bg-white border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                  <DollarSign size={12} />
                                  Budget
                                </div>
                                <div className="font-semibold text-gray-900">{r.budget}</div>
                                <div className="text-xs text-gray-500">Max: ${r.budgetMax?.toLocaleString()}/mo</div>
                              </div>
                              <div className="bg-white border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                  <Bed size={12} />
                                  Bedrooms
                                </div>
                                <div className="font-semibold text-gray-900">{r.bedrooms === 0 ? "Studio" : r.bedrooms + " BR"}</div>
                              </div>
                              <div className="bg-white border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                  <Home size={12} />
                                  Matches
                                </div>
                                <div className="font-semibold text-gray-900">{r.matchCount} listings</div>
                                <div className="text-xs text-gray-500">{r.confirmed ? "Selections confirmed" : "Not confirmed yet"}</div>
                              </div>
                              <div className="bg-white border border-gray-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                  <UserCheck size={12} />
                                  Preferences
                                </div>
                                <div className="text-sm text-gray-900">
                                  {r.wantsPhysicianMatch ? "Wants roommate match" : "Solo"}
                                  {r.genderPreference && <span className="text-xs text-gray-500 ml-1">({r.genderPreference})</span>}
                                </div>
                                <div className="text-xs text-gray-500">{r.inNegotiation ? "In negotiation" : "Not in negotiation"}</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            {(filtered || []).length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">
                No respondents found
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
