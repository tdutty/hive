import { api } from "@/lib/api";

export type ThreadState = "OPEN" | "RESOLVED" | "ARCHIVED";
export type Classification = "CONSENTED" | "SENT_INVENTORY" | "INTERESTED" | "DECLINED" | "AUTO" | "OTHER";
export interface Message { id: string; direction: "in" | "out"; from: string; to: string; subject: string; at: string; text: string; campaign: string }
export interface Draft { token: string; status: string; channel: string; draft: string; reply_text: string; created?: string; sent_at?: string; sent_by?: string; notes_history: string[] }
export interface Conversation {
  pm_email: string; company: string; campaign: string; classification: Classification; consent: string | null;
  pmCompanyId: string | null; city: string | null; lastInboundAt: string | null; lastOutboundAt: string | null;
  inboundCount: number; outboundCount: number; awaitingReply: boolean;
  state: ThreadState; stateNote: string | null; stateAt: string | null; reopened: boolean;
  staged: { total: number; needsReview: number } | null; drafts: Draft[]; pendingDraft: Draft | null; preview: string; messages?: Message[];
}
export interface ConversationList { count: number; total: number; awaitingReply: number; counts: Record<string, number>; states: Record<ThreadState, number>; conversations: Conversation[] }
export interface ScheduledRow { id: string; status: "waiting" | "active" | "completed" | "failed"; scheduledFor: string; attempts: number; error: string | null; createdAt: string; pm_email: string; company: string; subject: string; text: string; scheduledBy: string }
export interface ScheduledList { count: number; waiting: number; rows: ScheduledRow[] }

const conv = (pm: string) => `/api/admin/triage/conversations/${encodeURIComponent(pm)}`;

export const triageService = {
  list: (fresh = false) => api.get<ConversationList>("/api/admin/triage/conversations", fresh ? { fresh: 1 } : undefined),
  thread: (pm: string) => api.get<Conversation>(conv(pm)),
  send: (pm: string, token: string, finalDraft?: string) => api.post<{ ok: boolean; sent_at?: string; error?: string }>(conv(pm), { action: "send", token, finalDraft }),
  redraft: (pm: string, token: string, notes: string) => api.post<{ ok: boolean; draft?: string; error?: string }>(conv(pm), { action: "redraft", token, notes }),
  setState: (pm: string, state: ThreadState, note?: string) => api.post<{ ok: boolean; state?: ThreadState; error?: string }>(conv(pm), { action: "state", state, note }),
  consent: (pm: string, stage: string) => api.post<{ ok: boolean }>(conv(pm), { action: "consent", stage }),
  // compose + schedule (new in-thread messages originated from the admin tool)
  compose: (pm: string, instructions: string, previous?: string) => api.post<{ ok: boolean; draft?: string; error?: string }>(conv(pm), { action: "compose", instructions, previous }),
  sendNow: (pm: string, text: string, instructions?: string) => api.post<{ ok: boolean; sent_at?: string; error?: string }>(conv(pm), { action: "sendNow", text, instructions }),
  schedule: (pm: string, text: string, sendAt: string, instructions?: string) => api.post<{ ok: boolean; jobId?: string; scheduledFor?: string; error?: string }>(conv(pm), { action: "schedule", text, sendAt, instructions }),
  scheduled: () => api.get<ScheduledList>("/api/admin/triage/scheduled"),
  cancel: (id: string) => api.delete<{ ok: boolean; error?: string }>(`/api/admin/triage/scheduled/${encodeURIComponent(id)}`),
};
