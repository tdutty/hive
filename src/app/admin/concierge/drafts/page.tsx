"use client";

import { useState, useEffect, useRef } from "react";
import { sweetleaseApi } from "@/lib/api";
import { usePolling } from "@/lib/hooks";
import { Button, buttonVariants, Card, Badge, statusTone, PageHeader, Field, Input, Textarea } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  RefreshCw,
  Mail,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  Circle,
  FileText,
  Send,
  RotateCcw,
  X,
  AlertTriangle,
  Clock,
} from "lucide-react";

// --- Types ---

interface DraftContact {
  id: string;
  type: "LANDLORD" | "RESIDENT" | "PARTNER";
  name: string;
  primaryEmail: string | null;
  market: string | null;
  currentDealStage: string | null;
}

interface DraftListItem {
  id: string;
  threadId: string;
  contactId: string;
  channel: "EMAIL" | "SMS";
  subject: string | null;
  body: string;
  status: string;
  priorityScore: number;
  confidence: number;
  reasoning: string | null;
  riskFlags: string[];
  createdAt: string;
  contact: DraftContact;
  threadSubject: string | null;
}

interface ThreadMessage {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  channel: string;
  subject: string | null;
  body: string;
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
}

interface Commitment {
  id: string;
  contactId: string;
  description: string;
  owner: "US" | "THEM";
  dueDate: string | null;
  status: string;
  createdAt: string;
}

interface DraftDetail extends DraftListItem {
  thread: {
    id: string;
    subject: string | null;
    messages: ThreadMessage[];
  };
  commitments: Commitment[];
}

interface DraftsResponse {
  drafts: DraftListItem[];
  total: number;
}

// --- Helpers ---

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function contactTypeBadge(type: string) {
  return <Badge tone={statusTone(type)}>{type}</Badge>;
}

/** Priority is a fixed three-level bucket (Hot / Warm / Cool), toned per level like the other fixed labels. */
function priorityBadge(score: number) {
  if (score >= 70) return <Badge tone="danger" dot>Hot</Badge>;
  if (score >= 40) return <Badge tone="warning" dot>Warm</Badge>;
  return <Badge tone="neutral" dot>Cool</Badge>;
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "High";
  if (confidence >= 0.5) return "Medium";
  return "Low";
}

/** Confidence meter: the fill colour follows the same success / warning / danger tones the Badge uses. */
function confidenceBarClass(confidence: number): string {
  if (confidence >= 0.8) return "bg-emerald-500";
  if (confidence >= 0.5) return "bg-amber-500";
  return "bg-red-500";
}

// --- Component ---

