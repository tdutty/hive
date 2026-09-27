"use client";

import { useState, useEffect, useRef } from "react";
import { sweetleaseApi } from "@/lib/api";
import { usePolling } from "@/lib/hooks";
import { Button, buttonVariants, Card, Badge, statusTone, PageHeader, FilterChips, type Chip } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  RefreshCw,
  Mail,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  Circle,
} from "lucide-react";

// --- Types ---

interface ThreadContact {
  id: string;
  type: "LANDLORD" | "RESIDENT" | "PARTNER";
  name: string;
  primaryEmail: string | null;
  market: string | null;
  primaryPhone?: string | null;
  currentDealStage?: string | null;
  sentimentTrend?: string | null;
}

interface ThreadMessage {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  channel: string;
  subject: string | null;
  body: string;
  classificationResult: any | null;
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
}

interface ThreadListItem {
  id: string;
  contactId: string;
  channel: string;
  subject: string | null;
  lastMessageAt: string | null;
  status: string;
  classification: any | null;
  createdAt: string;
  needsReply: boolean;
  contact: ThreadContact;
  latestMessage: {
    id: string;
    direction: string;
    body: string;
    subject: string | null;
    createdAt: string;
    classificationResult: any | null;
  } | null;
}

interface ThreadDetail {
  id: string;
  contactId: string;
  channel: string;
  subject: string | null;
  lastMessageAt: string | null;
  status: string;
  classification: any | null;
  dealId: string | null;
  createdAt: string;
  needsReply: boolean;
  contact: ThreadContact;
  messages: ThreadMessage[];
  pendingDraft: any | null;
}

interface ThreadsResponse {
  threads: ThreadListItem[];
  total: number;
  needsReplyCount: number;
  unreadCount: number;
}

type Filter = "all" | "needs_reply" | "high_priority";

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

function intentBadge(intent: string | null | undefined) {
  if (!intent) return null;
  const label = intent.replace(/_/g, " ");
  return <Badge tone={statusTone(intent)} className="capitalize">{label}</Badge>;
}

/** Urgency is a fixed three-level enum, so its tone is set per level like the other fixed labels. */
function urgencyBadge(urgency: string | null | undefined) {
  if (!urgency) return null;
  const tone = urgency === "high" ? "danger" : urgency === "medium" ? "warning" : "neutral";
  return <Badge tone={tone} dot className="capitalize" title={`${urgency} urgency`}>{urgency}</Badge>;
}

function getClassification(item: ThreadListItem) {
  // Classification can live on thread.classification or latestMessage.classificationResult
  const cls = item.classification || item.latestMessage?.classificationResult;
  if (!cls || typeof cls !== "object") return null;
  return cls as Record<string, any>;
}

// --- Component ---

