"use client";

import { useState, useEffect, useCallback } from "react";
import { sweetleaseApi } from "@/lib/api";
import { Button, Card, CardHeader, PageHeader, Badge, StatTile, Input } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { Link2, RefreshCw, CheckCircle2, X, Building2, ExternalLink, Pencil, AlertTriangle, ImageOff, Mail } from "lucide-react";

interface Unit {
  id: string;
  status: "NEEDS_REVIEW" | "STAGED";
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  availableFrom: string | null;
  confidence: number | null;
  concerns: string[];
  photo: string | null;
  photoCount: number;
  detailUrl: string | null;
}
interface ImportGroup { key: string; url: string | null; importedAt: string; needsReview: number; ready: number; units: Unit[] }
interface Operator { pmCompanyId: string; company: string; city: string; contactEmail: string | null; needsReview: number; ready: number; imports: ImportGroup[] }
interface QueueResponse {
  totals: { needsReview: number; ready: number; operators: number };
  operators: Operator[];
  emptyImports: { id: string; company: string | null; createdAt: string; detail: { url?: string; portal?: string } | null }[];
}
interface ApproveResponse { approved: number; total: number; results: { id: string; ok: boolean; error?: string }[]; notified?: Record<string, { sent: boolean; reason?: string }> }

const fmtDate = (s: string) => new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const host = (u: string | null) => { try { return u ? new URL(u).host : "unknown link"; } catch { return u || "unknown link"; } };