export default function ConciergeDraftsPage() {
  const [drafts, setDrafts] = useState<DraftListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DraftDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Editable fields
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [hasEdits, setHasEdits] = useState(false);

  // Collapsible sections
  const [threadOpen, setThreadOpen] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Fetch draft queue
  const fetchDrafts = async () => {
    try {
      const data = await sweetleaseApi.get<DraftsResponse>("/api/admin/concierge/drafts", {
        status: "PENDING",
      });
      const sorted = [...data.drafts].sort((a, b) => b.priorityScore - a.priorityScore);
      setDrafts(sorted);
      setTotal(data.total);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load drafts");
    } finally {
      setLoading(false);
    }
  };

  // Fetch draft detail
  const fetchDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await sweetleaseApi.get<DraftDetail>(`/api/admin/concierge/drafts/${id}`);
      setDetail(data);
      setEditSubject(data.subject || "");
      setEditBody(data.body || "");
      setHasEdits(false);
    } catch (err: any) {
      toast.error("Failed to load draft", { description: err?.message });
    } finally {
      setDetailLoading(false);
    }
  };

  // Auto-expand textarea
  const autoExpand = () => {
    if (bodyRef.current) {
      bodyRef.current.style.height = "auto";
      bodyRef.current.style.height = bodyRef.current.scrollHeight + "px";
    }
  };

  useEffect(() => {
    autoExpand();
  }, [editBody]);

  // Select next draft after action
  const selectNext = (removedId: string) => {
    const remaining = drafts.filter((d) => d.id !== removedId);
    setDrafts(remaining);
    if (remaining.length > 0) {
      setSelectedId(remaining[0].id);
    } else {
      setSelectedId(null);
      setDetail(null);
    }
  };

  // Approve & Send
  const handleApprove = async () => {
    if (!detail) return;
    setActionLoading("approve");
    try {
      await sweetleaseApi.patch(`/api/admin/concierge/drafts/${detail.id}`, {
        status: "APPROVED",
      });
      await sweetleaseApi.post(`/api/admin/concierge/drafts/${detail.id}/send`);
      toast.success("Draft approved and sent.");
      selectNext(detail.id);
    } catch (err: any) {
      toast.error("Failed to approve and send draft", { description: err?.message });
    } finally {
      setActionLoading(null);
    }
  };

  // Edit & Send
  const handleEditSend = async () => {
    if (!detail) return;
    setActionLoading("edit");
    try {
      await sweetleaseApi.patch(`/api/admin/concierge/drafts/${detail.id}`, {
        status: "APPROVED",
        subject: editSubject,
        body: editBody,
        editDiff: {
          original: detail.body,
          edited: editBody,
        },
      });
      await sweetleaseApi.post(`/api/admin/concierge/drafts/${detail.id}/send`);
      toast.success("Draft edited and sent.");
      selectNext(detail.id);
    } catch (err: any) {
      toast.error("Failed to edit and send draft", { description: err?.message });
    } finally {
      setActionLoading(null);
    }
  };

  // Regenerate
  const handleRegenerate = async () => {
    if (!detail) return;
    setActionLoading("regenerate");
    try {
      await sweetleaseApi.post("/api/admin/concierge/drafts/generate", {
        threadId: detail.threadId,
      });
      await fetchDetail(detail.id);
      toast.success("Draft regenerated.");
    } catch (err: any) {
      toast.error("Failed to regenerate draft", { description: err?.message });
    } finally {
      setActionLoading(null);
    }
  };

  // Reject
  const handleReject = async () => {
    if (!detail) return;
    setActionLoading("reject");
    try {
      await sweetleaseApi.patch(`/api/admin/concierge/drafts/${detail.id}`, {
        status: "REJECTED",
      });
      toast.success("Draft rejected.");
      selectNext(detail.id);
    } catch (err: any) {
      toast.error("Failed to reject draft", { description: err?.message });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  usePolling(fetchDrafts, 30000);

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId);
    }
  }, [selectedId]);

  // Track edits
  useEffect(() => {
    if (!detail) return;
    const subjectChanged = editSubject !== (detail.subject || "");
    const bodyChanged = editBody !== (detail.body || "");
    setHasEdits(subjectChanged || bodyChanged);
  }, [editSubject, editBody, detail]);

  const busy = actionLoading !== null;

  return (
    <div className="flex flex-col lg:h-[calc(100vh-48px)]">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            Approval Queue
            {total > 0 && <Badge tone="danger">{total}</Badge>}
          </span>
        }
        description="Review and approve AI-generated draft replies"
        actions={
          <Button
            variant="secondary"
            icon={<RefreshCw size={14} />}
            loading={loading}
            onClick={() => { setLoading(true); fetchDrafts(); }}
          >
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:flex-1 lg:min-h-0">
        {/* Left Panel - Draft Queue */}
        <Card className={cn("lg:col-span-2 lg:min-h-0 max-h-[70vh] lg:max-h-none overflow-y-auto", selectedId ? "hidden lg:block" : "")}>
          {error && (
            <div className="p-3">
              <ErrorBanner message={error} onRetry={fetchDrafts} />
            </div>
          )}
          {loading ? (
            <Spinner label="Loading drafts" />
          ) : drafts.length === 0 ? (
            <EmptyState
              title="No pending drafts"
              hint="All caught up!"
              icon={<FileText size={28} className="mx-auto" aria-hidden />}
            />
          ) : (
            <ul className="divide-y divide-slate-200">
              {drafts.map((draft) => {
                const isSelected = selectedId === draft.id;
                return (
                  <li key={draft.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(draft.id)}
                      aria-current={isSelected ? "true" : undefined}
                      className={cn(
                        "w-full text-left px-4 py-3 border-l-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500",
                        isSelected ? "bg-amber-50 border-l-amber-500" : "border-l-transparent hover:bg-slate-50"
                      )}
                    >
                      {/* Row 1: Priority + Name + Type + Time */}
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {priorityBadge(draft.priorityScore)}
                          <span className="text-sm font-medium text-slate-900 truncate">
                            {draft.contact.name}
                          </span>
                          {contactTypeBadge(draft.contact.type)}
                        </div>
                        <span className="text-xs text-slate-500 shrink-0 tabular">
                          {relativeTime(draft.createdAt)}
                        </span>
                      </div>

                      {/* Row 2: Subject + Channel icon */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        {draft.channel === "EMAIL" ? (
                          <Mail size={12} className="text-slate-500 shrink-0" aria-hidden />
                        ) : (
                          <MessageSquare size={12} className="text-slate-500 shrink-0" aria-hidden />
                        )}
                        <span className="text-xs text-slate-500 truncate">
                          {draft.threadSubject || draft.subject || "(no subject)"}
                        </span>
                      </div>

                      {/* Row 3: Confidence bar */}
                      <div
                        className="h-1 w-full bg-slate-100 rounded-full overflow-hidden"
                        role="meter"
                        aria-label="Confidence"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(draft.confidence * 100)}
                      >
                        <div
                          className={cn("h-full rounded-full", confidenceBarClass(draft.confidence))}
                          style={{ width: `${Math.round(draft.confidence * 100)}%` }}
                        />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Right Panel - Draft Detail */}
        <Card className={cn("lg:col-span-3 flex-col lg:min-h-0 min-h-[50vh]", selectedId ? "flex" : "hidden lg:flex")}>
          {selectedId && detail && !detailLoading ? (
            <>
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                {/* Section 1: Contact Header */}
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 lg:hidden -ml-2"
                          aria-label="Back to queue"
                          onClick={() => setSelectedId(null)}
                        >
                          <ChevronLeft size={16} />
                        </Button>
                        <span className="text-slate-900 font-medium text-md truncate">
                          {detail.contact.name}
                        </span>
                        {contactTypeBadge(detail.contact.type)}
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                        {detail.contact.primaryEmail && (
                          <span className="flex items-center gap-1 min-w-0">
                            <Mail size={12} aria-hidden />
                            <span className="truncate">{detail.contact.primaryEmail}</span>
                          </span>
                        )}
                        {detail.contact.market && (
                          <span className="flex items-center gap-1">
                            <Circle size={8} aria-hidden />
                            {detail.contact.market}
                          </span>
                        )}
                        {detail.contact.currentDealStage && (
                          <span className="flex items-center gap-1">
                            <Circle size={8} aria-hidden />
                            {detail.contact.currentDealStage}
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={`/admin/concierge/contacts/${detail.contactId}`}
                      className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "shrink-0")}
                    >
                      <ExternalLink size={12} aria-hidden />
                      View Contact
                    </a>
                  </div>
                </div>

                {/* Section 2: Thread Context (collapsible, collapsed by default) */}
                <div className="border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setThreadOpen(!threadOpen)}
                    aria-expanded={threadOpen}
                    className="w-full flex items-center justify-between px-4 sm:px-6 py-3 text-sm text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-500" aria-hidden />
                      Thread Context ({detail.thread?.messages?.length || 0} messages)
                    </span>
                    {threadOpen ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
                  </button>
                  {threadOpen && detail.thread?.messages && (
                    <div className="px-4 sm:px-6 pb-4 space-y-3">
                      {detail.thread.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "rounded-lg px-4 py-3 text-sm border",
                            msg.direction === "OUTBOUND"
                              ? "bg-amber-50 border-amber-200"
                              : "bg-slate-50 border-slate-200"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <span
                              className={cn(
                                "text-xs font-medium",
                                msg.direction === "OUTBOUND" ? "text-amber-800" : "text-slate-500"
                              )}
                            >
                              {msg.direction === "OUTBOUND" ? "SweetLease" : detail.contact.name}
                            </span>
                            <span className="text-xs text-slate-500 tabular">
                              {formatDate(msg.sentAt || msg.receivedAt || msg.createdAt)}
                            </span>
                          </div>
                          <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {msg.body}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 3: AI Draft (editable) */}
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-amber-500" aria-hidden />
                    <span className="text-sm font-medium text-slate-900">AI Draft</span>
                    {hasEdits && <Badge tone="warning">edited</Badge>}
                  </div>

                  {/* Subject line (email only) */}
                  {detail.channel === "EMAIL" && (
                    <Field label="Subject" className="mb-3">
                      <Input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                      />
                    </Field>
                  )}

                  {/* Body */}
                  <div>
                    <Field label="Body">
                      <Textarea
                        ref={bodyRef}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="resize-none min-h-[120px] leading-relaxed"
                      />
                    </Field>
                    {detail.channel === "SMS" && (
                      <div className="text-xs text-slate-500 mt-1 text-right tabular">
                        {editBody.length} characters
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 4: AI Reasoning (collapsible) */}
                <div className="border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setReasoningOpen(!reasoningOpen)}
                    aria-expanded={reasoningOpen}
                    className="w-full flex items-center justify-between px-4 sm:px-6 py-3 text-sm text-slate-500 hover:text-slate-900 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-500" aria-hidden />
                      AI Reasoning
                    </span>
                    {reasoningOpen ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
                  </button>
                  {reasoningOpen && (
                    <div className="px-4 sm:px-6 pb-4 space-y-3">
                      {/* Reasoning text */}
                      {detail.reasoning && (
                        <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                          {detail.reasoning}
                        </div>
                      )}

                      {/* Risk flags */}
                      {detail.riskFlags && detail.riskFlags.length > 0 && (
                        <div>
                          <span className="text-xs text-slate-500 mb-1.5 block">Risk Flags</span>
                          <div className="flex flex-wrap gap-1.5">
                            {detail.riskFlags.map((flag, i) => (
                              <Badge key={i} tone="danger">
                                <AlertTriangle size={11} aria-hidden />
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Confidence */}
                      <div>
                        <span className="text-xs text-slate-500 mb-1.5 block">Confidence</span>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden"
                            role="meter"
                            aria-label="Confidence"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(detail.confidence * 100)}
                          >
                            <div
                              className={cn("h-full rounded-full", confidenceBarClass(detail.confidence))}
                              style={{ width: `${Math.round(detail.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600 tabular">
                            {Math.round(detail.confidence * 100)}% - {confidenceLabel(detail.confidence)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 5: Open Commitments */}
                {detail.commitments && detail.commitments.length > 0 && (
                  <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={16} className="text-slate-500" aria-hidden />
                      <span className="text-sm font-medium text-slate-900">
                        Open Commitments ({detail.commitments.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {detail.commitments.map((c) => {
                        const isOverdue =
                          c.dueDate &&
                          c.status !== "FULFILLED" &&
                          new Date(c.dueDate) < new Date();
                        return (
                          <div
                            key={c.id}
                            className={cn(
                              "flex items-center justify-between px-3 py-2 rounded-lg text-sm border",
                              isOverdue ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge tone={c.owner === "US" ? "warning" : "info"}>
                                {c.owner === "US" ? "Us" : "Them"}
                              </Badge>
                              <span className={cn("truncate", isOverdue ? "text-red-800" : "text-slate-600")}>
                                {c.description}
                              </span>
                            </div>
                            {c.dueDate && (
                              <span className={cn("text-xs shrink-0 ml-2 tabular", isOverdue ? "text-red-700 font-medium" : "text-slate-500")}>
                                Due {new Date(c.dueDate).toLocaleDateString([], { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 6: Action Bar (sticky bottom) */}
              <div className="px-4 py-3 border-t border-slate-200 flex flex-wrap items-center gap-2 shrink-0 bg-white rounded-b-lg">
                {hasEdits ? (
                  <>
                    <Button
                      variant="primary"
                      icon={<Send size={14} />}
                      loading={actionLoading === "edit"}
                      disabled={busy}
                      onClick={handleEditSend}
                    >
                      {actionLoading === "edit" ? "Sending" : "Edit & Send"}
                    </Button>
                    <Button
                      variant="secondary"
                      icon={<Send size={14} />}
                      loading={actionLoading === "approve"}
                      disabled={busy}
                      onClick={handleApprove}
                    >
                      {actionLoading === "approve" ? "Sending" : "Approve & Send"}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    icon={<Send size={14} />}
                    loading={actionLoading === "approve"}
                    disabled={busy}
                    onClick={handleApprove}
                  >
                    {actionLoading === "approve" ? "Sending" : "Approve & Send"}
                  </Button>
                )}

                <Button
                  variant="secondary"
                  icon={<RotateCcw size={14} />}
                  loading={actionLoading === "regenerate"}
                  disabled={busy}
                  onClick={handleRegenerate}
                >
                  {actionLoading === "regenerate" ? "Generating" : "Regenerate"}
                </Button>

                <Button
                  variant="dangerOutline"
                  icon={<X size={14} />}
                  loading={actionLoading === "reject"}
                  disabled={busy}
                  onClick={handleReject}
                  className="ml-auto"
                >
                  {actionLoading === "reject" ? "Rejecting" : "Reject"}
                </Button>
              </div>
            </>
          ) : selectedId && detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Spinner label="Loading draft" />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                title="Select a draft to review"
                icon={<FileText size={28} className="mx-auto" aria-hidden />}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
