"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { ErrorBanner, Spinner } from "@/components/ui/AsyncState";
import { Button, Card, CardHeader, CardBody, Badge, PageHeader, StatTile, Field, Input } from "@/components/kit";
import { useApi } from "@/lib/hooks";
import { alnService } from "@/lib/services/aln";

function Check({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-sm">
      <div><p className="text-slate-800">{label}</p>{detail && <p className="text-xs text-slate-500 mt-0.5">{detail}</p>}</div>
      <Badge tone={ok ? "success" : "warning"} dot>{ok ? "Ready" : "Needed"}</Badge>
    </div>
  );
}

export default function AlnPage() {
  const { confirm, dialog } = useConfirm();
  const status = useApi(() => alnService.status(), []);
  const s = status.data;
  const [metrosText, setMetrosText] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string>("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const metrosValue = metrosText ?? (s?.metros || []).join("; ");
  const run = async (label: string, fn: () => Promise<any>) => {
    setBusy(true); setResult("");
    try { setResult(`${label}\n${JSON.stringify(await fn(), null, 2)}`); status.refetch(); }
    catch (e: any) { setResult(`${label} failed: ${e?.message || e}`); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-4xl">
      {dialog}
      <PageHeader
        title="ALN Listings"
        description="Licensed listing data from ALN, synced into the private matching pool (never shown publicly)."
        actions={<Button variant="secondary" size="sm" onClick={() => status.refetch()} loading={status.loading} icon={<RefreshCw size={14} aria-hidden />}>Refresh</Button>}
      />
      {status.error && <ErrorBanner message={String(status.error)} onRetry={status.refetch} className="mb-4" />}
      {status.loading && !s && <Spinner label="Checking ALN setup" />}

      {s && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <StatTile label="In matching" value={s.listingsByStatus.APPROVED ?? 0} hint="ALN units, approved" />
            <StatTile label="Inactive" value={s.listingsByStatus.INACTIVE ?? 0} hint="Gone from ALN" />
            <StatTile label="Metros" value={s.metros.length} />
            <StatTile label="Nightly sync" value={s.nightlySyncOn ? "On" : "Off"} />
          </div>

          <Card className="mb-4">
            <CardHeader title="Setup" />
            <CardBody className="divide-y divide-slate-100 py-1">
              <Check ok={s.source.configured} label="ALN access" detail={s.source.configured ? `Using ${s.source.kind === "file" ? "a feed file" : "the ALN API"}` : `Set ${s.source.missing.join(" and ")} in the SweetLease app env (or ALN_FEED_FILE for an export)`} />
              <Check ok={s.fieldMapMissing.length === 0} label="Field map from ALN docs" detail={s.fieldMapMissing.length ? `Not mapped yet: ${s.fieldMapMissing.join(", ")} (src/lib/aln/mapping.ts)` : "All required fields mapped"} />
              <Check ok={s.metros.length > 0} label="Metros to sync" detail={s.metros.length ? s.metros.join("; ") : "Add at least one below"} />
            </CardBody>
          </Card>

          <Card className="mb-4">
            <CardHeader title="Sync" />
            <CardBody className="space-y-4">
              <Field label="Metros (separate with ; )">
                <Input value={metrosValue} onChange={e => setMetrosText(e.target.value)} placeholder="Houston, TX; Baltimore, MD" />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => run("Saved metros", () => alnService.saveSettings({ "listings.alnMetros": metrosValue }))}>Save metros</Button>
                <Button size="sm" variant="secondary" disabled={busy || !s.source.configured} onClick={() => run("Dry run (nothing written)", () => alnService.sync({}))}>Dry run</Button>
                <Button size="sm" variant="primary" disabled={busy || !s.ready} onClick={async () => { if (await confirm({ title: "Run the ALN sync now?", message: "Creates, updates and deactivates ALN listings in the matching pool for every metro.", confirmLabel: "Run sync" })) run("Sync", () => alnService.sync({ commit: true })); }}>Run sync now</Button>
                <Button size="sm" variant={s.nightlySyncOn ? "dangerOutline" : "secondary"} disabled={busy} onClick={async () => {
                  const on = !s.nightlySyncOn;
                  if (on && !(await confirm({ title: "Turn on the nightly ALN sync?", message: "Runs every night at 05:45 UTC for the metros above and emails a summary.", confirmLabel: "Turn on" }))) return;
                  run(on ? "Nightly sync turned on" : "Nightly sync turned off", () => alnService.saveSettings({ "listings.alnSync": on }));
                }}>{s.nightlySyncOn ? "Turn nightly sync off" : "Turn nightly sync on"}</Button>
              </div>
              {s.lastRun && (
                <div className="text-xs text-slate-600 space-y-1">
                  {Object.entries(s.lastRun).map(([m, r]) => (
                    <p key={m}><b>{m}</b> {new Date(r.at).toLocaleString()}: +{r.created} new, {r.updated} updated, {r.unchanged} unchanged, {r.deactivated} deactivated{r.invalid ? `, ${r.invalid} skipped` : ""}</p>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card className="mb-4">
            <CardHeader title="Retire scraped listings in a city" />
            <CardBody className="space-y-3">
              <p className="text-sm text-slate-600">Once ALN covers a city, take the old scraped (Locust / Zillow) listings there out of matching. Nothing is deleted, and you can restore them.</p>
              <div className="grid grid-cols-[1fr_100px] gap-3 max-w-md">
                <Field label="City"><Input value={city} onChange={e => setCity(e.target.value)} placeholder="Baltimore" /></Field>
                <Field label="State"><Input value={state} onChange={e => setState(e.target.value.toUpperCase())} placeholder="MD" maxLength={2} /></Field>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" disabled={busy || !city || !state} onClick={() => run("Retire dry run", () => alnService.retire({ city, state }))}>Preview</Button>
                <Button size="sm" variant="danger" disabled={busy || !city || !state} onClick={async () => { if (await confirm({ title: `Retire scraped listings in ${city}, ${state}?`, message: "They leave matching right away. You can restore them later.", confirmLabel: "Retire", danger: true })) run("Retired", () => alnService.retire({ city, state, commit: true })); }}>Retire</Button>
                <Button size="sm" variant="ghost" disabled={busy || !city || !state} onClick={() => run("Restored", () => alnService.retire({ city, state, restore: true }))}>Restore</Button>
              </div>
            </CardBody>
          </Card>

          {result && <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-auto max-h-96 whitespace-pre-wrap">{result}</pre>}
        </>
      )}
    </div>
  );
}
