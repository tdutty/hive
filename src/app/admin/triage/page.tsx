"use client";

import { useEffect, useState } from "react";
import { Inbox, Send, RefreshCw, CheckCircle2, XCircle, Link2, HelpCircle, Bot, MessageSquare, Sparkles, CalendarClock, Trash2, PenLine } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { triageService, type Conversation, type Classification, type ScheduledRow } from "@/lib/services/triage";

const CLS: Record<Classification, { label: string; cls: string; icon: JSX.Element }> = {
  CONSENTED: { label: "Consented", cls: "bg-emerald-100 text-emerald-800", icon: <CheckCircle2 size={14} /> },
  SENT_INVENTORY: { label: "Sent inventory", cls: "bg-sky-100 text-sky-800", icon: <Link2 size={14} /> },
  INTERESTED: { label: "Interested", cls: "bg-amber-100 text-amber-800", icon: <HelpCircle size={14} /> },
  DECLINED: { label: "Declined", cls: "bg-slate-200 text-slate-700", icon: <XCircle size={14} /> },
  AUTO: { label: "Auto-reply", cls: "bg-slate-100 text-slate-500", icon: <Bot size={14} /> },
  OTHER: { label: "Other", cls: "bg-slate-100 text-slate-600", icon: <MessageSquare size={14} /> },
};
const STAGES = ["Lead Drop", "Responded", "Interested", "Consented", "Partnership", "Declined"];
const JOB: Record<ScheduledRow["status"], string> = { waiting: "bg-amber-100 text-amber-800", active: "bg-sky-100 text-sky-800", completed: "bg-emerald-100 text-emerald-800", failed: "bg-red-100 text-red-800" };
const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "-");
/** default schedule slot: next weekday 9:00 local, as a datetime-local value */
function defaultSlot(): string {
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function TriagePage() {
  const { data, loading, error, refetch } = useApi(() => triageService.list());
  const sched = useApi(() => triageService.scheduled());
  const [filter, setFilter] = useState<"actionable" | "all" | Classification>("actionable");
  const [selected, setSelected] = useState<string | null>(null);
  const [thread, setThread] = useState<Conversation | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  // compose state
  const [composeOpen, setComposeOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [composeText, setComposeText] = useState("");
  const [sendAt, setSendAt] = useState(defaultSlot());
  const [showSched, setShowSched] = useState(false);

  useEffect(() => {
    if (!selected) { setThread(null); return; }
    setThreadLoading(true); setComposeOpen(false); setComposeText(""); setInstructions("");
    triageService.thread(selected).then(t => { setThread(t); setDraftText(t.pendingDraft?.draft || ""); setNotes(""); }).finally(() => setThreadLoading(false));
  }, [selected]);

  const rows = (data?.conversations || []).filter(c => filter === "all" ? true : filter === "actionable" ? c.awaitingReply : c.classification === filter);
  const reloadThread = async () => { if (selected) { const t = await triageService.thread(selected); setThread(t); setDraftText(t.pendingDraft?.draft || ""); } };

  const act = async (fn: () => Promise<any>, ok: string, after?: (r: any) => void) => {
    setBusy(ok); setFlash(null);
    try { const r = await fn(); if (r?.error) throw new Error(r.error); setFlash(ok); after?.(r); await reloadThread(); refetch(); sched.refetch(); }
    catch (e: any) { setFlash("Error: " + (e.message || "failed")); }
    finally { setBusy(null); }
  };

  if (loading) return <div className="space-y-8"><h1 className="text-2xl font-semibold text-slate-900">Email Triage</h1><div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /></div></div>;
  if (error) return <div className="space-y-8"><h1 className="text-2xl font-semibold text-slate-900">Email Triage</h1><div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700"><p className="font-medium">Failed to load</p><p className="text-sm mt-1">{error}</p><button onClick={refetch} className="mt-3 bg-red-600 text-white rounded-md px-4 py-2 text-sm">Retry</button></div></div>;

  const waiting = sched.data?.waiting ?? 0;
  const schedRows = (sched.data?.rows || []).filter(r => showSched ? true : r.status === "waiting" || r.status === "active" || r.status === "failed");

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Email Triage</h1>
          <p className="text-sm text-slate-500 mt-1">{data?.count} PM conversations · <span className="font-medium text-amber-700">{data?.awaitingReply} awaiting a reply</span>{waiting > 0 && <> · <span className="font-medium text-sky-700">{waiting} scheduled</span></>}</p>
        </div>
        <button onClick={() => { refetch(); sched.refetch(); }} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"><RefreshCw size={16} /> Refresh</button>
      </div>

      {/* scheduled sends */}
      {(schedRows.length > 0 || showSched) && (
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="font-medium text-slate-900 inline-flex items-center gap-2"><CalendarClock size={16} /> Scheduled sends</h2>
            <button onClick={() => setShowSched(v => !v)} className="text-xs text-slate-500 hover:text-slate-900">{showSched ? "Hide sent history" : "Show sent history (30 days)"}</button>
          </div>
          <div className="divide-y divide-slate-100">
            {schedRows.length === 0 && <div className="px-4 py-3 text-sm text-slate-500">Nothing scheduled.</div>}
            {schedRows.map(r => (
              <div key={r.id} className="px-4 py-3 flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm"><span className="font-medium text-slate-900 truncate">{r.company || r.pm_email}</span><span className={`text-xs px-2 py-0.5 rounded-full ${JOB[r.status]}`}>{r.status}</span></div>
                  <div className="text-xs text-slate-500 mt-0.5">{r.pm_email} · {r.status === "completed" ? "sent" : "sends"} {fmt(r.scheduledFor)}{r.attempts > 0 && r.status !== "completed" ? ` · ${r.attempts} attempt${r.attempts > 1 ? "s" : ""}` : ""}</div>
                  <div className="text-sm text-slate-600 mt-1 line-clamp-2">{r.text}</div>
                  {r.error && <div className="text-xs text-red-600 mt-1">{r.error}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setSelected(r.pm_email)} className="text-xs border border-slate-300 rounded-md px-2 py-1 hover:border-slate-500">Open thread</button>
                  {r.status === "waiting" && <button disabled={busy !== null} onClick={() => act(() => triageService.cancel(r.id), "Cancelled")} className="text-xs border border-red-200 text-red-700 rounded-md px-2 py-1 hover:bg-red-50 inline-flex items-center gap-1 disabled:opacity-50"><Trash2 size={12} /> Cancel</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {([["actionable", `Needs reply (${data?.awaitingReply ?? 0})`], ["all", `All (${data?.count ?? 0})`], ...Object.entries(CLS).map(([k, v]) => [k, `${v.label} (${data?.counts?.[k] ?? 0})`])] as [string, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k as any)} className={`px-3 py-1.5 text-sm rounded-md border ${filter === k ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"}`}>{label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* list */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-[75vh] overflow-y-auto">
          {rows.length === 0 && <div className="p-8 text-center text-slate-500 text-sm"><Inbox className="mx-auto mb-2" size={24} />Nothing here.</div>}
          {rows.map(c => (
            <button key={c.pm_email} onClick={() => setSelected(c.pm_email)} className={`w-full text-left p-4 hover:bg-slate-50 ${selected === c.pm_email ? "bg-amber-50" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-900 truncate">{c.company}</span>
                <span className={`shrink-0 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${CLS[c.classification].cls}`}>{CLS[c.classification].icon}{CLS[c.classification].label}</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 truncate">{c.pm_email}{c.city ? ` · ${c.city}` : ""}</div>
              <div className="text-sm text-slate-600 mt-1 line-clamp-2">{c.preview}</div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                <span>{fmt(c.lastInboundAt)}</span>
                {c.awaitingReply && <span className="text-amber-700 font-medium">awaiting reply</span>}
                {c.pendingDraft && <span className="text-sky-700 font-medium">draft ready</span>}
                {c.staged && <span>{c.staged.total} units staged{c.staged.needsReview ? ` (${c.staged.needsReview} review)` : ""}</span>}
              </div>
            </button>
          ))}
        </div>

        {/* thread + actions */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-lg p-5 max-h-[75vh] overflow-y-auto">
          {!selected && <div className="text-slate-500 text-sm py-20 text-center">Select a conversation to read the full thread and act on it.</div>}
          {selected && threadLoading && <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>}
          {thread && !threadLoading && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{thread.company}</h2>
                  <p className="text-sm text-slate-500">{thread.pm_email}{thread.city ? ` · ${thread.city}` : ""} · {thread.campaign} campaign</p>
                </div>
                <div className="text-right">
                  <label className="text-xs text-slate-500 block mb-1">Consent / stage</label>
                  <select value={thread.consent || ""} disabled={!thread.pmCompanyId || busy !== null} onChange={e => act(() => triageService.consent(thread.pm_email, e.target.value), `Stage set to ${e.target.value}`)} className="text-sm border border-slate-300 rounded-md px-2 py-1">
                    <option value="" disabled>{thread.pmCompanyId ? "set stage" : "no PM record"}</option>
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {flash && <div className={`text-sm rounded-md px-3 py-2 ${flash.startsWith("Error") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{flash}</div>}

              <div className="space-y-3">
                {thread.messages?.map(m => (
                  <div key={m.id} className={`rounded-lg p-3 text-sm ${m.direction === "in" ? "bg-slate-50 border border-slate-200" : "bg-amber-50 border border-amber-100 ml-8"}`}>
                    <div className="flex justify-between text-xs text-slate-500 mb-1"><span className="font-medium">{m.direction === "in" ? thread.company : "Robert (us)"}</span><span>{fmt(m.at)}</span></div>
                    <div className="whitespace-pre-wrap text-slate-800">{m.direction === "in" ? m.text : m.text.slice(0, 600) + (m.text.length > 600 ? " […]" : "")}</div>
                  </div>
                ))}
              </div>

              {thread.pendingDraft ? (
                <div className="border border-sky-200 rounded-lg p-4 bg-sky-50/40 space-y-3">
                  <div className="flex items-center justify-between"><h3 className="font-medium text-slate-900">Proposed reply</h3><span className="text-xs text-slate-500">from {thread.pendingDraft.channel === "smtp" ? "tgilbert@" : "sweetleasepartners inbox"}</span></div>
                  {thread.pendingDraft.notes_history.length > 0 && <p className="text-xs text-slate-500">Revised {thread.pendingDraft.notes_history.length}× - last note: “{thread.pendingDraft.notes_history.slice(-1)[0]}”</p>}
                  <textarea value={draftText} onChange={e => setDraftText(e.target.value)} rows={12} className="w-full text-sm border border-slate-300 rounded-md p-3 font-sans" />
                  <div className="flex flex-wrap items-center gap-3">
                    <button disabled={busy !== null} onClick={() => act(() => triageService.send(thread.pm_email, thread.pendingDraft!.token, draftText), "Sent")} className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"><Send size={14} /> {busy === "Sent" ? "Sending…" : "Send it"}</button>
                    <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes for a revision…" className="flex-1 min-w-[200px] text-sm border border-slate-300 rounded-md px-3 py-2" />
                    <button disabled={busy !== null || !notes.trim()} onClick={() => act(() => triageService.redraft(thread.pm_email, thread.pendingDraft!.token, notes), "Redrafted")} className="inline-flex items-center gap-2 border border-slate-300 rounded-md px-4 py-2 text-sm disabled:opacity-50"><RefreshCw size={14} /> {busy === "Redrafted" ? "Redrafting…" : "Redraft"}</button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500 border border-dashed border-slate-200 rounded-lg p-4">
                  {thread.awaitingReply ? "Awaiting reply, but no draft is queued yet - the pipeline drafts within ~10 minutes of a new inbound." : thread.drafts.length ? `Last message sent ${fmt(thread.drafts.filter(d => d.status === "sent").slice(-1)[0]?.sent_at)}${thread.drafts.filter(d => d.status === "sent").slice(-1)[0]?.sent_by ? " via " + thread.drafts.filter(d => d.status === "sent").slice(-1)[0]?.sent_by : ""}.` : "No reply needed."}
                </div>
              )}

              {/* compose a new in-thread message */}
              {!composeOpen ? (
                <button onClick={() => setComposeOpen(true)} className="inline-flex items-center gap-2 text-sm border border-slate-300 rounded-md px-3 py-2 hover:border-slate-500"><PenLine size={14} /> Write a new message in this thread</button>
              ) : (
                <div className="border border-violet-200 rounded-lg p-4 bg-violet-50/30 space-y-3">
                  <div className="flex items-center justify-between"><h3 className="font-medium text-slate-900">New message</h3><span className="text-xs text-slate-500">sends in this thread from the sweetleasepartners inbox, as Robert</span></div>
                  <div className="flex gap-2">
                    <input value={instructions} onChange={e => setInstructions(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && instructions.trim() && busy === null) act(() => triageService.compose(thread.pm_email, instructions, composeText || undefined), composeText ? "Redrafted" : "Drafted", r => setComposeText(r.draft || "")); }} placeholder='Tell the AI what to say, e.g. "check in on the March units, ask if the 2-beds are still open"' className="flex-1 text-sm border border-slate-300 rounded-md px-3 py-2" />
                    <button disabled={busy !== null || !instructions.trim()} onClick={() => act(() => triageService.compose(thread.pm_email, instructions, composeText || undefined), composeText ? "Redrafted" : "Drafted", r => setComposeText(r.draft || ""))} className="inline-flex items-center gap-2 bg-violet-700 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"><Sparkles size={14} /> {busy === "Drafted" || busy === "Redrafted" ? "Drafting…" : composeText ? "Redraft" : "Draft with AI"}</button>
                  </div>
                  <textarea value={composeText} onChange={e => setComposeText(e.target.value)} rows={10} placeholder="The draft appears here. Edit freely before sending, or type your own message." className="w-full text-sm border border-slate-300 rounded-md p-3 font-sans" />
                  <div className="flex flex-wrap items-center gap-3">
                    <button disabled={busy !== null || !composeText.trim()} onClick={() => act(() => triageService.sendNow(thread.pm_email, composeText, instructions || undefined), "Sent", () => { setComposeText(""); setComposeOpen(false); })} className="inline-flex items-center gap-2 bg-slate-900 text-white rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"><Send size={14} /> {busy === "Sent" ? "Sending…" : "Send now"}</button>
                    <span className="text-xs text-slate-500">or</span>
                    <input type="datetime-local" value={sendAt} onChange={e => setSendAt(e.target.value)} className="text-sm border border-slate-300 rounded-md px-3 py-2" />
                    <button disabled={busy !== null || !composeText.trim() || !sendAt} onClick={() => act(() => triageService.schedule(thread.pm_email, composeText, new Date(sendAt).toISOString(), instructions || undefined), "Scheduled", () => { setComposeText(""); setComposeOpen(false); })} className="inline-flex items-center gap-2 border border-slate-900 text-slate-900 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"><CalendarClock size={14} /> {busy === "Scheduled" ? "Scheduling…" : "Schedule"}</button>
                    <button onClick={() => { setComposeOpen(false); setComposeText(""); }} className="text-sm text-slate-500 hover:text-slate-900 ml-auto">Cancel</button>
                  </div>
                  <p className="text-xs text-slate-500">Times are your local time. Scheduled sends are durable: they survive restarts, retry on failure, and email you a confirmation when they go out. Cancel from the Scheduled list above while still waiting.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
