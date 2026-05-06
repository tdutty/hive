"use client";

import { useState, useEffect, useRef } from "react";
import { sweetleaseApi } from "@/lib/api";
import {
  RefreshCw,
  Inbox,
  Mail,
  AlertCircle,
  ChevronDown,
  ChevronRight,
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
  const styles: Record<string, string> = {
    LANDLORD: "bg-blue-500/20 text-blue-400",
    RESIDENT: "bg-green-500/20 text-green-400",
    PARTNER: "bg-purple-500/20 text-purple-400",
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${styles[type] || "bg-slate-500/20 text-slate-400"}`}>
      {type}
    </span>
  );
}

function intentBadge(intent: string | null | undefined) {
  if (!intent) return null;
  const styles: Record<string, string> = {
    pricing_question: "bg-amber-500/20 text-amber-400",
    ready_to_proceed: "bg-green-500/20 text-green-400",
    objection: "bg-red-500/20 text-red-400",
    scheduling: "bg-blue-500/20 text-blue-400",
    general_inquiry: "bg-slate-500/20 text-slate-400",
    follow_up: "bg-cyan-500/20 text-cyan-400",
    complaint: "bg-red-500/20 text-red-400",
    information_request: "bg-indigo-500/20 text-indigo-400",
  };
  const label = intent.replace(/_/g, " ");
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${styles[intent] || "bg-slate-500/20 text-slate-400"}`}>
      {label}
    </span>
  );
}

