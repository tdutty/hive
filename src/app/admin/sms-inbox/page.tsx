"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { sweetleaseApi } from "@/lib/api";
import { usePolling } from "@/lib/hooks";
import { ErrorBanner, Spinner } from "@/components/ui/AsyncState";
import { RefreshCw, Send, MessageSquare, Phone, MapPin } from "lucide-react";

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
    <div className="h-[calc(100dvh-7rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 flex items-center gap-3">
            <MessageSquare size={24} className="text-amber-500" />
            SMS Inbox
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-red-600 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Landlord text conversations</p>
        </div>
        <button
          onClick={fetchConversations}
          className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-500 hover:text-slate-900 rounded-lg text-sm transition"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <ErrorBanner message={error} onRetry={fetchConversations} className="mb-4" />
      )}

      <div className="flex gap-4 h-[calc(100%-80px)]">
        {/* Conversation List */}
        <div className="w-80 max-w-[calc(100vw-2rem)] shrink-0 bg-white border border-slate-200 rounded-lg overflow-y-auto">
          {loading ? (
            <Spinner />
          ) : error && conversations.length === 0 ? null : conversations.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              No SMS conversations yet. Outreach texts will appear here when sent.
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected =
                selected?.phone.replace(/\D/g, "").slice(-10) ===
                conv.phone.replace(/\D/g, "").slice(-10);
              const lastMsg = conv.messages[0];
              return (
                <div
                  key={conv.phone}
                  onClick={() => setSelected(conv)}
                  className={`px-4 py-3 border-b border-slate-200 cursor-pointer transition ${
                    isSelected
                      ? "bg-slate-50 border-l-2 border-l-amber-500"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-900 truncate flex items-center gap-2">
                      {conv.hasUnread && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      )}
                      {conv.ownerName || conv.phone}
                    </span>
                    <span className="text-xs text-slate-500 shrink-0">
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  {conv.address && (
                    <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                      <MapPin size={8} />
                      {conv.address}
                    </div>
                  )}
                  <div className="text-xs text-slate-500 truncate">
                    {lastMsg?.direction === "outbound" ? "You: " : ""}
                    {lastMsg?.body}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Thread */}
        <div className="flex-1 bg-white border border-slate-200 rounded-lg flex flex-col">
          {selected ? (
            <>
              {/* Thread Header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-slate-900 font-medium">
                    {selected.ownerName || selected.phone}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Phone size={10} />
                      {selected.phone}
                    </span>
                    {selected.address && (
                      <span className="flex items-center gap-1">
                        <MapPin size={10} />
                        {selected.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {[...selected.messages].reverse().map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] px-4 py-2.5 rounded-xl text-sm ${
                        msg.direction === "outbound"
                          ? "bg-amber-600 text-white rounded-br-sm"
                          : "bg-slate-50 text-slate-700 rounded-bl-sm"
                      }`}
                    >
                      <div>{msg.body}</div>
                      <div
                        className={`text-xs mt-1 ${
                          msg.direction === "outbound" ? "text-amber-200" : "text-slate-500"
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
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
                    placeholder="Type a reply..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !reply.trim()}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                  >
                    <Send size={14} />
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              Select a conversation to view messages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
