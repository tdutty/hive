"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { Button, Card, CardHeader, CardBody, Badge, statusTone, StatTile, PageHeader, Table, THead, TH, TBody, TR, TD, Input, Select } from "@/components/kit";
import { RefreshCw, MapPin, Calendar, Users, ChevronDown, ChevronUp, DollarSign, Bed, Home, UserCheck, X } from "lucide-react";

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

export default function SurveyRespondentsPage() {
  const [data, setData] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (cityFilter) params.city = cityFilter;
      if (statusFilter) params.status = statusFilter;
      const result = await api.get<SurveyData>(
 "/api/admin/survey-respondents",
        params
      );
      setData(result);
    } catch (err: any) {
      setError(err?.message || "Failed to load survey data");
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

  const topMoveInCount = data?.topMoveIns[0]?.count || 1;

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Survey Respondents"
        description="Everyone who completed the onboarding survey: where they're going and when"
        actions={
          <Button icon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />} onClick={fetchData} disabled={loading}>
            Refresh
          </Button>
        }
      />

      {error && <ErrorBanner className="mb-5" message={error} onRetry={fetchData} />}

      {loading && !data && <Spinner label="Loading survey respondents" />}

      {data && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="Total Respondents" value={data.total} icon={<Users size={14} />} />
            <StatTile label="Cities" value={data.topCities.length} icon={<MapPin size={14} />} />
            <StatTile label="Top Move-in" value={data.topMoveIns[0]?.month || "-"} hint={`${data.topMoveIns[0]?.count || 0} respondents`} icon={<Calendar size={14} />} />
            <StatTile label="Leased" value={data.statusBreakdown["leased"] || 0} icon={<Home size={14} />} />
          </div>

          {/* Top Cities + Move-in Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Top Destinations" description="Click a city to filter the list" />
              <div className="divide-y divide-slate-100">
                {data.topCities.slice(0, 10).map((c) => (
                  <div key={c.city} className="flex items-center justify-between gap-4 px-4 py-2">
                    <button
                      onClick={() => setCityFilter(c.city.split(",")[0].trim())}
                      className="text-sm text-slate-700 hover:text-amber-700 text-left truncate focus-visible:outline-none focus-visible:underline"
                    >
                      {c.city}
                    </button>
                    <span className="text-sm font-medium text-slate-900 tabular shrink-0">{c.count}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardHeader title="Move-in Timeline" />
              <div className="divide-y divide-slate-100">
                {data.topMoveIns.slice(0, 8).map((m) => (
                  <div key={m.month} className="flex items-center gap-3 px-4 py-2">
                    <span className="text-sm text-slate-700 w-24 shrink-0 truncate">{m.month}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden" aria-hidden>
                      <div className="h-full bg-amber-600 rounded-full" style={{ width: `${Math.min(100, (m.count / topMoveInCount) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-medium text-slate-900 tabular w-8 text-right shrink-0">{m.count}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Input
              type="search"
              aria-label="Search respondents"
              placeholder="Search by name, email, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sm:w-auto"
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
            </Select>
            {cityFilter && (
              <Button size="sm" variant="ghost" icon={<X size={12} />} onClick={() => setCityFilter("")} aria-label={`Clear city filter ${cityFilter}`}>
                {cityFilter}
              </Button>
            )}
          </div>

          {/* Table */}
          <Card>
            <Table>
              <THead>
                <tr>
                  <TH>Name</TH>
                  <TH>Destination</TH>
                  <TH>Move-in</TH>
                  <TH>Phone</TH>
                  <TH>Roommates</TH>
                  <TH>Status</TH>
                  <TH>Signed Up</TH>
                </tr>
              </THead>
              <TBody>
                {(filtered || []).map((r) => {
                  const isExpanded = expandedId === r.id;
                  return (
                    <React.Fragment key={r.id}>
                      <TR clickable selected={isExpanded} onClick={() => setExpandedId(isExpanded ? null : r.id)} aria-expanded={isExpanded}>
                        <TD>
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronUp size={14} className="text-slate-400 shrink-0" aria-hidden /> : <ChevronDown size={14} className="text-slate-400 shrink-0" aria-hidden />}
                            <div className="min-w-0">
                              <div className="font-medium">{r.name}</div>
                              <div className="text-xs text-slate-500">{r.email}</div>
                            </div>
                          </div>
                        </TD>
                        <TD className="font-medium whitespace-nowrap">{r.city}, {r.state}</TD>
                        <TD muted className="whitespace-nowrap">{r.moveInDate || "Flexible"}</TD>
                        <TD muted className="tabular whitespace-nowrap">{r.phone ? r.phone : "-"}</TD>
                        <TD muted>{r.roommates || "No"}</TD>
                        <TD><Badge tone={statusTone(r.status)} dot>{r.status.replace(/_/g, " ")}</Badge></TD>
                        <TD muted className="tabular whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString()}</TD>
                      </TR>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-4 py-3 bg-slate-50">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <Card>
                                <CardBody className="p-3">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><DollarSign size={12} aria-hidden />Budget</div>
                                  <div className="text-sm font-medium text-slate-900 tabular">{r.budget}</div>
                                  <div className="text-xs text-slate-500 tabular">Max: ${r.budgetMax?.toLocaleString()}/mo</div>
                                </CardBody>
                              </Card>
                              <Card>
                                <CardBody className="p-3">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Bed size={12} aria-hidden />Bedrooms</div>
                                  <div className="text-sm font-medium text-slate-900">{r.bedrooms === 0 ? "Studio" : r.bedrooms + " BR"}</div>
                                </CardBody>
                              </Card>
                              <Card>
                                <CardBody className="p-3">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Home size={12} aria-hidden />Matches</div>
                                  <div className="text-sm font-medium text-slate-900 tabular">{r.matchCount} listings</div>
                                  <div className="text-xs text-slate-500">{r.confirmed ? "Selections confirmed" : "Not confirmed yet"}</div>
                                </CardBody>
                              </Card>
                              <Card>
                                <CardBody className="p-3">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><UserCheck size={12} aria-hidden />Preferences</div>
                                  <div className="text-sm text-slate-900">
                                    {r.wantsPhysicianMatch ? "Wants roommate match" : "Solo"}
                                    {r.genderPreference && <span className="text-xs text-slate-500 ml-1">({r.genderPreference})</span>}
                                  </div>
                                  <div className="text-xs text-slate-500">{r.inNegotiation ? "In negotiation" : "Not in negotiation"}</div>
                                </CardBody>
                              </Card>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </TBody>
            </Table>
            {(filtered || []).length === 0 && (
              <EmptyState title="No respondents found" />
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
