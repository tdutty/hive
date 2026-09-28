"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Send, RefreshCw, BellRing, Sparkles, CalendarClock, Trash2, PenLine, Archive, CheckCheck, RotateCcw, ArrowLeft, Inbox } from "lucide-react";
import { useApi, useUrlState } from "@/lib/hooks";
import { triageService, type Conversation, type Classification, type ScheduledRow } from "@/lib/services/triage";
import { Button, Card, CardHeader, Badge, statusTone, StatTile, PageHeader, FilterChips, Field, Input, Select, Textarea } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { useConfirm } from "@/components/ui/ConfirmDialog";

type Filter = "actionable" | "active" | "all" | "resolved" | "archived" | Classification;
const CLS_LABEL: Record<Classification, string> = { CONSENTED: "Consented", SENT_INVENTORY: "Sent inventory", INTERESTED: "Interested", DECLINED: "Declined", AUTO: "Auto-reply", OTHER: "Other" };
const STAGES = ["Lead Drop", "Responded", "Interested", "Consented", "Partnership", "Declined"];
const isActive = (c: Conversation) => c.classification !== "DECLINED" && c.classification !== "AUTO";
const lastActivity = (c: Conversation) => [c.lastInboundAt, c.lastOutboundAt].filter(Boolean).sort().slice(-1)[0] || "";
const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "-");
const ago = (iso?: string | null) => { if (!iso) return "-"; const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); if (m < 60) return `${m}m`; const h = Math.round(m / 60); if (h < 48) return `${h}h`; return `${Math.round(h / 24)}d`; };
function defaultSlot(): string {
  const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function TriagePage() {
  const [fresh, setFresh] = useState(false);
  const { data, loading, refreshing, error, refetch } = useApi(() => triageService.list(fresh), [fresh]);
  const sched = useApi(() => triageService.scheduled());
  const fu = useApi(() => triageService.followupPreview());
  const [filter, setFilter] = useUrlState<Filter>("filter", "actionable");
  const [selected, setSelected] = useUrlState<string>("pm", "");
  const [thread, setThread] = useState<Conversation | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [composeText, setComposeText] = useState("");
  const [sendAt, setSendAt] = useState(defaultSlot());
  const [stateNote, setStateNote] = useState("");
  const [showSched, setShowSched] = useState(false);
  const { confirm, dialog } = useConfirm();

  useEffect(() => {
    if (!selected) { setThread(null); return; }
    setThreadLoading(true); setComposeOpen(false); setComposeText(""); setInstructions("");
    triageService.thread(selected).then(t => { setThread(t); setDraftText(t.pendingDraft?.draft || ""); setNotes(""); }).catch(e => toast.error("Could not load thread", { description: e.message })).finally(() => setThreadLoading(false));
  }, [selected]);

  const reloadThread = async () => { if (selected) { const t = await triageService.thread(selected); setThread(t); setDraftText(t.pendingDraft?.draft || ""); } };
  const act = async (fn: () => Promise<any>, ok: string, after?: (r: any) => void) => {
    setBusy(ok);
    try { const r = await fn(); if (r?.error) throw new Error(r.error); toast.success(ok); after?.(r); await reloadThread(); refetch(); sched.refetch(); }
    catch (e: any) { toast.error(ok.replace(/ed$/, "") + " failed", { description: e.message || "failed" }); }
    finally { setBusy(null); }
  };

  const all = data?.conversations || [];
  const openConvs = all.filter(c => c.state === "OPEN");
  const rows = (filter === "resolved" || filter === "archived" ? all.filter(c => c.state === filter.toUpperCase()) : openConvs)
    .filter(c => ["all", "resolved", "archived"].includes(filter) ? true : filter === "actionable" ? c.awaitingReply : filter === "active" ? isActive(c) : c.classification === filter)
    .sort((a, b) => filter === "active" ? (lastActivity(b) < lastActivity(a) ? -1 : 1) : 0);
  const chips = [
    { key: "actionable" as Filter, label: "Needs reply", count: data?.awaitingReply ?? 0 },
    { key: "active" as Filter, label: "Active", count: openConvs.filter(isActive).length },
    { key: "all" as Filter, label: "All open", count: data?.count ?? 0 },
    ...(Object.keys(CLS_LABEL) as Classification[]).map(k => ({ key: k as Filter, label: CLS_LABEL[k], count: data?.counts?.[k] ?? 0 })),
    { key: "resolved" as Filter, label: "Resolved", count: data?.states?.RESOLVED ?? 0 },
    { key: "archived" as Filter, label: "Archived", count: data?.states?.ARCHIVED ?? 0 },
  ];
  const nextScheduled = new Map<string, ScheduledRow>();
  for (const r of sched.data?.rows || []) if (r.status === "waiting" || r.status === "active") { const cur = nextScheduled.get(r.pm_email); if (!cur || r.scheduledFor < cur.scheduledFor) nextScheduled.set(r.pm_email, r); }
  const schedRows = (sched.data?.rows || []).filter(r => showSched ? true : r.status !== "completed");
  const stale = (data as any)?.source?.lastError as string | null | undefined;

  if (loading) return <div><PageHeader title="Email Triage" /><Spinner /></div>;
  if (error && !data) return <div><PageHeader title="Email Triage" /><ErrorBanner message={error} onRetry={refetch} /></div>;

  return (
    <div className="max-w-7xl">
      {dialog}
      <PageHeader
        title="Email Triage" meta="Outreach · property managers"
        description="Every PM who replied, classified, with the thread and the next action in one place."
        actions={<>
          <Button icon={<BellRing size={14} />} loading={busy === "Follow-ups drafted"} onClick={() => act(() => triageService.runFollowups(), "Follow-ups drafted", r => { fu.refetch(); toast.message(`${r.queued.length} drafted for approval`, { description: r.queued.map((q: any) => q.company).join(", ") || undefined }); })}>Follow-up sweep{fu.data?.count ? ` · ${fu.data.count} due` : ""}</Button>
          <Button variant="ghost" size="icon" aria-label="Refresh" onClick={() => { setFresh(true); refetch(); sched.refetch(); fu.refetch(); }}><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /></Button>
        </>}
      />

      {stale && <ErrorBanner className="mb-4" message={`Showing the last good snapshot. ${stale}`} onRetry={() => { setFresh(true); refetch(); }} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile label="Needs reply" value={data?.awaitingReply ?? 0} hint="last message is theirs" />
        <StatTile label="Open threads" value={data?.count ?? 0} hint={`${data?.total ?? 0} total`} />
        <StatTile label="Scheduled" value={sched.data?.waiting ?? 0} hint={nextScheduled.size ? `next ${fmt([...nextScheduled.values()].sort((a, b) => a.scheduledFor < b.scheduledFor ? -1 : 1)[0].scheduledFor)}` : "none waiting"} />
        <StatTile label="Follow-ups due" value={fu.data?.count ?? 0} hint={`quiet ${fu.data?.gapDays ?? 4}+ days`} />
      </div>

      {(schedRows.length > 0 || showSched) && (
        <Card className="mb-5">
          <CardHeader title="Scheduled sends" description="Durable queue. Cancel while waiting." actions={<Button size="sm" variant="ghost" onClick={() => setShowSched(v => !v)}>{showSched ? "Hide history" : "Show 30-day history"}</Button>} />
          <div className="divide-y divide-slate-100">
            {schedRows.length === 0 && <EmptyState title="Nothing scheduled" />}
            {schedRows.map(r => (
              <div key={r.id} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="text-sm font-medium text-slate-900 truncate">{r.company || r.pm_email}</span>{r.kind === "reminder" && <Badge tone="outline">reminder</Badge>}<Badge tone={statusTone(r.status)} dot>{r.status}</Badge></div>
                  <p className="text-xs text-slate-500 mt-0.5">{r.kind === "reminder" ? (r.status === "completed" ? "reminded" : "reminds you") : r.status === "completed" ? "sent" : "sends"} {fmt(r.scheduledFor)}{r.attempts > 0 && r.status !== "completed" ? ` · ${r.attempts} attempts` : ""}{r.error ? ` · ${r.error}` : ""}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => setSelected(r.pm_email)}>Open</Button>
                  {r.status === "waiting" && <Button size="sm" variant="dangerOutline" icon={<Trash2 size={12} />} onClick={async () => { if (await confirm({ title: "Cancel this scheduled send?", message: `To ${r.company || r.pm_email}, ${fmt(r.scheduledFor)}.`, confirmLabel: "Cancel send", danger: true })) act(() => triageService.cancel(r.id), "Cancelled"); }}>Cancel</Button>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <FilterChips items={chips} value={filter} onChange={setFilter} className="mb-4" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* list */}
        <Card className={`lg:col-span-2 lg:max-h-[72vh] lg:overflow-y-auto ${selected ? "hidden lg:block" : ""}`}>
          {rows.length === 0 && <EmptyState icon={<Inbox size={26} className="mx-auto" />} title="Nothing here" hint="Try another filter." />}
          <div className="divide-y divide-slate-100">
            {rows.map(c => (
              <button key={c.pm_email} onClick={() => setSelected(c.pm_email)} className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:bg-slate-50 ${selected === c.pm_email ? "bg-amber-50" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-slate-900 truncate">{c.company}</span>
                  <span className="text-xs text-slate-500 tabular shrink-0">{ago(c.lastInboundAt)}</span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{c.preview}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <Badge tone={statusTone(CLS_LABEL[c.classification])} dot>{CLS_LABEL[c.classification]}</Badge>
                  {c.awaitingReply && <Badge tone="warning">awaiting reply</Badge>}
                  {c.pendingDraft && <Badge tone="info">{c.pendingDraft.origin === "followup" ? "follow-up ready" : "draft ready"}</Badge>}
                  {nextScheduled.has(c.pm_email) && <Badge tone="info"><CalendarClock size={11} aria-hidden /> {fmt(nextScheduled.get(c.pm_email)!.scheduledFor)}</Badge>}
                  {c.reopened && <Badge tone="accent">reopened</Badge>}
                  {c.staged && <span className="text-xs text-slate-500 tabular">{c.staged.total} units</span>}
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* thread */}
        <Card className={`lg:col-span-3 lg:max-h-[72vh] lg:overflow-y-auto ${selected ? "" : "hidden lg:block"}`}>
          {!selected && <EmptyState title="Select a conversation" hint="The full thread and every action show here." />}
          {selected && threadLoading && <Spinner />}
          {thread && !threadLoading && (
            <div>
              <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <button onClick={() => setSelected("")} className="lg:hidden mb-1 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900"><ArrowLeft size={13} /> All conversations</button>
                  <h2 className="text-md font-semibold text-slate-900 break-words">{thread.company}</h2>
                  <p className="text-xs text-slate-500">{thread.pm_email}{thread.city ? ` · ${thread.city}` : ""} · {thread.campaign}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Select aria-label="Consent stage" value={thread.consent || ""} disabled={!thread.pmCompanyId || busy !== null} onChange={e => act(() => triageService.consent(thread.pm_email, e.target.value), `Stage set to ${e.target.value}`)} className="w-auto h-8 text-xs">
                    <option value="" disabled>{thread.pmCompanyId ? "stage" : "no PM record"}</option>{STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  {thread.state === "OPEN" ? (<>
                    <Input value={stateNote} onChange={e => setStateNote(e.target.value)} placeholder="note" className="w-28 h-8 text-xs" />
                    <Button size="sm" icon={<CheckCheck size={12} />} disabled={busy !== null} onClick={() => act(() => triageService.setState(thread.pm_email, "RESOLVED", stateNote || undefined), "Resolved", () => setStateNote(""))}>Resolve</Button>
                    <Button size="sm" variant="ghost" icon={<Archive size={12} />} disabled={busy !== null} onClick={() => act(() => triageService.setState(thread.pm_email, "ARCHIVED", stateNote || undefined), "Archived", () => setStateNote(""))}>Archive</Button>
                  </>) : <Button size="sm" icon={<RotateCcw size={12} />} disabled={busy !== null} onClick={() => act(() => triageService.setState(thread.pm_email, "OPEN"), "Reopened")}>Reopen</Button>}
                </div>
              </div>

              <div className="p-4 space-y-4">
                {nextScheduled.has(thread.pm_email) && (() => { const r = nextScheduled.get(thread.pm_email)!; return (
                  <div className="rounded-sm border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900 flex items-start justify-between gap-3">
                    <div><span className="font-medium inline-flex items-center gap-1"><CalendarClock size={13} /> Scheduled for {fmt(r.scheduledFor)}</span>{r.status === "active" ? " (sending now)" : ""}<p className="text-xs text-sky-800 mt-0.5 line-clamp-2">{r.text}</p></div>
                    {r.status === "waiting" && <Button size="sm" variant="dangerOutline" onClick={async () => { if (await confirm({ title: "Cancel this scheduled send?", confirmLabel: "Cancel send", danger: true })) act(() => triageService.cancel(r.id), "Cancelled"); }}>Cancel</Button>}
                  </div>); })()}
                {thread.state !== "OPEN" && <div className="rounded-sm bg-slate-100 px-3 py-2 text-sm text-slate-700">{thread.state === "RESOLVED" ? "Resolved" : "Archived"} {fmt(thread.stateAt)}{thread.stateNote ? ` · ${thread.stateNote}` : ""}. Reopens on its own if they write again.</div>}
                {thread.reopened && <div className="rounded-sm bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">Reopened: they wrote again after this was closed{thread.stateNote ? ` (${thread.stateNote})` : ""}.</div>}

                <ol className="space-y-2">
                  {thread.messages?.map(m => (
                    <li key={m.id} className={`rounded-lg px-3 py-2 text-sm ${m.direction === "in" ? "bg-slate-50 border border-slate-200" : "bg-white border border-amber-200 ml-4 sm:ml-10"}`}>
                      <div className="flex justify-between text-xs text-slate-500 mb-1"><span className="font-medium text-slate-700">{m.direction === "in" ? thread.company : "Robert"}</span><span className="tabular">{fmt(m.at)}</span></div>
                      <div className="whitespace-pre-wrap text-slate-800 leading-5">{m.direction === "in" ? m.text : m.text.slice(0, 600) + (m.text.length > 600 ? " […]" : "")}</div>
                    </li>
                  ))}
                </ol>

                {thread.pendingDraft ? (
                  <Card className="border-sky-200">
                    <CardHeader title={thread.pendingDraft.origin === "followup" ? `Proposed follow-up ${thread.pendingDraft.nth || ""}` : "Proposed reply"} description={`from ${thread.pendingDraft.channel === "smtp" ? "tgilbert@sweetlease.io" : "the sweetleasepartners inbox"}${thread.pendingDraft.notes_history.length ? ` · revised ${thread.pendingDraft.notes_history.length}×` : ""}`} />
                    <div className="p-4 space-y-3">
                      <Textarea value={draftText} onChange={e => setDraftText(e.target.value)} rows={10} aria-label="Reply text" />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="primary" icon={<Send size={14} />} loading={busy === "Sent"} disabled={busy !== null} onClick={() => act(() => triageService.send(thread.pm_email, thread.pendingDraft!.token, draftText), "Sent")}>Send it</Button>
                        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes for a revision" className="flex-1 min-w-[180px]" />
                        <Button icon={<RefreshCw size={14} />} loading={busy === "Redrafted"} disabled={busy !== null || !notes.trim()} onClick={() => act(() => triageService.redraft(thread.pm_email, thread.pendingDraft!.token, notes), "Redrafted")}>Redraft</Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <p className="text-sm text-slate-500">{thread.awaitingReply ? "Awaiting reply; the pipeline drafts within about 10 minutes of a new inbound." : thread.drafts.filter(d => d.status === "sent").length ? `Last message sent ${fmt(thread.drafts.filter(d => d.status === "sent").slice(-1)[0]?.sent_at)}.` : "No reply needed."}</p>
                )}

                {!composeOpen ? (
                  <Button icon={<PenLine size={14} />} onClick={() => setComposeOpen(true)}>Write a new message</Button>
                ) : (
                  <Card>
                    <CardHeader title="New message" description="Sends in this thread as Robert." actions={<Button size="sm" variant="ghost" onClick={() => { setComposeOpen(false); setComposeText(""); }}>Cancel</Button>} />
                    <div className="p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input value={instructions} onChange={e => setInstructions(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && instructions.trim() && busy === null) act(() => triageService.compose(thread.pm_email, instructions, composeText || undefined), composeText ? "Redrafted" : "Drafted", r => setComposeText(r.draft || "")); }} placeholder='Tell the AI what to say, e.g. "check in on the March units"' />
                        <Button variant="primary" icon={<Sparkles size={14} />} loading={busy === "Drafted" || busy === "Redrafted"} disabled={busy !== null || !instructions.trim()} onClick={() => act(() => triageService.compose(thread.pm_email, instructions, composeText || undefined), composeText ? "Redrafted" : "Drafted", r => setComposeText(r.draft || ""))}>{composeText ? "Redraft" : "Draft with AI"}</Button>
                      </div>
                      <Textarea value={composeText} onChange={e => setComposeText(e.target.value)} rows={9} placeholder="The draft appears here. Edit freely, or write your own." aria-label="Message text" />
                      <div className="flex flex-wrap items-end gap-2">
                        <Button variant="primary" icon={<Send size={14} />} loading={busy === "Sent"} disabled={busy !== null || !composeText.trim()} onClick={() => act(() => triageService.sendNow(thread.pm_email, composeText, instructions || undefined), "Sent", () => { setComposeText(""); setComposeOpen(false); })}>Send now</Button>
                        <span className="text-xs text-slate-500 pb-2.5">or</span>
                        <Field label="Send at"><Input type="datetime-local" value={sendAt} onChange={e => setSendAt(e.target.value)} className="w-auto" /></Field>
                        <Button icon={<CalendarClock size={14} />} loading={busy === "Scheduled"} disabled={busy !== null || !composeText.trim() || !sendAt} onClick={() => act(() => triageService.schedule(thread.pm_email, composeText, new Date(sendAt).toISOString(), instructions || undefined), "Scheduled", () => { setComposeText(""); setComposeOpen(false); })}>Schedule</Button>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