export default function ConciergeInboxPage() {
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [stats, setStats] = useState({ total: 0, needsReply: 0, unread: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [classificationOpen, setClassificationOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch thread list
  const fetchThreads = async () => {
    try {
      const data = await sweetleaseApi.get<ThreadsResponse>("/api/admin/concierge/threads");
      setThreads(data.threads);
      setStats({
        total: data.total,
        needsReply: data.needsReplyCount,
        unread: data.unreadCount,
      });
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load threads");
    } finally {
      setLoading(false);
    }
  };

  // Fetch single thread detail
  const fetchDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await sweetleaseApi.get<ThreadDetail>(`/api/admin/concierge/threads/${id}`);
      setDetail(data);
    } catch (err: any) {
      toast.error("Failed to load thread", { description: err?.message });
    } finally {
      setDetailLoading(false);
    }
  };

  // Poll for new emails
  const handlePoll = async () => {
    setPolling(true);
    try {
      await sweetleaseApi.post("/api/admin/concierge/ingest/poll");
      await fetchThreads();
    } catch (err: any) {
      toast.error("Poll failed", { description: err?.message });
    } finally {
      setPolling(false);
    }
  };

  // Generate draft reply
  const handleGenerateDraft = async () => {
    if (!selectedId) return;
    setGenerating(true);
    try {
      await sweetleaseApi.post("/api/admin/concierge/drafts/generate", {
        threadId: selectedId,
      });
      // Refresh detail to show pending draft
      await fetchDetail(selectedId);
    } catch (err: any) {
      toast.error("Draft generation failed", { description: err?.message });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  usePolling(fetchThreads, 30000);

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages]);

  // Filter threads for display
  const filteredThreads = threads.filter((t) => {
    if (filter === "needs_reply") return t.needsReply;
    if (filter === "high_priority") {
      const cls = getClassification(t);
      return cls?.urgency === "high";
    }
    return true;
  });

  const chips: Chip<Filter>[] = [
    { key: "all", label: "All", count: threads.length },
    { key: "needs_reply", label: "Needs Reply", count: threads.filter((t) => t.needsReply).length },
    { key: "high_priority", label: "High Priority", count: threads.filter((t) => getClassification(t)?.urgency === "high").length },
  ];

  const classification =
    detail?.classification && typeof detail.classification === "object"
      ? (detail.classification as Record<string, any>)
      : null;

  return (
    <div className="flex flex-col lg:h-[calc(100vh-48px)]">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            Concierge Inbox
            {stats.needsReply > 0 && <Badge tone="danger">{stats.needsReply}</Badge>}
          </span>
        }
        description={`${stats.total} threads - ${stats.needsReply} needs reply - ${stats.unread} unread`}
        actions={
          <Button variant="secondary" icon={<RefreshCw size={14} />} loading={polling} onClick={handlePoll}>
            {polling ? "Polling" : "Poll Now"}
          </Button>
        }
      />

      <FilterChips items={chips} value={filter} onChange={setFilter} className="mb-4" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:flex-1 lg:min-h-0">
        {/* Left Panel - Thread List */}
        <Card className={cn("lg:col-span-2 lg:overflow-y-auto lg:min-h-0 max-h-[70vh] lg:max-h-none overflow-y-auto", selectedId ? "hidden lg:block" : "")}>
          {error && (
            <div className="p-3">
              <ErrorBanner message={error} onRetry={fetchThreads} />
            </div>
          )}
          {loading ? (
            <Spinner label="Loading threads" />
          ) : filteredThreads.length === 0 ? (
            <EmptyState
              title={filter === "all" ? "No email threads yet" : `No ${filter === "needs_reply" ? "threads needing reply" : "high priority threads"}`}
              hint={filter === "all" ? "Click Poll Now to check for new emails." : undefined}
              icon={<Mail size={28} className="mx-auto" aria-hidden />}
            />
          ) : (
            <ul className="divide-y divide-slate-200">
              {filteredThreads.map((thread) => {
                const isSelected = selectedId === thread.id;
                const cls = getClassification(thread);
                const summary = cls?.summary || null;
                const intent = cls?.intent || null;
                const urgency = cls?.urgency || null;

                return (
                  <li key={thread.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(thread.id)}
                      aria-current={isSelected ? "true" : undefined}
                      className={cn(
                        "w-full text-left px-4 py-3 border-l-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500",
                        isSelected ? "bg-amber-50 border-l-amber-500" : "border-l-transparent hover:bg-slate-50"
                      )}
                    >
                      {/* Row 1: Name + type badge + time */}
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "text-sm truncate",
                              thread.needsReply ? "font-semibold text-slate-900" : "font-medium text-slate-600"
                            )}
                          >
                            {thread.contact.name}
                          </span>
                          {contactTypeBadge(thread.contact.type)}
                        </div>
                        <span className="text-xs text-slate-500 shrink-0 tabular">
                          {relativeTime(thread.lastMessageAt)}
                        </span>
                      </div>

                      {/* Row 2: Subject */}
                      <div className="text-xs text-slate-500 truncate mb-1">
                        {thread.subject || "(no subject)"}
                      </div>

                      {/* Row 3: AI summary */}
                      {summary && (
                        <div className="text-xs text-slate-500 truncate mb-1.5 italic">
                          {summary}
                        </div>
                      )}

                      {/* Row 4: Intent badge */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {intentBadge(intent)}
                        {thread.needsReply && urgencyBadge(urgency || "medium")}
                        {thread.needsReply && <Badge tone="danger">needs reply</Badge>}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Right Panel - Thread Detail */}
        <Card className={cn("lg:col-span-3 flex flex-col lg:min-h-0 min-h-[50vh]", selectedId ? "flex" : "hidden lg:flex")}>
          {selectedId && detail ? (
            detailLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Spinner label="Loading thread" />
              </div>
            ) : (
              <>
                {/* Thread Header */}
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 lg:hidden -ml-2"
                          aria-label="Back to threads"
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
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {detail.needsReply && <Badge tone="danger">Needs Reply</Badge>}
                    </div>
                  </div>
                  {detail.subject && (
                    <div className="text-sm text-slate-600 mt-2">
                      Subject: {detail.subject}
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
                  {[...detail.messages].reverse().map((msg) => (
                    <div key={msg.id}>
                      <div
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
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Classification Panel (collapsible) */}
                {classification && (
                  <div className="border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setClassificationOpen(!classificationOpen)}
                      aria-expanded={classificationOpen}
                      className="w-full flex items-center justify-between px-4 sm:px-6 py-3 text-sm text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-500" aria-hidden />
                        AI Classification
                      </span>
                      {classificationOpen ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
                    </button>
                    {classificationOpen && (
                      <div className="px-4 sm:px-6 pb-4 grid grid-cols-2 gap-3 text-xs">
                        {classification.sender_type && (
                          <div>
                            <span className="text-slate-500">Sender Type</span>
                            <div className="text-slate-700 mt-0.5">{classification.sender_type}</div>
                          </div>
                        )}
                        {classification.intent && (
                          <div>
                            <span className="text-slate-500">Intent</span>
                            <div className="mt-0.5">{intentBadge(classification.intent)}</div>
                          </div>
                        )}
                        {classification.urgency && (
                          <div>
                            <span className="text-slate-500">Urgency</span>
                            <div className="mt-0.5">{urgencyBadge(classification.urgency)}</div>
                          </div>
                        )}
                        {classification.confidence !== undefined && (
                          <div>
                            <span className="text-slate-500">Confidence</span>
                            <div className="text-slate-700 mt-0.5 tabular">
                              {Math.round((classification.confidence || 0) * 100)}%
                            </div>
                          </div>
                        )}
                        {classification.summary && (
                          <div className="col-span-2">
                            <span className="text-slate-500">AI Summary</span>
                            <div className="text-slate-600 mt-0.5">{classification.summary}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="px-4 py-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                  <Button
                    variant="primary"
                    icon={<Sparkles size={14} />}
                    loading={generating}
                    onClick={handleGenerateDraft}
                  >
                    {generating ? "Generating" : "Generate Draft"}
                  </Button>
                  <a
                    href="/admin/concierge/contacts"
                    className={buttonVariants({ variant: "secondary" })}
                  >
                    <ExternalLink size={14} aria-hidden />
                    View Contact
                  </a>
                  {detail.pendingDraft && (
                    <Badge tone="warning" className="ml-auto">
                      <AlertCircle size={12} aria-hidden />
                      Pending draft available
                    </Badge>
                  )}
                </div>
              </>
            )
          ) : selectedId && detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Spinner label="Loading thread" />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                title="Select a thread to view the conversation"
                icon={<Mail size={28} className="mx-auto" aria-hidden />}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
