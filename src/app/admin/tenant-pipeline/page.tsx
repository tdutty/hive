"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  RefreshCw,
  Search,
  Mail,
  Phone,
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
  { key: "pending", label: "Pending", icon: Clock, color: "gray", action: "Review", actionColor: "bg-gray-600 hover:bg-gray-500" },
  { key: "searching", label: "Searching", icon: Search, color: "blue", action: "Check Status", actionColor: "bg-blue-600 hover:bg-blue-500" },
  { key: "matched", label: "Matched", icon: Eye, color: "indigo", action: "View Matches", actionColor: "bg-indigo-600 hover:bg-indigo-500" },
  { key: "selections_confirmed", label: "Selected", icon: CheckCircle, color: "purple", action: "Send Outreach", actionColor: "bg-purple-600 hover:bg-purple-500" },
  { key: "outreach", label: "Outreach Sent", icon: Send, color: "cyan", action: "Follow Up", actionColor: "bg-cyan-600 hover:bg-cyan-500" },
  { key: "negotiating", label: "Negotiating", icon: MessageSquare, color: "amber", action: "View Offer", actionColor: "bg-amber-600 hover:bg-amber-500" },
  { key: "lease_pending", label: "Lease Pending", icon: FileSignature, color: "orange", action: "Send Reminder", actionColor: "bg-orange-600 hover:bg-orange-500" },
  { key: "leased", label: "Leased", icon: CheckCircle, color: "green", action: "View Lease", actionColor: "bg-green-600 hover:bg-green-500" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "text-gray-400 bg-gray-400/10 border-gray-400/20",
  searching: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  matched: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  selections_confirmed: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  outreach: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  negotiating: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  lease_pending: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  leased: "text-green-400 bg-green-400/10 border-green-400/20",
};

const BORDER_COLORS: Record<string, string> = {
  gray: "border-l-gray-500",
  blue: "border-l-blue-500",
  indigo: "border-l-indigo-500",
  purple: "border-l-purple-500",
  cyan: "border-l-cyan-500",
  amber: "border-l-amber-500",
  orange: "border-l-orange-500",
  green: "border-l-green-500",
};

