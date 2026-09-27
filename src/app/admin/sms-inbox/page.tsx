"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { sweetleaseApi } from "@/lib/api";
import { usePolling } from "@/lib/hooks";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { Button, Card, Badge, PageHeader, Input } from "@/components/kit";
import { RefreshCw, Send, MessageSquare, Phone, MapPin, ArrowLeft } from "lucide-react";

interface SmsMessage {
  id: string;
  direction: "inbound" | "outbound";
  from: string;
  to: string;
  body: string;
  ownerName: string | null;
  address: string | null;
  status: string;
  createdAt: string;
}

interface Conversation {
  phone: string;
  ownerName: string | null;
  address: string | null;
  listingId: string | null;
  messages: SmsMessage[];
  lastMessageAt: string;
  hasUnread: boolean;
}

export default function SmsInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const data = await sweetleaseApi.get<{ conversations: Conversation[] }>("/api/admin/sms");
      setConversations(data.conversations);
      setError(null);
      // Update the open conversation so it picks up new messages on every poll
      setSelected((prev) => {
        if (!prev) return prev;
        const updated = data.conversations.find(
          (c) => c.phone.replace(/\D/g, "").slice(-10) === prev.phone.replace(/\D/g, "").slice(-10)
        );
        return updated || prev;
      });
    } catch (err: any) {
      setError(err?.message || "Failed to fetch SMS conversations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  usePolling(fetchConversations, 15000);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages]);

  const handleSendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      await sweetleaseApi.post("/api/admin/sms", { to: selected.phone, body: reply });
      setReply("");
      await fetchConversations();
    } catch (err: any) {
      toast.error("Failed to send", { description: err?.data?.error || err?.message });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const unreadCount = conversations.filter((c) => c.hasUnread).length;

  return (
    <div className="max-w-7xl h-[calc(100dvh-7rem)] flex flex-col">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <MessageSquare size={18} className="text-amber-600" aria-hidden />
            SMS Inbox
            {unreadCount > 0 && <Badge tone="accent">{unreadCount}</Badge>}
          </span>
        }
        description="Landlord text conversations"
        actions={
          <Button variant="ghost" size="icon" aria-label="Refresh" onClick={fetchConversations}>
            <RefreshCw size={15} />
          </Button>
        }
      />

      {error && (
        <ErrorBanner message={error} onRetry={fetchConversations} className="mb-4" />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
        {/* Conversation List */}
        <Card className={`lg:col-span-2 min-h-0 overflow-y-auto ${selected ? "hidden lg:block" : ""}`}>
          {loading ? (
            <Spinner />
          ) : error && conversations.length === 0 ? null : conversations.length === 0 ? (
            <EmptyState title="No SMS conversations yet" hint="Outreach texts will appear here when sent." />
          ) : (
            <div className="divide-y divide-slate-100">
              {conversations.map((conv) => {
                const isSelected =
                  selected?.phone.replace(/\D/g, "").slice(-10) ===
                  conv.phone.replace(/\D/g, "").slice(-10);
                const lastMsg = conv.messages[0];
                return (
                  <button
                    key={conv.phone}
                    onClick={() => setSelected(conv)}
                    className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:bg-slate-50 ${isSelected ? "bg-amber-50" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-900 truncate inline-flex items-center gap-2 min-w-0">
                        {conv.hasUnread && (
                          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" aria-label="Unread" />
                        )}
                        <span className="truncate">{conv.ownerName || conv.phone}</span>
                      </span>
                      <span className="text-xs text-slate-500 tabular shrink-0">
                        {formatTime(conv.lastMessageAt)}
                      </span>
                    </div>
                    {conv.address && (
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin size={11} aria-hidden className="shrink-0" />
                        <span className="truncate">{conv.address}</span>
                      </div>
                    )}
                    <div className="text-xs text-slate-600 truncate mt-0.5">
                      {lastMsg?.direction === "outbound" ? "You: " : ""}
                      {lastMsg?.body}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Message Thread */}
        <Card className={`lg:col-span-3 min-h-0 flex flex-col ${selected ? "" : "hidden lg:flex"}`}>
          {selected ? (
            <>
              {/* Thread Header */}
              <div className="px-4 py-3 border-b border-slate-200">
                <button onClick={() => setSelected(null)} className="lg:hidden mb-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900">
                  <ArrowLeft size={13} aria-hidden /> All conversations
                </button>
                <h2 className="text-md font-semibold text-slate-900 break-words">
                  {selected.ownerName || selected.phone}
                </h2>
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Phone size={11} aria-hidden />
                    {selected.phone}
                  </span>
                  {selected.address && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={11} aria-hidden />
                      {selected.address}
                    </span>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
                {[...selected.messages].reverse().map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                        msg.direction === "outbound"
                          ? "bg-amber-600 text-white rounded-br-sm"
                          : "bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-sm"
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-5">{msg.body}</div>
                      <div
                        className={`text-xs mt-1 tabular ${
                          msg.direction === "outbound" ? "text-amber-100" : "text-slate-500"
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <div className="px-4 py-3 border-t border-slate-200">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    aria-label="Reply"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
                    placeholder="Type a reply..."
                    className="flex-1"
                  />
                  <Button
                    variant="primary"
                    icon={<Send size={14} />}
                    onClick={handleSendReply}
                    loading={sending}
                    disabled={sending || !reply.trim()}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="Select a conversation" hint="Messages and the reply box show here." />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
