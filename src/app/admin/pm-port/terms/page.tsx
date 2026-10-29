"use client";

import { useState, useEffect, useCallback } from "react";
import { sweetleaseApi } from "@/lib/api";
import { Button, Card, PageHeader, Badge, Input, Textarea } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { FileSignature, RefreshCw, Building2, CheckCircle2, Clock, Pencil } from "lucide-react";

interface Override { flatRate?: number; noDealDiscount?: boolean; noRenewalFee?: boolean; note?: string; agreedAt?: string; evidence?: { label: string; date?: string; sha256: string }[] }
interface Company {
  id: string; company: string; city: string; stage: string; contactName: string; contactEmail: string;
  override: Override | null; overrideSummary: string | null;
  accepted: { at: string; name: string; title: string } | null;
  acceptedOlderVersion: { at: string; name: string } | null;
}

const fmt = (s: string) => new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function PmTermsPage() {
  const [rows, setRows] = useState<Company[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows((await sweetleaseApi.get<{ companies: Company[] }>("/api/admin/pm-terms")).companies);
    } catch {
      setError("Failed to load operator terms");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="PM Terms"
        description="Which operators accepted their partner terms on their /port page, and the custom terms billing uses for them."
        actions={<Button variant="ghost" size="icon" aria-label="Refresh" onClick={load}><RefreshCw size={15} className={loading ? "animate-spin" : ""} /></Button>}
      />
      {error && <ErrorBanner message={error} onRetry={load} className="mb-4" />}
      {loading && !rows ? <Spinner label="Loading terms" /> : !rows ? null : rows.length === 0 ? (
        <Card><EmptyState title="No operators yet" hint="Operators show up here once they get a /port link or move past Lead Drop." icon={<FileSignature size={28} className="mx-auto" aria-hidden />} /></Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {rows.map((c) => (
              <li key={c.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Building2 size={15} className="text-slate-400" aria-hidden />
                      <span className="font-medium text-slate-900">{c.company}</span>
                      <Badge tone="outline">{c.stage}</Badge>
                      {c.accepted
                        ? <Badge tone="success" dot>Accepted</Badge>
                        : c.acceptedOlderVersion ? <Badge tone="warning" dot>Needs to re-accept</Badge> : <Badge tone="neutral" dot>Not accepted</Badge>}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Terms: <span className="font-medium text-slate-800">{c.overrideSummary ? `Custom: ${c.overrideSummary}` : "Standard rate card"}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {c.city}{c.contactEmail ? ` · ${c.contactName || c.contactEmail}` : ""}
                      {c.accepted && <> · <CheckCircle2 size={11} className="inline text-emerald-600" aria-hidden /> {c.accepted.name}{c.accepted.title ? `, ${c.accepted.title}` : ""} on {fmt(c.accepted.at)}</>}
                      {!c.accepted && c.acceptedOlderVersion && <> · <Clock size={11} className="inline" aria-hidden /> accepted earlier terms on {fmt(c.acceptedOlderVersion.at)}</>}
                      {c.override?.evidence?.length ? ` · ${c.override.evidence.length} evidence item${c.override.evidence.length === 1 ? "" : "s"}` : ""}
                    </div>
                  </div>
                  <Button size="sm" variant={editing === c.id ? "secondary" : "ghost"} icon={<Pencil size={13} />} onClick={() => setEditing(editing === c.id ? null : c.id)}>
                    {c.override ? "Edit terms" : "Set custom terms"}
                  </Button>
                </div>
                {editing === c.id && <TermsForm company={c} onDone={async () => { setEditing(null); await load(); }} onError={setError} />}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function TermsForm({ company: c, onDone, onError }: { company: Company; onDone: () => void; onError: (m: string) => void }) {
  const o = c.override || {};
  const [flat, setFlat] = useState(o.flatRate !== undefined ? String(Math.round(o.flatRate * 100)) : "");
  const [noDeal, setNoDeal] = useState(!!o.noDealDiscount);
  const [noRenewal, setNoRenewal] = useState(!!o.noRenewalFee);
  const [note, setNote] = useState(o.note || "");
  const [evidence, setEvidence] = useState("");
  const [evidenceLabel, setEvidenceLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [armedReset, setArmedReset] = useState(false);

  const save = async () => {
    const pct = flat.trim() === "" ? null : Number(flat);
    if (pct !== null && (!(pct > 0) || pct > 100)) { onError("Flat rate must be between 1 and 100 percent, or empty for the standard tiers."); return; }
    setSaving(true);
    try {
      await sweetleaseApi.put(`/api/admin/pm-terms/${c.id}`, {
        flatRate: pct === null ? null : pct / 100,
        noDealDiscount: noDeal,
        noRenewalFee: noRenewal,
        note,
        ...(evidence.trim() ? { evidenceText: evidence, evidenceLabel: evidenceLabel || undefined } : {}),
      });
      onDone();
    } catch {
      onError("Saving terms failed");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!armedReset) { setArmedReset(true); return; }
    setSaving(true);
    try { await sweetleaseApi.put(`/api/admin/pm-terms/${c.id}`, { clear: true }); onDone(); }
    catch { onError("Reset failed"); }
    finally { setSaving(false); }
  };

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Flat fee (% of first month)</span>
          <Input value={flat} onChange={(e) => setFlat(e.target.value)} inputMode="numeric" placeholder="Empty = standard tiers" />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:mt-6">
          <input type="checkbox" checked={noDeal} onChange={(e) => setNoDeal(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          No below-asking discount
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700 sm:mt-6">
          <input type="checkbox" checked={noRenewal} onChange={(e) => setNoRenewal(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          No renewal fee
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">Note (shown to the operator as part of their terms)</span>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="e.g. You collect rent and share collection history; we invoice from it." />
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-600">Evidence (paste the email or document text where these terms were agreed)</span>
          <Textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} rows={4} placeholder="Stored with a fingerprint so the quarterly audit can prove it was not altered." />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">Evidence label</span>
          <Input value={evidenceLabel} onChange={(e) => setEvidenceLabel(e.target.value)} placeholder="e.g. Email from their COO, Oct 2" />
        </label>
      </div>
      <p className="text-xs text-slate-500">Changing terms updates what billing charges and what the operator sees on their /port page. They will be asked to accept the new terms before sending more units.</p>
      <div className="flex flex-wrap justify-between gap-2">
        {c.override ? <Button size="sm" variant="ghost" onClick={reset} disabled={saving}>{armedReset ? "Confirm: back to standard terms" : "Reset to standard terms"}</Button> : <span />}
        <Button size="sm" variant="primary" onClick={save} loading={saving}>Save terms</Button>
      </div>
    </div>
  );
}
