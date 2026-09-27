"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Send, Trash2, RefreshCw, Mail, Users, Building2, CalendarClock } from "lucide-react";
import { Button, Card, CardHeader, CardBody, Badge, statusTone, StatTile, PageHeader, FilterChips, Table, THead, TH, TBody, TR, TD, Field, Input, Select, Textarea } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/ConfirmDialog";

const Section = ({ id, title, note, children }: { id: string; title: string; note?: string; children: React.ReactNode }) => (
  <section id={id} className="scroll-mt-20">
    <div className="mb-3"><h2 className="text-md font-semibold text-slate-900">{title}</h2>{note && <p className="text-sm text-slate-500 mt-0.5">{note}</p>}</div>
    {children}
  </section>
);
const Swatch = ({ cls, name, hex }: { cls: string; name: string; hex?: string }) => (
  <div className="min-w-0"><div className={`h-10 rounded-sm border border-slate-200 ${cls}`} /><p className="text-xs text-slate-700 mt-1 truncate">{name}</p>{hex && <p className="text-xs text-slate-400 tabular">{hex}</p>}</div>
);

export default function DesignPage() {
  const [chip, setChip] = useState<"all" | "open" | "done">("open");
  const [modal, setModal] = useState(false);
  const { confirm, dialog } = useConfirm();
  const rows = [
    { pm: "IthacaHome", city: "Ithaca", status: "Consented", units: 8, last: "Sep 25" },
    { pm: "Nest Communities", city: "Ithaca", status: "Responded", units: 84, last: "Sep 25" },
    { pm: "Gordon Property Management", city: "Champaign", status: "Interested", units: 27, last: "Sep 24" },
    { pm: "Splice Realty", city: "Cambridge", status: "Interested", units: 0, last: "Sep 23" },
    { pm: "KNR Property Management", city: "Raleigh", status: "Declined", units: 0, last: "Sep 19" },
  ];
  const nav = ["type", "color", "shape", "buttons", "badges", "stats", "cards", "table", "forms", "states", "feedback"];

  return (
    <div className="max-w-6xl">
      {dialog}
      <PageHeader title="Design system" description="The visual language for Hive: dense, light, one accent. Every component on this page is the real component, so what you see is what pages get." meta="System" actions={<Button variant="primary" size="md" icon={<Plus size={14} />}>Primary action</Button>} />

      <nav aria-label="Sections" className="flex flex-wrap gap-1.5 mb-8">
        {nav.map(n => <a key={n} href={`#${n}`} className="h-7 px-2.5 inline-flex items-center rounded-sm text-xs text-slate-600 border border-slate-200 bg-white hover:border-slate-400 capitalize">{n}</a>)}
      </nav>

      <div className="space-y-10">
        <Section id="type" title="Typography" note="Inter, six sizes. Nothing smaller than 12px. Numbers use tabular figures so columns line up.">
          <Card><CardBody className="space-y-3">
            {[["xl", "24 / 32", "Headline number 1,284"], ["lg", "20 / 28", "Page title"], ["md", "16 / 24", "Section title"], ["base", "14 / 20", "Body text and controls"], ["sm", "13 / 18", "Table cells and dense lists"], ["xs", "12 / 16", "Meta, labels, timestamps"]].map(([k, s, t]) => (
              <div key={k} className="flex items-baseline gap-4"><span className="w-16 text-xs text-slate-400 tabular shrink-0">{s}</span><span className={`text-${k} ${k === "xl" || k === "lg" ? "font-semibold" : ""} text-slate-900 tabular`}>{t}</span></div>
            ))}
          </CardBody></Card>
        </Section>

        <Section id="color" title="Color" note="Slate for everything structural. Amber for the one primary action per page and the active nav item. Status colors mean status and nothing else.">
          <Card><CardBody>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Accent</p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-5"><Swatch cls="bg-amber-600" name="Primary" hex="#D97706" /><Swatch cls="bg-amber-700" name="Primary hover" hex="#B45309" /><Swatch cls="bg-amber-50" name="Selected row" hex="#FFFBEB" /><Swatch cls="bg-[#1e1e2d]" name="Sidebar" hex="#1E1E2D" /></div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Neutrals</p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-5"><Swatch cls="bg-slate-50" name="Page" hex="#F8FAFC" /><Swatch cls="bg-white" name="Surface" hex="#FFFFFF" /><Swatch cls="bg-slate-100" name="Subtle fill" hex="#F1F5F9" /><Swatch cls="bg-slate-200" name="Border" hex="#E2E8F0" /><Swatch cls="bg-slate-300" name="Input border" hex="#CBD5E1" /><Swatch cls="bg-slate-500" name="Muted text" hex="#64748B" /><Swatch cls="bg-slate-800" name="Text" hex="#1E293B" /><Swatch cls="bg-slate-900" name="Selected chip" hex="#0F172A" /></div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Status</p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3"><Swatch cls="bg-emerald-500" name="Success" /><Swatch cls="bg-amber-500" name="Pending" /><Swatch cls="bg-red-500" name="Failed" /><Swatch cls="bg-sky-500" name="Info" /></div>
          </CardBody></Card>
        </Section>

        <Section id="shape" title="Shape and elevation" note="Borders instead of shadows. One radius per role: 6px chips and inputs, 8px buttons, 12px cards, 16px dialogs, full for pills.">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[["rounded-sm", "6 · chips, inputs"], ["rounded", "8 · buttons"], ["rounded-lg", "12 · cards"], ["rounded-xl", "16 · dialogs"], ["rounded-full", "pills"]].map(([c, l]) => <div key={c}><div className={`h-14 bg-white border border-slate-200 ${c}`} /><p className="text-xs text-slate-600 mt-1">{l}</p></div>)}
          </div>
        </Section>

        <Section id="buttons" title="Buttons" note="Primary is amber and appears once per view. Secondary is the default. Danger only for destructive, irreversible actions.">
          <Card><CardBody className="space-y-4">
            <div className="flex flex-wrap gap-2"><Button variant="primary" icon={<Send size={14} />}>Send now</Button><Button>Secondary</Button><Button variant="ghost">Ghost</Button><Button variant="dangerOutline" icon={<Trash2 size={14} />}>Cancel send</Button><Button variant="danger">Delete</Button><Button variant="primary" loading>Sending</Button><Button disabled>Disabled</Button><Button variant="secondary" size="icon" aria-label="Refresh"><RefreshCw size={14} /></Button></div>
            <div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="primary">Small</Button><Button size="md" variant="primary">Medium</Button><Button size="lg" variant="primary">Large</Button></div>
          </CardBody></Card>
        </Section>

        <Section id="badges" title="Badges" note="One status map for the whole app: statusTone(status) picks the tone, so every page colors the same word the same way.">
          <Card><CardBody className="flex flex-wrap gap-2">
            {["Consented", "Interested", "Responded", "Declined", "Auto-reply", "Sent inventory", "Scheduled", "Failed", "Lead Drop", "Partnership"].map(s => <Badge key={s} tone={statusTone(s)} dot>{s}</Badge>)}
            <Badge tone="accent">3 due</Badge><Badge tone="outline">Outline</Badge>
          </CardBody></Card>
        </Section>

        <Section id="stats" title="Stat tiles" note="Label, tabular number, optional delta and hint. Four across on a laptop, two on a phone.">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile label="PMs contacted" value="376" delta="+38 today" deltaTone="up" hint="of 730 loaded" icon={<Mail size={14} />} />
            <StatTile label="Replies" value="22" delta="5.9%" deltaTone="flat" icon={<Users size={14} />} />
            <StatTile label="Units staged" value="119" hint="3 PMs" icon={<Building2 size={14} />} />
            <StatTile label="Scheduled sends" value="1" hint="Mon 9:00 AM" icon={<CalendarClock size={14} />} />
          </div>
        </Section>

        <Section id="cards" title="Cards" note="Header with title, description and actions. Body padding is 16px, or none when it holds a table.">
          <Card><CardHeader title="Scheduled sends" description="Durable queue; cancel while waiting." actions={<><Button size="sm">History</Button><Button size="sm" variant="primary">New</Button></>} /><CardBody><p className="text-sm text-slate-600">Card body content.</p></CardBody></Card>
        </Section>

        <Section id="table" title="Table" note="13px cells, 40px rows, sticky header, numbers right-aligned. Clickable rows get hover and a selected state in amber-50.">
          <Card>
            <CardHeader title="Property managers" actions={<FilterChips items={[{ key: "open", label: "Open", count: 4 }, { key: "done", label: "Resolved", count: 1 }, { key: "all", label: "All", count: 5 }]} value={chip} onChange={setChip} />} />
            <Table>
              <THead><tr><TH>Company</TH><TH>City</TH><TH>Status</TH><TH numeric>Units</TH><TH>Last activity</TH></tr></THead>
              <TBody>{rows.filter(r => chip === "all" ? true : chip === "done" ? r.status === "Declined" : r.status !== "Declined").map((r, i) => (
                <TR key={r.pm} clickable selected={i === 0}><TD className="font-medium">{r.pm}</TD><TD muted>{r.city}</TD><TD><Badge tone={statusTone(r.status)} dot>{r.status}</Badge></TD><TD numeric>{r.units}</TD><TD muted>{r.last}</TD></TR>
              ))}</TBody>
            </Table>
          </Card>
        </Section>

        <Section id="forms" title="Forms" note="36px controls, 6px radius, amber focus ring. Labels above, hints below, 16px on phones so iOS does not zoom.">
          <Card><CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Instruction for the AI" hint="One line is enough."><Input placeholder='e.g. "check in on the March units"' /></Field>
            <Field label="Send at"><Input type="datetime-local" /></Field>
            <Field label="Stage"><Select defaultValue="Interested">{["Lead Drop", "Responded", "Interested", "Consented", "Partnership", "Declined"].map(s => <option key={s}>{s}</option>)}</Select></Field>
            <Field label="Note"><Textarea rows={3} placeholder="Optional" /></Field>
          </CardBody></Card>
        </Section>

        <Section id="states" title="Loading, error, empty" note="Every data view has these three. The spinner shows only before the first result; refreshes keep old data on screen.">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card><Spinner /></Card>
            <Card><CardBody><ErrorBanner message="Instantly is rate-limiting us (429); try again in a minute" onRetry={() => toast("Retrying")} /></CardBody></Card>
            <Card><EmptyState title="No conversations need a reply" hint="New replies land here within 10 minutes." /></Card>
          </div>
        </Section>

        <Section id="feedback" title="Feedback" note="Toasts for outcomes, a dialog for confirmations. No browser alerts.">
          <Card><CardBody className="flex flex-wrap gap-2">
            <Button onClick={() => toast.success("Sent to IthacaHome", { description: "In-thread from robert@sweetleasepartners.com" })}>Success toast</Button>
            <Button onClick={() => toast.error("Send failed", { description: "instantly 502" })}>Error toast</Button>
            <Button onClick={async () => { if (await confirm({ title: "Cancel this scheduled send?", message: "It will not go out Monday at 9:00 AM.", confirmLabel: "Cancel send", danger: true })) toast("Cancelled"); }}>Confirm dialog</Button>
            <Button onClick={() => setModal(true)}>Modal</Button>
          </CardBody></Card>
          <Modal isOpen={modal} onClose={() => setModal(false)} title="Example dialog"><p className="text-sm text-slate-600">Escape closes it, focus is trapped inside, and the page behind stops scrolling.</p><div className="mt-5 flex justify-end gap-2"><Button onClick={() => setModal(false)}>Close</Button><Button variant="primary" onClick={() => setModal(false)}>Done</Button></div></Modal>
        </Section>
      </div>
    </div>
  );
}
