"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  RefreshCw,
  Search,
  Mail,
  MapPin,
  ChevronDown,
  ChevronRight,
  Eye,
  Send,
  MessageSquare,
  FileSignature,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface PipelineData {
  pipeline: Record<string, number>;
  total: number;
  recentRequests: Array<{
    id: string;
    name: string;
    email: string;
    city: string;
    state: string;
    status: string;
    matchCount: number;
    selectionsConfirmed: boolean;
    hasNegotiation: boolean;
    createdAt: string;
    selections: Array<{
      rank: number;
      listing: {
        id: string;
        title: string;
        price: number;
        bedrooms: number;
        bathrooms: number;
        address: string | null;
        image: string | null;
        ownerName: string | null;
        ownerEmail: string | null;
        ownerPhone: string | null;
        ownerType: string | null;
        zillowUrl: string | null;
      };
    }>;
  }>;
  activeNegotiations: Array<{
    groupId: string;
    status: string;
    memberCount: number;
    listingTitle: string | null;
    listingPrice: number | null;
    offerStatus: string | null;
    offerAmount: number | null;
    counterAmount: number | null;
  }>;
  revenue: {
    activeLeases: number;
    totalMonthlyRent: number;
    totalAnnualRent: number;
    totalDepositsHeld: number;
  };
  outreach: Record<string, number>;
  recentLeased: Array<{
    id: string;
    name: string;
    city: string;
    state: string;
    createdAt: string;
  }>;
}

const STAGES = [
  { key: "pending", label: "Pending", icon: Clock, borderColor: "border-l-slate-400", bgHover: "hover:bg-slate-50", badgeBg: "bg-slate-100 text-slate-600", actionColor: "bg-slate-600 hover:bg-slate-700" },
  { key: "searching", label: "Searching", icon: Search, borderColor: "border-l-blue-500", bgHover: "hover:bg-blue-50/50", badgeBg: "bg-blue-100 text-blue-700", actionColor: "bg-blue-600 hover:bg-blue-700" },
  { key: "matched", label: "Matched", icon: Eye, borderColor: "border-l-indigo-500", bgHover: "hover:bg-indigo-50/50", badgeBg: "bg-indigo-100 text-indigo-700", actionColor: "bg-indigo-600 hover:bg-indigo-700" },
  { key: "selections_confirmed", label: "Selected", icon: CheckCircle, borderColor: "border-l-purple-500", bgHover: "hover:bg-purple-50/50", badgeBg: "bg-purple-100 text-purple-700", actionColor: "bg-purple-600 hover:bg-purple-700" },
  { key: "outreach", label: "Outreach Sent", icon: Send, borderColor: "border-l-cyan-500", bgHover: "hover:bg-cyan-50/50", badgeBg: "bg-cyan-100 text-cyan-700", actionColor: "bg-cyan-600 hover:bg-cyan-700" },
  { key: "negotiating", label: "Negotiating", icon: MessageSquare, borderColor: "border-l-amber-500", bgHover: "hover:bg-amber-50/50", badgeBg: "bg-amber-100 text-amber-700", actionColor: "bg-amber-600 hover:bg-amber-700" },
  { key: "lease_pending", label: "Lease Pending", icon: FileSignature, borderColor: "border-l-orange-500", bgHover: "hover:bg-orange-50/50", badgeBg: "bg-orange-100 text-orange-700", actionColor: "bg-orange-600 hover:bg-orange-700" },
  { key: "leased", label: "Leased", icon: CheckCircle, borderColor: "border-l-green-500", bgHover: "hover:bg-green-50/50", badgeBg: "bg-green-100 text-green-700", actionColor: "bg-green-600 hover:bg-green-700" },
];

const ACTION_LABELS: Record<string, string> = {
  pending: "Review",
  searching: "Check Status",
  matched: "View Matches",
  selections_confirmed: "Send Outreach",
  outreach: "Follow Up",
  negotiating: "View Offer",
  lease_pending: "Send Reminder",
  leased: "View Lease",
};

