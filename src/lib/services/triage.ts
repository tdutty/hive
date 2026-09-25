import { api } from "@/lib/api";

export type Classification = "CONSENTED" | "SENT_INVENTORY" | "INTERESTED" | "DECLINED" | "AUTO" | "OTHER";
export interface Message { id: string; direction: "in" | "out"; from: string; to: string; subject: string; at: string; text: string; campaign: string }
export interface Draft { token: string; status: string; channel: string; draft: string; reply_text: string; created?: string; sent_at?: string; sent_by?: string; notes_history: string[] }
export interface Conversation {
  pm_email: string; company: string; campaign: string; classification: Classification; consent: string | null;
  pmCompanyId: string | null; city: string | null; lastInboundAt: string | null; lastOutboundAt: string | null;
  inboundCount: number; outboundCount: number; awaitingReply: boolean;
  staged: { total: number; needsReview: number } | null; drafts: Draft[]; pendingDraft: Draft | null; preview: string; messages?: Message[];
}
export interface ConversationList { count: number; awaitingReply: number; counts: Record<string, number>; conversations: Conversation[] }

export const triageService = {
  list: () => api.get<ConversationList>("/api/admin/triage/conversations"),
  thread: (pm: string) => api.get<Conversation>(`/api/admin/triage/conversations/${encodeURIComponent(pm)}`),
  send: (pm: string, token: string, finalDraft?: string) => api.post<{ ok: boolean; sent_at?: string; error?: string }>(`/api/admin/triage/conversations/${encodeURIComponent(pm)}`, { action: "send", token, finalDraft }),
  redraft: (pm: string, token: string, notes: string) => api.post<{ ok: boolean; draft?: string; error?: string }>(`/api/admin/triage/conversations/${encodeURIComponent(pm)}`, { action: "redraft", token, notes }),
  consent: (pm: string, stage: string) => api.post<{ ok: boolean }>(`/api/admin/triage/conversations/${encodeURIComponent(pm)}`, { action: "consent", stage }),
};
