"use client";

import { useState, useEffect, useRef } from "react";
import { sweetleaseApi } from "@/lib/api";
import {
  RefreshCw,
  Mail,
  MessageSquare,
  ChevronDown,
  ChevronRight,
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

function priorityBadge(score: number) {
  if (score >= 70) {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
        Hot
      </span>
    );
  }
  if (score >= 40) {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
        Warm
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400">
      Cool
    </span>
  );
}

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "bg-green-500";
  if (confidence >= 0.5) return "bg-amber-500";
  return "bg-red-500";
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "High";
  if (confidence >= 0.5) return "Medium";
  return "Low";
}

// --- Component ---

export default function ConciergeDraftsPage() {
  const [drafts, setDrafts] = useState<DraftListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DraftDetail | null>(null);
  const [loading, setLoading] = useState(true);
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
    } catch (err) {
      console.error("Failed to fetch drafts:", err);
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
    } catch (err) {
      console.error("Failed to fetch draft detail:", err);
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
      window.alert("Draft approved and sent successfully.");
      selectNext(detail.id);
    } catch (err) {
      console.error("Approve failed:", err);
      window.alert("Failed to approve and send draft.");
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
      window.alert("Draft edited and sent successfully.");
      selectNext(detail.id);
    } catch (err) {
      console.error("Edit & send failed:", err);
      window.alert("Failed to edit and send draft.");
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
      window.alert("Draft regenerated.");
    } catch (err) {
      console.error("Regenerate failed:", err);
      window.alert("Failed to regenerate draft.");
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
      window.alert("Draft rejected.");
      selectNext(detail.id);
    } catch (err) {
      console.error("Reject failed:", err);
      window.alert("Failed to reject draft.");
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchDrafts();
    const interval = setInterval(fetchDrafts, 30000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="p-6 h-[calc(100vh-48px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText size={24} className="text-amber-500" />
            Approval Queue
            {total > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-red-600 text-white rounded-full">
                {total}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review and approve AI-generated draft replies
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchDrafts(); }}
          className="flex items-center gap-2 px-3 py-2 bg-[#2a2a3e] text-slate-400 hover:text-white rounded-lg text-sm transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex gap-4 h-[calc(100%-80px)]">
        {/* Left Panel - Draft Queue */}
        <div className="w-96 shrink-0 bg-[#1e1e2d] border border-[#2f2f42] rounded-xl overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin text-slate-500" size={20} />
            </div>
          ) : drafts.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              No pending drafts. All caught up!
            </div>
          ) : (
            drafts.map((draft) => {
              const isSelected = selectedId === draft.id;
              return (
                <div
                  key={draft.id}
                  onClick={() => setSelectedId(draft.id)}
                  className={`px-4 py-3 border-b border-[#2f2f42] cursor-pointer transition ${
                    isSelected
                      ? "bg-[#2a2a3e] border-l-2 border-l-amber-500"
                      : "hover:bg-[#252538]"
                  }`}
                >
                  {/* Row 1: Priority + Name + Type + Time */}
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {priorityBadge(draft.priorityScore)}
                      <span className="text-sm font-medium text-white truncate">
                        {draft.contact.name}
                      </span>
                      {contactTypeBadge(draft.contact.type)}
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {relativeTime(draft.createdAt)}
                    </span>
                  </div>

                  {/* Row 2: Subject + Channel icon */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {draft.channel === "EMAIL" ? (
                      <Mail size={11} className="text-slate-500 shrink-0" />
                    ) : (
                      <MessageSquare size={11} className="text-slate-500 shrink-0" />
                    )}
                    <span className="text-xs text-slate-400 truncate">
                      {draft.threadSubject || draft.subject || "(no subject)"}
                    </span>
                  </div>

                  {/* Row 3: Confidence bar */}
                  <div className="h-1 w-full bg-[#2f2f42] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${confidenceColor(draft.confidence)}`}
                      style={{ width: `${Math.round(draft.confidence * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Panel - Draft Detail */}
        <div className="flex-1 bg-[#1e1e2d] border border-[#2f2f42] rounded-xl flex flex-col">
          {selectedId && detail && !detailLoading ? (
            <>
              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                {/* Section 1: Contact Header */}
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
                        {detail.contact.currentDealStage && (
                          <span className="flex items-center gap-1">
                            <Circle size={8} />
                            {detail.contact.currentDealStage}
                          </span>
                        )}
                      </div>
                    </div>
                    <a
                      href={`/admin/concierge/contacts/${detail.contactId}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2a3e] text-slate-400 hover:text-white rounded-lg text-xs transition"
                    >
                      <ExternalLink size={12} />
                      View Contact
                    </a>
                  </div>
                </div>

                {/* Section 2: Thread Context (collapsible, collapsed by default) */}
                <div className="border-b border-[#2f2f42]">
                  <button
                    onClick={() => setThreadOpen(!threadOpen)}
                    className="w-full flex items-center justify-between px-6 py-3 text-sm text-slate-400 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-500" />
                      Thread Context ({detail.thread?.messages?.length || 0} messages)
                    </span>
                    {threadOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {threadOpen && detail.thread?.messages && (
                    <div className="px-6 pb-4 space-y-3">
                      {detail.thread.messages.map((msg) => (
                        <div
                          key={msg.id}
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
                      ))}
                    </div>
                  )}
                </div>

                {/* Section 3: AI Draft (editable) */}
                <div className="px-6 py-4 border-b border-[#2f2f42]">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-amber-500" />
                    <span className="text-sm font-medium text-white">AI Draft</span>
                    {hasEdits && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                        edited
                      </span>
                    )}
                  </div>

                  {/* Subject line (email only) */}
                  {detail.channel === "EMAIL" && (
                    <div className="mb-3">
                      <label className="text-xs text-slate-500 mb-1 block">Subject</label>
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="w-full px-3 py-2 bg-[#2a2a3e] border border-[#3f3f52] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  {/* Body */}
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Body</label>
                    <textarea
                      ref={bodyRef}
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="w-full px-3 py-2 bg-[#2a2a3e] border border-[#3f3f52] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none min-h-[120px] leading-relaxed"
                    />
                    {detail.channel === "SMS" && (
                      <div className="text-[10px] text-slate-500 mt-1 text-right">
                        {editBody.length} characters
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 4: AI Reasoning (collapsible) */}
                <div className="border-b border-[#2f2f42]">
                  <button
                    onClick={() => setReasoningOpen(!reasoningOpen)}
                    className="w-full flex items-center justify-between px-6 py-3 text-sm text-slate-400 hover:text-white transition"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles size={14} className="text-amber-500" />
                      AI Reasoning
                    </span>
                    {reasoningOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {reasoningOpen && (
                    <div className="px-6 pb-4 space-y-3">
                      {/* Reasoning text */}
                      {detail.reasoning && (
                        <div className="text-sm text-slate-300 leading-relaxed bg-[#2a2a3e] rounded-lg px-4 py-3">
                          {detail.reasoning}
                        </div>
                      )}

                      {/* Risk flags */}
                      {detail.riskFlags && detail.riskFlags.length > 0 && (
                        <div>
                          <span className="text-xs text-slate-500 mb-1.5 block">Risk Flags</span>
                          <div className="flex flex-wrap gap-1.5">
                            {detail.riskFlags.map((flag, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-medium px-2 py-1 rounded bg-red-500/20 text-red-400 flex items-center gap-1"
                              >
                                <AlertTriangle size={10} />
                                {flag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Confidence */}
                      <div>
                        <span className="text-xs text-slate-500 mb-1.5 block">Confidence</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-32 bg-[#2f2f42] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${confidenceColor(detail.confidence)}`}
                              style={{ width: `${Math.round(detail.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-300">
                            {Math.round(detail.confidence * 100)}% - {confidenceLabel(detail.confidence)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 5: Open Commitments */}
                {detail.commitments && detail.commitments.length > 0 && (
                  <div className="px-6 py-4 border-b border-[#2f2f42]">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={16} className="text-slate-400" />
                      <span className="text-sm font-medium text-white">
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
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                              isOverdue
                                ? "bg-red-500/10 border border-red-500/30"
                                : "bg-[#2a2a3e] border border-[#3f3f52]"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  c.owner === "US"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-blue-500/20 text-blue-400"
                                }`}
                              >
                                {c.owner === "US" ? "Us" : "Them"}
                              </span>
                              <span className={`truncate ${isOverdue ? "text-red-300" : "text-slate-300"}`}>
                                {c.description}
                              </span>
                            </div>
                            {c.dueDate && (
                              <span className={`text-[10px] shrink-0 ml-2 ${isOverdue ? "text-red-400 font-medium" : "text-slate-500"}`}>
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
              <div className="px-4 py-3 border-t border-[#2f2f42] flex items-center gap-3 shrink-0 bg-[#1e1e2d]">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 text-sm font-medium"
                >
                  <Send size={14} />
                  {actionLoading === "approve" ? "Sending..." : "Approve & Send"}
                </button>

                {hasEdits && (
                  <button
                    onClick={handleEditSend}
                    disabled={actionLoading !== null}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition disabled:opacity-50 text-sm font-medium"
                  >
                    <Send size={14} />
                    {actionLoading === "edit" ? "Sending..." : "Edit & Send"}
                  </button>
                )}

                <button
                  onClick={handleRegenerate}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-2 px-4 py-2.5 bg-transparent border border-[#3f3f52] text-slate-400 hover:text-white hover:border-slate-400 rounded-lg transition disabled:opacity-50 text-sm font-medium"
                >
                  <RotateCcw size={14} />
                  {actionLoading === "regenerate" ? "Generating..." : "Regenerate"}
                </button>

                <button
                  onClick={handleReject}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-2 px-4 py-2.5 bg-transparent border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50 text-sm font-medium ml-auto"
                >
                  <X size={14} />
                  {actionLoading === "reject" ? "Rejecting..." : "Reject"}
                </button>
              </div>
            </>
          ) : selectedId && detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <RefreshCw className="animate-spin text-slate-500" size={20} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
              <FileText size={32} className="text-slate-600" />
              Select a draft to review
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