export default function LinkImportQueuePage() {
  const [data, setData] = useState<QueueResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [notify, setNotify] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await sweetleaseApi.get<QueueResponse>("/api/admin/pm-port/link-queue"));
    } catch {
      setError("Failed to load the link import queue");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const approve = async (units: Unit[], tag: string) => {
    if (!units.length) return;
    setBusy(tag);
    setNotice(null);
    try {
      const res = await sweetleaseApi.post<ApproveResponse>("/api/admin/pm-port/approve", {
        ids: units.map((u) => u.id),
        clearFirst: units.some((u) => u.status === "NEEDS_REVIEW"),
        notify,
      });
      const failed = res.results.filter((r) => !r.ok);
      const mailed = Object.values(res.notified || {}).filter((n) => n.sent).length;
      setNotice(`Approved ${res.approved} of ${res.total}${failed.length ? ` (${failed.length} failed: ${failed[0].error})` : ""}${notify ? `. Operator emails sent: ${mailed}` : ""}.`);
      await load();
    } catch {
      setError("Approve failed");
    } finally {
      setBusy(null);
    }
  };

  // Two clicks to reject: the first arms the button, the second rejects (no browser dialogs)
  const [armed, setArmed] = useState<string | null>(null);
  const reject = async (units: Unit[], tag: string) => {
    if (armed !== tag) { setArmed(tag); return; }
    setArmed(null);
    setBusy(tag);
    try {
      await sweetleaseApi.post("/api/admin/pm-port/approve", { ids: units.map((u) => u.id), reject: true, reason: "rejected in link review" });
      await load();
    } catch {
      setError("Reject failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Link Imports"
        description="Units operators sent through their listings link. Review the parse, fix anything wrong, then approve to put them in front of physicians."
        actions={
          <Button variant="ghost" size="icon" aria-label="Refresh" onClick={load}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={load} className="mb-4" />}
      {notice && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">{notice}</div>}

      {loading && !data ? (
        <Spinner label="Loading link imports" />
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <StatTile label="Need review" value={data.totals.needsReview} />
            <StatTile label="Ready to approve" value={data.totals.ready} />
            <StatTile label="Operators waiting" value={data.totals.operators} />
          </div>

          <label className="mb-4 inline-flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
            <Mail size={14} className="text-slate-500" aria-hidden />
            Email the operator when their units go live
          </label>

          {data.emptyImports.length > 0 && (
            <Card className="mb-4 border-amber-200">
              <CardHeader
                title={<span className="inline-flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" aria-hidden />Links that found no units (last 14 days)</span>}
                description="Usually a site blocking our reader or an empty listings page. Check the link with the operator."
              />
              <ul className="px-5 pb-4 space-y-1.5 text-sm">
                {data.emptyImports.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-x-3 text-slate-700">
                    <span className="font-medium">{e.company || "Unknown operator"}</span>
                    {e.detail?.url && <a href={e.detail.url} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline inline-flex items-center gap-1">{host(e.detail.url)}<ExternalLink size={12} /></a>}
                    <span className="text-slate-500">{fmtDate(e.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {data.operators.length === 0 ? (
            <Card>
              <EmptyState title="No link imports waiting" hint="When an operator pastes their listings link on their /port page, the units land here." icon={<Link2 size={28} className="mx-auto" aria-hidden />} />
            </Card>
          ) : (
            <div className="space-y-5">
              {data.operators.map((op) => (
                <Card key={op.pmCompanyId} className="overflow-hidden">
                  <CardHeader
                    title={<span className="inline-flex items-center gap-2"><Building2 size={16} className="text-slate-500" aria-hidden />{op.company}</span>}
                    description={`${op.city || "No city"} · ${op.ready} ready · ${op.needsReview} need review${op.contactEmail ? "" : " · no contact email"}`}
                  />
                  {op.imports.map((imp) => {
                    const all = imp.units;
                    const ready = all.filter((u) => u.status === "STAGED");
                    return (
                      <div key={imp.key} className="border-t border-slate-100">
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 px-5 py-2.5">
                          <div className="text-sm text-slate-700 inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                            <Link2 size={14} className="text-slate-400" aria-hidden />
                            {imp.url ? <a href={imp.url} target="_blank" rel="noreferrer" className="font-medium text-sky-700 hover:underline inline-flex items-center gap-1">{host(imp.url)}<ExternalLink size={12} /></a> : <span className="font-medium">Earlier import</span>}
                            <span className="text-slate-500">imported {fmtDate(imp.importedAt)}</span>
                            <span className="text-slate-500">{all.length} unit{all.length === 1 ? "" : "s"}</span>
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <Button size="sm" variant="primary" icon={<CheckCircle2 size={13} />} disabled={!!busy || !ready.length} loading={busy === imp.key + ":ready"} onClick={() => approve(ready, imp.key + ":ready")}>
                              Approve {ready.length} ready
                            </Button>
                            <Button size="sm" icon={<CheckCircle2 size={13} />} disabled={!!busy} loading={busy === imp.key + ":all"} onClick={() => approve(all, imp.key + ":all")}>
                              Approve all {all.length}
                            </Button>
                            <Button size="sm" variant="ghost" icon={<X size={13} />} disabled={!!busy} loading={busy === imp.key + ":reject"} onClick={() => reject(all, imp.key + ":reject")}>
                              {armed === imp.key + ":reject" ? `Confirm reject ${all.length}` : "Reject all"}
                            </Button>
                          </div>
                        </div>
                        <ul className="divide-y divide-slate-100">
                          {all.map((u) => (
                            <li key={u.id} className="px-5 py-3">
                              <UnitRow unit={u} busy={busy} editing={editing === u.id} armed={armed === u.id + ":reject"}
                                onEdit={() => setEditing(editing === u.id ? null : u.id)}
                                onSaved={async () => { setEditing(null); await load(); }}
                                onError={setError}
                                onApprove={() => approve([u], u.id + ":approve")}
                                onReject={() => reject([u], u.id + ":reject")} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UnitRow({ unit: u, busy, editing, armed, onEdit, onSaved, onError, onApprove, onReject }: {
  unit: Unit; busy: string | null; editing: boolean; armed: boolean;
  onEdit: () => void; onSaved: () => void; onError: (m: string) => void; onApprove: () => void; onReject: () => void;
}) {
  const conf = u.confidence ?? 0;
  return (
    <div>
      <div className="flex items-start gap-4">
        <div className="h-16 w-24 flex-none overflow-hidden rounded-md bg-slate-100">
          {u.photo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={u.photo} alt="" className="h-full w-full object-cover" loading="lazy" />
            : <div className="flex h-full items-center justify-center text-slate-400"><ImageOff size={18} aria-hidden /></div>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-900">{u.title || `${u.bedrooms ?? "?"}BR`}</span>
            {u.status === "NEEDS_REVIEW" ? <Badge tone="warning" dot>Needs review</Badge> : <Badge tone="success" dot>Ready</Badge>}
            <Badge tone={conf >= 85 ? "success" : conf >= 70 ? "neutral" : "warning"}>{conf}% confidence</Badge>
          </div>
          <div className="mt-0.5 text-sm text-slate-600">
            {[u.address, u.city, u.state, u.zip].filter(Boolean).join(", ")}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 tabular">
            ${u.price?.toLocaleString() ?? "?"}/mo · {u.bedrooms === 0 ? "Studio" : `${u.bedrooms ?? "?"} bd`} / {u.bathrooms ?? "?"} ba
            {u.availableFrom ? ` · available ${new Date(u.availableFrom).toLocaleDateString("en-US", { timeZone: "UTC" })}` : ""}
            {` · ${u.photoCount} photo${u.photoCount === 1 ? "" : "s"}`}
            {u.detailUrl && <> · <a href={u.detailUrl} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">source listing</a></>}
          </div>
          {u.concerns.length > 0 && (
            <ul className="mt-1.5 space-y-0.5 text-xs text-amber-700">
              {u.concerns.map((c, i) => <li key={i} className="flex items-start gap-1.5"><AlertTriangle size={12} className="mt-0.5 flex-none" aria-hidden />{c}</li>)}
            </ul>
          )}
        </div>
        <div className="flex flex-none items-center gap-2">
          <Button size="sm" variant="ghost" icon={<Pencil size={13} />} onClick={onEdit} disabled={!!busy}>Edit</Button>
          <Button size="sm" icon={<CheckCircle2 size={13} />} onClick={onApprove} disabled={!!busy} loading={busy === u.id + ":approve"}>
            {u.status === "NEEDS_REVIEW" ? "Clear & approve" : "Approve"}
          </Button>
          <Button size="sm" variant="ghost" icon={<X size={13} />} onClick={onReject} disabled={!!busy} loading={busy === u.id + ":reject"}>{armed ? "Confirm reject" : "Reject"}</Button>
        </div>
      </div>
      {editing && <EditForm unit={u} onSaved={onSaved} onError={onError} />}
    </div>
  );
}

function EditForm({ unit: u, onSaved, onError }: { unit: Unit; onSaved: () => void; onError: (m: string) => void }) {
  const [f, setF] = useState({
    title: u.title || "", price: u.price?.toString() || "", bedrooms: u.bedrooms?.toString() || "", bathrooms: u.bathrooms?.toString() || "",
    address: u.address || "", city: u.city || "", state: u.state || "", zip: u.zip || "",
    availableFrom: u.availableFrom ? u.availableFrom.slice(0, 10) : "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    setSaving(true);
    try {
      await sweetleaseApi.patch(`/api/admin/pm-port/property/${u.id}`, {
        title: f.title || undefined,
        price: f.price ? Number(f.price) : undefined,
        bedrooms: f.bedrooms !== "" ? Number(f.bedrooms) : undefined,
        bathrooms: f.bathrooms !== "" ? Number(f.bathrooms) : undefined,
        address: f.address || undefined,
        city: f.city || undefined,
        state: f.state || undefined,
        zip: f.zip || null,
        availableFrom: f.availableFrom ? new Date(f.availableFrom + "T00:00:00Z").toISOString() : null,
      });
      onSaved();
    } catch {
      onError("Saving the edit failed. Check the values (state is 2 letters, price and beds are numbers).");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, k: keyof typeof f, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <Input value={f[k]} onChange={set(k)} {...extra} />
    </label>
  );

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="col-span-2">{field("Title", "title")}</div>
        {field("Rent / mo", "price", { inputMode: "decimal" })}
        {field("Available from", "availableFrom", { type: "date" })}
        <div className="col-span-2">{field("Street address", "address")}</div>
        {field("City", "city")}
        <div className="grid grid-cols-2 gap-3">{field("State", "state", { maxLength: 2 })}{field("Zip", "zip")}</div>
        {field("Bedrooms", "bedrooms", { inputMode: "numeric" })}
        {field("Bathrooms", "bathrooms", { inputMode: "decimal" })}
      </div>
      <div className="mt-3 flex justify-end">
        <Button size="sm" variant="primary" onClick={save} loading={saving}>Save changes</Button>
      </div>
    </div>
  );
}