function urgencyDot(urgency: string | null | undefined) {
  if (!urgency) return null;
  const colors: Record<string, string> = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-slate-500",
  };
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${colors[urgency] || "bg-slate-500"}`}
      title={`${urgency} urgency`}
    />
  );
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
  const [detailLoading, setDetailLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<"all" | "needs_reply" | "high_priority">("all");
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
    } catch (err) {
      console.error("Failed to fetch threads:", err);
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
    } catch (err) {
      console.error("Failed to fetch thread detail:", err);
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
    } catch (err) {
      console.error("Poll failed:", err);
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
    } catch (err) {
      console.error("Draft generation failed:", err);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 30000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="p-6 h-[calc(100vh-48px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Inbox size={24} className="text-amber-500" />
            Concierge Inbox
            {stats.needsReply > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-red-600 text-white rounded-full">
                {stats.needsReply}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {stats.total} threads - {stats.needsReply} needs reply - {stats.unread} unread
          </p>
        </div>
        <button
          onClick={handlePoll}
          disabled={polling}
          className="flex items-center gap-2 px-3 py-2 bg-[#2a2a3e] text-slate-400 hover:text-white rounded-lg text-sm transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={polling ? "animate-spin" : ""} />
          {polling ? "Polling..." : "Poll Now"}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-4">
        {(
          [
            { key: "all", label: "All" },
            { key: "needs_reply", label: "Needs Reply" },
            { key: "high_priority", label: "High Priority" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              filter === tab.key
                ? "bg-amber-600 text-white"
                : "bg-[#2a2a3e] text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex gap-4 h-[calc(100%-120px)]">
        {/* Left Panel - Thread List */}
        <div className="w-96 shrink-0 bg-[#1e1e2d] border border-[#2f2f42] rounded-xl overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin text-slate-500" size={20} />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              {filter === "all"
                ? "No email threads yet. Click Poll Now to check for new emails."
                : `No ${filter === "needs_reply" ? "threads needing reply" : "high priority threads"}.`}
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isSelected = selectedId === thread.id;
              const cls = getClassification(thread);
              const summary = cls?.summary || null;
              const intent = cls?.intent || null;
              const urgency = cls?.urgency || null;

              return (
                <div
                  key={thread.id}
                  onClick={() => setSelectedId(thread.id)}
                  className={`px-4 py-3 border-b border-[#2f2f42] cursor-pointer transition ${
                    isSelected
                      ? "bg-[#2a2a3e] border-l-2 border-l-amber-500"
                      : "hover:bg-[#252538]"
                  }`}
                >
                  {/* Row 1: Name + type badge + time */}
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {thread.needsReply && urgencyDot(urgency || "medium")}
                      <span
                        className={`text-sm truncate ${
                          thread.needsReply ? "font-semibold text-white" : "font-medium text-slate-300"
                        }`}
                      >
                        {thread.contact.name}
                      </span>
                      {contactTypeBadge(thread.contact.type)}
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {relativeTime(thread.lastMessageAt)}
                    </span>
                  </div>

                  {/* Row 2: Subject */}
                  <div className="text-xs text-slate-400 truncate mb-1">
                    {thread.subject || "(no subject)"}
                  </div>

                  {/* Row 3: AI summary */}
                  {summary && (
                    <div className="text-[11px] text-slate-500 truncate mb-1.5 italic">
                      {summary}
                    </div>
                  )}

                  {/* Row 4: Intent badge */}
                  <div className="flex items-center gap-1.5">
                    {intentBadge(intent)}
                    {thread.needsReply && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                        needs reply
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Panel - Thread Detail */}
        <div className="flex-1 bg-[#1e1e2d] border border-[#2f2f42] rounded-xl flex flex-col">
          {selectedId && detail ? (
            detailLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <RefreshCw className="animate-spin text-slate-500" size={20} />
              </div>
            ) : (
              <>
                {/* Thread Header */}
                <div className="px-6 py-4 border-b border-[#2f2f42]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium text-lg">
                          {detail.contact.name}
                        </span>
                        {contactTypeBadge(detail.contact.type)}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3">
                        {detail.contact.primaryEmail && (
                          <span className="flex items-center gap-1">
                            <Mail size={10} />
                            {detail.contact.primaryEmail}
                          </span>
                        )}
                        {detail.contact.market && (
                          <span className="flex items-center gap-1">
                            <Circle size={8} />
                            {detail.contact.market}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {detail.needsReply && (
                        <span className="text-[10px] font-medium px-2 py-1 rounded bg-red-500/20 text-red-400">
                          Needs Reply
                        </span>
                      )}
                    </div>
                  </div>
                  {detail.subject && (
                    <div className="text-sm text-slate-300 mt-2">
                      Subject: {detail.subject}
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {[...detail.messages].reverse().map((msg) => (
                    <div key={msg.id}>
                      <div
                        className={`rounded-lg px-4 py-3 text-sm ${
                          msg.direction === "OUTBOUND"
                            ? "bg-amber-600/20 border border-amber-600/30"
                            : "bg-[#2a2a3e] border border-[#3f3f52]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-xs font-medium ${
                              msg.direction === "OUTBOUND" ? "text-amber-400" : "text-slate-400"
                            }`}
                          >
                            {msg.direction === "OUTBOUND" ? "SweetLease" : detail.contact.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatDate(msg.sentAt || msg.receivedAt || msg.createdAt)}
                          </span>
                        </div>
                        <div className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                          {msg.body}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Classification Panel (collapsible) */}
                {detail.classification && typeof detail.classification === "object" && (
                  <div className="border-t border-[#2f2f42]">
                    <button
                      onClick={() => setClassificationOpen(!classificationOpen)}
                      className="w-full flex items-center justify-between px-6 py-3 text-sm text-slate-400 hover:text-white transition"
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-500" />
                        AI Classification
                      </span>
                      {classificationOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    {classificationOpen && (
                      <div className="px-6 pb-4 grid grid-cols-2 gap-3 text-xs">
                        {(detail.classification as Record<string, any>).sender_type && (
                          <div>
                            <span className="text-slate-500">Sender Type</span>
                            <div className="text-slate-200 mt-0.5">
                              {(detail.classification as Record<string, any>).sender_type}
                            </div>
                          </div>
                        )}
                        {(detail.classification as Record<string, any>).intent && (
                          <div>
                            <span className="text-slate-500">Intent</span>
                            <div className="mt-0.5">
                              {intentBadge((detail.classification as Record<string, any>).intent)}
                            </div>
                          </div>
                        )}
                        {(detail.classification as Record<string, any>).urgency && (
                          <div>
                            <span className="text-slate-500">Urgency</span>
                            <div className="text-slate-200 mt-0.5 flex items-center gap-1.5">
                              {urgencyDot((detail.classification as Record<string, any>).urgency)}
                              <span className="capitalize">
                                {(detail.classification as Record<string, any>).urgency}
                              </span>
                            </div>
                          </div>
                        )}
                        {(detail.classification as Record<string, any>).confidence !== undefined && (
                          <div>
                            <span className="text-slate-500">Confidence</span>
                            <div className="text-slate-200 mt-0.5">
                              {Math.round(
                                ((detail.classification as Record<string, any>).confidence || 0) * 100
                              )}
                              %
                            </div>
                          </div>
                        )}
                        {(detail.classification as Record<string, any>).summary && (
                          <div className="col-span-2">
                            <span className="text-slate-500">AI Summary</span>
                            <div className="text-slate-300 mt-0.5">
                              {(detail.classification as Record<string, any>).summary}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="px-4 py-3 border-t border-[#2f2f42] flex items-center gap-3">
                  <button
                    onClick={handleGenerateDraft}
                    disabled={generating}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition disabled:opacity-50 text-sm font-medium"
                  >
                    <Sparkles size={14} />
                    {generating ? "Generating..." : "Generate Draft"}
                  </button>
                  <a
                    href="/admin/concierge/contacts"
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#2a2a3e] text-slate-400 hover:text-white rounded-lg transition text-sm"
                  >
                    <ExternalLink size={14} />
                    View Contact
                  </a>
                  {detail.pendingDraft && (
                    <span className="text-xs text-amber-400 ml-auto flex items-center gap-1">
                      <AlertCircle size={12} />
                      Pending draft available
                    </span>
                  )}
                </div>
              </>
            )
          ) : selectedId && detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <RefreshCw className="animate-spin text-slate-500" size={20} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <Mail size={32} className="text-slate-600" />
              Select a thread to view the conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