export default function TenantPipelinePage() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [outreachLoading, setOutreachLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.get<PipelineData>("/api/admin/tenant-match/pipeline");
      setData(result);
    } catch (err) {
      console.error("Failed to load pipeline:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="animate-spin text-amber-600" />
      </div>
    );
  }

  if (!data) return null;

  const filteredRequests = data.recentRequests.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.city.toLowerCase().includes(q);
  });

  const getStageRequests = (stageKey: string) =>
    filteredRequests.filter((r) => r.status === stageKey);

  const totalActive = STAGES.slice(0, -1).reduce((sum, s) => sum + (data.pipeline[s.key] || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tenant Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data.total} total requests &middot; {totalActive} active
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard icon={<Users size={18} />} label="Total Tenants" value={data.total} color="blue" />
        <StatCard icon={<TrendingUp size={18} />} label="Active Pipeline" value={totalActive} color="purple" />
        <StatCard icon={<DollarSign size={18} />} label="Monthly Rent" value={`$${data.revenue.totalMonthlyRent.toLocaleString()}`} color="green" />
        <StatCard icon={<FileSignature size={18} />} label="Active Leases" value={data.revenue.activeLeases} color="amber" />
        <StatCard icon={<DollarSign size={18} />} label="Deposits Held" value={`$${data.revenue.totalDepositsHeld.toLocaleString()}`} color="slate" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
        />
      </div>

      {/* Pipeline Stages */}
      <div className="space-y-2">
        {STAGES.map((stage) => {
          const count = data.pipeline[stage.key] || 0;
          const isExpanded = expandedStage === stage.key;
          const requests = getStageRequests(stage.key);
          const Icon = stage.icon;
          const hasAttention = stage.key === "selections_confirmed" && count > 0;

          return (
            <div key={stage.key} className={`rounded-xl border border-slate-200 overflow-hidden ${stage.borderColor} border-l-4 bg-white`}>
              {/* Stage Header */}
              <div
                onClick={() => setExpandedStage(isExpanded ? null : stage.key)}
                className={`flex items-center justify-between px-5 py-4 cursor-pointer transition ${stage.bgHover} ${
                  isExpanded ? "bg-slate-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-400" />}
                  <Icon size={18} className="text-slate-600" />
                  <span className="text-slate-900 font-medium">{stage.label}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    count > 0 ? stage.badgeBg : "bg-slate-100 text-slate-400"
                  }`}>
                    {count}
                  </span>
                  {hasAttention && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full animate-pulse">
                      <AlertTriangle size={10} />
                      Needs outreach
                    </span>
                  )}
                </div>
                {count > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className={`px-3 py-1.5 text-xs font-medium text-white rounded-lg transition ${stage.actionColor}`}
                  >
                    {ACTION_LABELS[stage.key]}
                  </button>
                )}
              </div>

              {/* Expanded: Tenant List */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  {requests.length === 0 ? (
                    <div className="px-6 py-6 text-center text-slate-400 text-sm">
                      No tenants at this stage
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {requests.map((r) => (
                        <div key={r.id}>
                        <div
                          className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition cursor-pointer"
                          onClick={() => setExpandedTenant(expandedTenant === r.id ? null : r.id)}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold shrink-0">
                              {r.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-slate-900 text-sm font-medium truncate">{r.name}</div>
                              <div className="text-slate-500 text-xs truncate flex items-center gap-1.5">
                                <Mail size={10} /> {r.email}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 shrink-0">
                            <div className="text-slate-600 text-xs flex items-center gap-1">
                              <MapPin size={10} />
                              {r.city}, {r.state}
                            </div>
                            <div className="text-slate-500 text-xs">
                              {r.matchCount} matches
                            </div>
                            <div className="text-slate-400 text-xs">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </div>

                            {/* Action buttons per stage */}
                            <div className="flex items-center gap-2">
                              {stage.key === "matched" && (
                                <a
                                  href={`https://sweetlease.io/matches/${r.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 text-[11px] font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                                >
                                  View Matches
                                </a>
                              )}
                              {stage.key === "selections_confirmed" && (
                                <button
                                  disabled={outreachLoading === r.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOutreachLoading(r.id);
                                    api.post("/api/admin/tenant-match/trigger-outreach", { matchRequestId: r.id })
                                      .then((res: any) => {
                                        alert(res.message || `Outreach triggered for ${r.selections?.length || 0} listings`);
                                        fetchData();
                                      })
                                      .catch((err: any) => alert(err?.data?.error || "Outreach failed"))
                                      .finally(() => setOutreachLoading(null));
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-medium bg-purple-600 text-white rounded hover:bg-purple-700 transition disabled:opacity-50"
                                >
                                  {outreachLoading === r.id ? "Sending..." : "Trigger Outreach"}
                                </button>
                              )}
                              {stage.key === "outreach" && (
                                <button className="px-2.5 py-1 text-[11px] font-medium bg-cyan-600 text-white rounded hover:bg-cyan-700 transition">
                                  Send Follow-up
                                </button>
                              )}
                              {stage.key === "negotiating" && (
                                <a
                                  href="/admin/negotiations"
                                  className="px-2.5 py-1 text-[11px] font-medium bg-amber-600 text-white rounded hover:bg-amber-700 transition"
                                >
                                  View Offer
                                </a>
                              )}
                              {stage.key === "lease_pending" && (
                                <button className="px-2.5 py-1 text-[11px] font-medium bg-orange-600 text-white rounded hover:bg-orange-700 transition">
                                  Send Reminder
                                </button>
                              )}
                              {(stage.key === "pending" || stage.key === "searching") && (
                                <span className="text-slate-400 text-[11px]">Auto-processing</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Expanded selections */}
                        {expandedTenant === r.id && r.selections && r.selections.length > 0 && (
                          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                              Favorites ({r.selections.length})
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {r.selections.map((s) => (
                                <div key={s.listing.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-2.5">
                                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {s.rank}
                                  </div>
                                  {s.listing.image ? (
                                    <img src={s.listing.image} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
                                  ) : (
                                    <div className="w-12 h-12 rounded bg-slate-100 shrink-0" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-slate-900 truncate">{s.listing.title}</div>
                                    <div className="text-xs text-slate-500 truncate">{s.listing.address}</div>
                                    <div className="text-xs font-semibold text-slate-700">${s.listing.price.toLocaleString()}/mo · {s.listing.bedrooms}BR/{s.listing.bathrooms}BA</div>
                                    {/* Contact info */}
                                    <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-0.5">
                                      {s.listing.ownerName && (
                                        <span className="text-[10px] text-slate-600">
                                          <span className="font-medium">{s.listing.ownerName}</span>
                                          {s.listing.ownerType && <span className="text-slate-400 ml-1">({s.listing.ownerType})</span>}
                                        </span>
                                      )}
                                      {s.listing.ownerEmail && (
                                        <a href={`mailto:${s.listing.ownerEmail}`} className="text-[10px] text-blue-600 hover:underline">{s.listing.ownerEmail}</a>
                                      )}
                                      {s.listing.ownerPhone && (
                                        <a href={`tel:${s.listing.ownerPhone}`} className="text-[10px] text-blue-600 hover:underline">{s.listing.ownerPhone}</a>
                                      )}
                                      {!s.listing.ownerName && !s.listing.ownerEmail && !s.listing.ownerPhone && (
                                        <span className="text-[10px] text-amber-600 font-medium">No contact — needs enrichment</span>
                                      )}
                                      {s.listing.zillowUrl && (
                                        <a href={s.listing.zillowUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-400 hover:text-slate-600">Zillow ↗</a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {expandedTenant === r.id && (!r.selections || r.selections.length === 0) && (
                          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
                            No favorites selected yet
                          </div>
                        )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Negotiations */}
      {data.activeNegotiations.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-slate-900 font-semibold mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-amber-600" />
            Active Negotiations ({data.activeNegotiations.length})
          </h2>
          <div className="space-y-3">
            {data.activeNegotiations.map((n) => (
              <div key={n.groupId} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <div className="text-slate-900 font-medium">{n.listingTitle || "Property"}</div>
                  <div className="text-slate-500 text-sm">
                    {n.memberCount} tenant{n.memberCount !== 1 ? "s" : ""} &middot; Listed ${(n.listingPrice || 0).toLocaleString()}/mo
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {n.counterAmount ? (
                      <>
                        <div className="text-amber-700 font-bold text-sm">Counter: ${n.counterAmount.toLocaleString()}/mo</div>
                        <div className="text-slate-500 text-xs">Our offer: ${(n.offerAmount || 0).toLocaleString()}/mo</div>
                      </>
                    ) : (
                      <div className="text-slate-700 text-sm font-medium">Offer: ${(n.offerAmount || 0).toLocaleString()}/mo</div>
                    )}
                  </div>
                  <a
                    href="/admin/negotiations"
                    className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                  >
                    Respond
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Leased */}
      {data.recentLeased.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-slate-900 font-semibold mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600" />
            Recent Completions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.recentLeased.map((r) => (
              <div key={r.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-slate-900 text-sm font-medium truncate">{r.name}</div>
                <div className="text-green-700 text-xs">{r.city}, {r.state}</div>
                <div className="text-slate-400 text-[10px] mt-1">{new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const styles: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50",
    purple: "border-purple-200 bg-purple-50",
    green: "border-green-200 bg-green-50",
    amber: "border-amber-200 bg-amber-50",
    slate: "border-slate-200 bg-slate-50",
  };
  const iconColors: Record<string, string> = {
    blue: "text-blue-600",
    purple: "text-purple-600",
    green: "text-green-600",
    amber: "text-amber-600",
    slate: "text-slate-600",
  };
  const labelColors: Record<string, string> = {
    blue: "text-blue-700",
    purple: "text-purple-700",
    green: "text-green-700",
    amber: "text-amber-700",
    slate: "text-slate-600",
  };
  return (
    <div className={`rounded-xl border p-4 ${styles[color] || styles.slate}`}>
      <div className={`flex items-center gap-2 mb-2 ${iconColors[color]}`}>{icon}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className={`text-xs mt-1 ${labelColors[color]}`}>{label}</div>
    </div>
  );
}