export default function TenantPipelinePage() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
      <div className="p-6 flex items-center justify-center h-64">
        <RefreshCw size={24} className="animate-spin text-amber-400" />
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenant Pipeline</h1>
          <p className="text-sm text-gray-400 mt-1">
            {data.total} total requests &middot; {totalActive} active
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
      <div className="grid grid-cols-5 gap-4">
        <StatCard icon={<Users size={18} />} label="Total Tenants" value={data.total} color="blue" />
        <StatCard icon={<TrendingUp size={18} />} label="Active Pipeline" value={totalActive} color="purple" />
        <StatCard icon={<DollarSign size={18} />} label="Monthly Rent" value={`$${data.revenue.totalMonthlyRent.toLocaleString()}`} color="green" />
        <StatCard icon={<FileSignature size={18} />} label="Active Leases" value={data.revenue.activeLeases} color="amber" />
        <StatCard icon={<DollarSign size={18} />} label="Deposits Held" value={`$${data.revenue.totalDepositsHeld.toLocaleString()}`} color="blue" />
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search by name, email, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-[#1e1e2d] border border-[#3a3a52] rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
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
            <div key={stage.key} className={`rounded-xl border border-[#3a3a52] overflow-hidden ${BORDER_COLORS[stage.color]} border-l-4`}>
              {/* Stage Header */}
              <div
                onClick={() => setExpandedStage(isExpanded ? null : stage.key)}
                className={`flex items-center justify-between px-5 py-4 cursor-pointer transition hover:bg-[#2e2e42] ${
                  isExpanded ? "bg-[#2a2a3d]" : "bg-[#22223a]"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-500" />}
                  <Icon size={18} className={`text-${stage.color}-400`} />
                  <span className="text-white font-medium">{stage.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    count > 0 ? `bg-${stage.color}-500/20 text-${stage.color}-400` : "bg-gray-500/10 text-gray-600"
                  }`}>
                    {count}
                  </span>
                  {hasAttention && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full animate-pulse">
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
                    {stage.action}
                  </button>
                )}
              </div>

              {/* Expanded: Tenant List */}
              {isExpanded && (
                <div className="bg-[#1e1e2d] border-t border-[#3a3a52]">
                  {requests.length === 0 ? (
                    <div className="px-6 py-6 text-center text-gray-600 text-sm">
                      No tenants at this stage
                    </div>
                  ) : (
                    <div className="divide-y divide-[#2a2a3d]">
                      {requests.map((r) => (
                        <div key={r.id} className="flex items-center justify-between px-6 py-3 hover:bg-[#25253a] transition">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 text-xs font-bold shrink-0">
                              {r.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-white text-sm font-medium truncate">{r.name}</div>
                              <div className="text-gray-500 text-xs truncate flex items-center gap-2">
                                <Mail size={10} /> {r.email}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 shrink-0">
                            <div className="text-gray-400 text-xs flex items-center gap-1">
                              <MapPin size={10} />
                              {r.city}, {r.state}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {r.matchCount} matches
                            </div>
                            <div className="text-gray-600 text-xs">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </div>

                            {/* Action buttons per stage */}
                            <div className="flex items-center gap-2">
                              {stage.key === "matched" && (
                                <a
                                  href={`https://sweetlease.io/matches/${r.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 text-[11px] font-medium bg-indigo-600 text-white rounded hover:bg-indigo-500 transition"
                                >
                                  View Matches
                                </a>
                              )}
                              {stage.key === "selections_confirmed" && (
                                <button className="px-2.5 py-1 text-[11px] font-medium bg-purple-600 text-white rounded hover:bg-purple-500 transition">
                                  Trigger Outreach
                                </button>
                              )}
                              {stage.key === "outreach" && (
                                <button className="px-2.5 py-1 text-[11px] font-medium bg-cyan-600 text-white rounded hover:bg-cyan-500 transition">
                                  Send Follow-up
                                </button>
                              )}
                              {stage.key === "negotiating" && (
                                <a
                                  href="/admin/negotiations"
                                  className="px-2.5 py-1 text-[11px] font-medium bg-amber-600 text-white rounded hover:bg-amber-500 transition"
                                >
                                  View Offer
                                </a>
                              )}
                              {stage.key === "lease_pending" && (
                                <button className="px-2.5 py-1 text-[11px] font-medium bg-orange-600 text-white rounded hover:bg-orange-500 transition">
                                  Send Reminder
                                </button>
                              )}
                              {(stage.key === "pending" || stage.key === "searching") && (
                                <span className="text-gray-600 text-[11px]">Auto-processing</span>
                              )}
                            </div>
                          </div>
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
        <div className="bg-[#2a2a3d] border border-[#3a3a52] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-amber-400" />
            Active Negotiations ({data.activeNegotiations.length})
          </h2>
          <div className="space-y-3">
            {data.activeNegotiations.map((n) => (
              <div key={n.groupId} className="flex items-center justify-between p-4 bg-[#1e1e2d] rounded-lg border border-[#3a3a52]">
                <div>
                  <div className="text-white font-medium">{n.listingTitle || "Property"}</div>
                  <div className="text-gray-500 text-sm">
                    {n.memberCount} tenant{n.memberCount !== 1 ? "s" : ""} &middot; Listed ${(n.listingPrice || 0).toLocaleString()}/mo
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    {n.counterAmount ? (
                      <>
                        <div className="text-amber-400 font-bold text-sm">Counter: ${n.counterAmount.toLocaleString()}/mo</div>
                        <div className="text-gray-500 text-xs">Our offer: ${(n.offerAmount || 0).toLocaleString()}/mo</div>
                      </>
                    ) : (
                      <div className="text-gray-300 text-sm">Offer: ${(n.offerAmount || 0).toLocaleString()}/mo</div>
                    )}
                  </div>
                  <a
                    href="/admin/negotiations"
                    className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition"
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
        <div className="bg-[#2a2a3d] border border-[#3a3a52] rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-400" />
            Recent Completions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.recentLeased.map((r) => (
              <div key={r.id} className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                <div className="text-white text-sm font-medium truncate">{r.name}</div>
                <div className="text-green-400 text-xs">{r.city}, {r.state}</div>
                <div className="text-gray-600 text-[10px] mt-1">{new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.blue}`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs mt-1 opacity-60">{label}</div>
    </div>
  );
}
