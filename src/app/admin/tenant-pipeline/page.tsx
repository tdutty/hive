"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { sweetleaseApi } from "@/lib/api";
import { Button, buttonVariants, Card, CardHeader, Badge, StatTile, PageHeader, Input } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { useConfirm } from "@/components/ui/ConfirmDialog";
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
    communicationsPaused: boolean;
    communicationsPausedAt: string | null;
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
  { key: "pending", label: "Pending", icon: Clock },
  { key: "searching", label: "Searching", icon: Search },
  { key: "matched", label: "Matched", icon: Eye },
  { key: "selections_confirmed", label: "Selected", icon: CheckCircle },
  { key: "outreach", label: "Outreach Sent", icon: Send },
  { key: "negotiating", label: "Negotiating", icon: MessageSquare },
  { key: "lease_pending", label: "Lease Pending", icon: FileSignature },
  { key: "leased", label: "Leased", icon: CheckCircle },
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

const linkBtn = buttonVariants({ variant: "secondary", size: "sm" });

export default function TenantPipelinePage() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [outreachLoading, setOutreachLoading] = useState<string | null>(null);
  const [pauseLoading, setPauseLoading] = useState<string | null>(null);
  const [smsLoading, setSmsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await sweetleaseApi.get<PipelineData>("/api/admin/tenant-match/pipeline");
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const actionError = (err: any) => err?.data?.error || err?.message;

  const triggerOutreach = async (r: PipelineData["recentRequests"][number]) => {
    setOutreachLoading(r.id);
    try {
      const res: any = await sweetleaseApi.post("/api/admin/tenant-match/trigger-outreach", { matchRequestId: r.id });
      toast.success(res?.message || `Outreach triggered for ${r.selections?.length || 0} listings`);
      fetchData();
    } catch (err: any) {
      toast.error("Outreach failed", { description: actionError(err) });
    } finally {
      setOutreachLoading(null);
    }
  };

  const sendTexts = async (r: PipelineData["recentRequests"][number]) => {
    const ok = await confirm({
      title: "Send texts to landlords?",
      message: `Send SMS to landlords with phone numbers for ${r.name}'s selections?`,
      confirmLabel: "Send Texts",
    });
    if (!ok) return;
    setSmsLoading(r.id);
    try {
      const res: any = await sweetleaseApi.post("/api/admin/tenant-match/sms-outreach", { matchRequestId: r.id });
      toast.success(res?.message || `SMS sent to ${res?.sent || 0} landlords`);
      fetchData();
    } catch (err: any) {
      toast.error("SMS failed", { description: actionError(err) });
    } finally {
      setSmsLoading(null);
    }
  };

  const togglePause = async (r: PipelineData["recentRequests"][number]) => {
    const newPaused = !r.communicationsPaused;
    if (newPaused) {
      const ok = await confirm({
        title: `Pause all communications for ${r.name}?`,
        message: "No emails or outreach will be sent until resumed.",
        confirmLabel: "Pause",
        danger: true,
      });
      if (!ok) return;
    }
    setPauseLoading(r.id);
    try {
      const res: any = await sweetleaseApi.post("/api/admin/tenant-match/pause", { matchRequestId: r.id, paused: newPaused });
      toast.success(res?.message || `${newPaused ? "Paused" : "Resumed"}`);
      fetchData();
    } catch (err: any) {
      toast.error(newPaused ? "Failed to pause" : "Failed to resume", { description: actionError(err) });
    } finally {
      setPauseLoading(null);
    }
  };

  if (loading && !data) return <div><PageHeader title="Tenant Pipeline" /><Spinner /></div>;
  if (!data) return <div><PageHeader title="Tenant Pipeline" /><ErrorBanner message={error || "Failed to load pipeline"} onRetry={fetchData} /></div>;

  const filteredRequests = data.recentRequests.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.city.toLowerCase().includes(q);
  });

  const getStageRequests = (stageKey: string) =>
    filteredRequests.filter((r) => r.status === stageKey);

  const totalActive = STAGES.slice(0, -1).reduce((sum, s) => sum + (data.pipeline[s.key] || 0), 0);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();

  return (
    <div className="max-w-7xl">
      {dialog}
      <PageHeader
        title="Tenant Pipeline"
        meta="Tenants · matching"
        description={<><span className="tabular">{data.total}</span> total requests &middot; <span className="tabular">{totalActive}</span> active</>}
        actions={<Button icon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />} disabled={loading} onClick={fetchData}>Refresh</Button>}
      />

      {error && <ErrorBanner className="mb-4" message={error} onRetry={fetchData} />}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <StatTile label="Total Tenants" value={data.total} icon={<Users size={14} />} />
        <StatTile label="Active Pipeline" value={totalActive} icon={<TrendingUp size={14} />} />
        <StatTile label="Monthly Rent" value={`$${data.revenue.totalMonthlyRent.toLocaleString()}`} icon={<DollarSign size={14} />} />
        <StatTile label="Active Leases" value={data.revenue.activeLeases} icon={<FileSignature size={14} />} />
        <StatTile label="Deposits Held" value={`$${data.revenue.totalDepositsHeld.toLocaleString()}`} icon={<DollarSign size={14} />} />
      </div>

      <Input
        type="search"
        aria-label="Search tenants"
        placeholder="Search by name, email, or city..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="sm:max-w-md mb-4"
      />

      {/* Pipeline Stages */}
      <div className="space-y-2 mb-5">
        {STAGES.map((stage) => {
          const count = data.pipeline[stage.key] || 0;
          const isExpanded = expandedStage === stage.key;
          const requests = getStageRequests(stage.key);
          const Icon = stage.icon;
          const hasAttention = stage.key === "selections_confirmed" && count > 0;

          return (
            <Card key={stage.key} className="overflow-hidden">
              {/* Stage Header */}
              <div className={`flex items-center justify-between gap-3 px-4 py-2.5 ${isExpanded ? "bg-slate-50" : ""}`}>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpandedStage(isExpanded ? null : stage.key)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  {isExpanded ? <ChevronDown size={15} className="text-slate-500 shrink-0" aria-hidden /> : <ChevronRight size={15} className="text-slate-400 shrink-0" aria-hidden />}
                  <Icon size={15} className="text-slate-500 shrink-0" aria-hidden />
                  <span className="text-sm font-medium text-slate-900">{stage.label}</span>
                  <Badge tone={count > 0 ? "neutral" : "outline"} className={count > 0 ? "tabular" : "tabular text-slate-400"}>{count}</Badge>
                  {hasAttention && (
                    <Badge tone="warning"><AlertTriangle size={11} aria-hidden /> Needs outreach</Badge>
                  )}
                </button>
                {count > 0 && (
                  <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); }}>
                    {ACTION_LABELS[stage.key]}
                  </Button>
                )}
              </div>

              {/* Expanded: Tenant List */}
              {isExpanded && (
                <div className="border-t border-slate-200">
                  {requests.length === 0 ? (
                    <EmptyState title="No tenants at this stage" />
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {requests.map((r) => (
                        <div key={r.id}>
                          <div
                            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4 px-4 py-2.5 hover:bg-slate-50 cursor-pointer"
                            onClick={() => setExpandedTenant(expandedTenant === r.id ? null : r.id)}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-xs font-semibold shrink-0" aria-hidden>
                                {r.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-slate-900 truncate flex items-center gap-2">
                                  {r.name}
                                  {r.communicationsPaused && <Badge tone="danger" dot>Paused</Badge>}
                                </div>
                                <div className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                                  <Mail size={11} aria-hidden /> {r.email}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 shrink-0 pl-10 lg:pl-0">
                              <span className="text-xs text-slate-600 inline-flex items-center gap-1 whitespace-nowrap">
                                <MapPin size={11} aria-hidden />
                                {r.city}, {r.state}
                              </span>
                              <span className="text-xs text-slate-500 tabular whitespace-nowrap">{r.matchCount} matches</span>
                              <span className="text-xs text-slate-500 tabular whitespace-nowrap">{fmtDate(r.createdAt)}</span>

                              {/* Action buttons per stage */}
                              <div className="flex flex-wrap items-center gap-2">
                                {stage.key === "matched" && (
                                  <a
                                    href={`https://sweetlease.io/matches/${r.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className={linkBtn}
                                  >
                                    View Matches
                                  </a>
                                )}
                                {stage.key === "selections_confirmed" && (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    icon={<Send size={12} />}
                                    loading={outreachLoading === r.id}
                                    onClick={(e) => { e.stopPropagation(); triggerOutreach(r); }}
                                  >
                                    {outreachLoading === r.id ? "Sending..." : "Trigger Outreach"}
                                  </Button>
                                )}
                                {(stage.key === "selections_confirmed" || stage.key === "outreach") && (
                                  <Button
                                    size="sm"
                                    loading={smsLoading === r.id}
                                    onClick={(e) => { e.stopPropagation(); sendTexts(r); }}
                                  >
                                    {smsLoading === r.id ? "Texting..." : "Send Texts"}
                                  </Button>
                                )}
                                {stage.key === "outreach" && (
                                  <Button size="sm" onClick={(e) => e.stopPropagation()}>Send Follow-up</Button>
                                )}
                                {stage.key === "negotiating" && (
                                  <a href="/admin/negotiations" onClick={(e) => e.stopPropagation()} className={linkBtn}>View Offer</a>
                                )}
                                {stage.key === "lease_pending" && (
                                  <Button size="sm" onClick={(e) => e.stopPropagation()}>Send Reminder</Button>
                                )}
                                {(stage.key === "pending" || stage.key === "searching") && (
                                  <span className="text-xs text-slate-400">Auto-processing</span>
                                )}
                                {/* Pause/Resume button, available on all stages */}
                                <Button
                                  size="sm"
                                  variant={r.communicationsPaused ? "secondary" : "dangerOutline"}
                                  loading={pauseLoading === r.id}
                                  onClick={(e) => { e.stopPropagation(); togglePause(r); }}
                                >
                                  {pauseLoading === r.id ? "..." : r.communicationsPaused ? "Resume" : "Pause"}
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Expanded selections */}
                          {expandedTenant === r.id && r.selections && r.selections.length > 0 && (
                            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                                Favorites ({r.selections.length})
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {r.selections.map((s) => (
                                  <Card key={s.listing.id} className="flex items-center gap-3 p-2.5">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-semibold tabular shrink-0">
                                      {s.rank}
                                    </div>
                                    {s.listing.image ? (
                                      <img src={s.listing.image} alt="" className="w-12 h-12 rounded-sm object-cover shrink-0" />
                                    ) : (
                                      <div className="w-12 h-12 rounded-sm bg-slate-100 shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-medium text-slate-900 truncate">{s.listing.title}</div>
                                      <div className="text-xs text-slate-500 truncate">{s.listing.address}</div>
                                      <div className="text-xs font-medium text-slate-700 tabular">${s.listing.price.toLocaleString()}/mo · {s.listing.bedrooms}BR/{s.listing.bathrooms}BA</div>
                                      {/* Contact info */}
                                      <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-0.5">
                                        {s.listing.ownerName && (
                                          <span className="text-xs text-slate-600">
                                            <span className="font-medium">{s.listing.ownerName}</span>
                                            {s.listing.ownerType && <span className="text-slate-400 ml-1">({s.listing.ownerType})</span>}
                                          </span>
                                        )}
                                        {s.listing.ownerEmail && (
                                          <a href={`mailto:${s.listing.ownerEmail}`} className="text-xs text-sky-700 hover:underline">{s.listing.ownerEmail}</a>
                                        )}
                                        {s.listing.ownerPhone && (
                                          <a href={`tel:${s.listing.ownerPhone}`} className="text-xs text-sky-700 hover:underline">{s.listing.ownerPhone}</a>
                                        )}
                                        {!s.listing.ownerName && !s.listing.ownerEmail && !s.listing.ownerPhone && (
                                          <Badge tone="warning">No contact - needs enrichment</Badge>
                                        )}
                                        {s.listing.zillowUrl && (
                                          <a href={s.listing.zillowUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-400 hover:text-slate-600">Zillow ↗</a>
                                        )}
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </div>
                          )}
                          {expandedTenant === r.id && (!r.selections || r.selections.length === 0) && (
                            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
                              No favorites selected yet
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Active Negotiations */}
      {data.activeNegotiations.length > 0 && (
        <Card className="mb-5">
          <CardHeader title={`Active Negotiations (${data.activeNegotiations.length})`} description="Offers and counters in flight." />
          <div className="divide-y divide-slate-100">
            {data.activeNegotiations.map((n) => (
              <div key={n.groupId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 px-4 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{n.listingTitle || "Property"}</div>
                  <div className="text-xs text-slate-500 tabular">
                    {n.memberCount} tenant{n.memberCount !== 1 ? "s" : ""} &middot; Listed ${(n.listingPrice || 0).toLocaleString()}/mo
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="sm:text-right">
                    {n.counterAmount ? (
                      <>
                        <div className="text-sm font-medium text-slate-900 tabular">Counter: ${n.counterAmount.toLocaleString()}/mo</div>
                        <div className="text-xs text-slate-500 tabular">Our offer: ${(n.offerAmount || 0).toLocaleString()}/mo</div>
                      </>
                    ) : (
                      <div className="text-sm font-medium text-slate-900 tabular">Offer: ${(n.offerAmount || 0).toLocaleString()}/mo</div>
                    )}
                  </div>
                  <a href="/admin/negotiations" className={linkBtn}>Respond</a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Leased */}
      {data.recentLeased.length > 0 && (
        <Card>
          <CardHeader title="Recent Completions" description="Tenants who signed." />
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {data.recentLeased.map((r) => (
              <Card key={r.id} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-slate-900 truncate">{r.name}</div>
                  <Badge tone="success" dot>Leased</Badge>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{r.city}, {r.state}</div>
                <div className="text-xs text-slate-500 tabular mt-1">{fmtDate(r.createdAt)}</div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
