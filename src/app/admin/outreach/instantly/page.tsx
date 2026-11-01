"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import { sweetleaseApi } from "@/lib/api";
import { Button, Card, CardHeader, CardBody, PageHeader, Badge, StatTile, FilterChips, Table, THead, TH, TBody, TR, TD, Input } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { RefreshCw, Send, ChevronDown, ChevronRight, UserX } from "lucide-react";
import { SimpleLineChart } from "@/components/charts/SimpleLineChart";

interface Step { step: number; sent: number; replied: number; replyRate: number | null; bounced: number; unsubscribed: number }
interface VariantStep { step: number; variants: { variant: number; label: string; sent: number; replied: number; replyRate: number | null }[] }
interface Mailbox { account: string; sent: number; bounced: number; bounceRate: number | null; replied: number; replyRate: number | null; unsubscribed: number; health: Campaign["health"] }
interface Week { week: string; sent: number; bounced: number; replied: number; unsubscribed: number; bounceRate: number | null; replyRate: number | null }
interface Source { source: string; sent: number; bounced: number; bounceRate: number | null; replied: number; replyRate: number | null; interested: number }
interface Campaign {
  campaignId: string | null;
  name: string;
  contacted: number;
  emailsSent: number;
  bounced: number;
  bounceRate: number | null;
  replied: number;
  replyRate: number | null;
  interested: number;
  notInterested: number;
  unsubscribed: number;
  unsubscribeRate: number | null;
  health: "ok" | "warning" | "danger" | "unknown";
  next: { pmsContacted: number; termsAccepted: number; unitsLive: number; leasesSigned: number };
  steps: Step[];
  variants: VariantStep[];
}
interface Funnel {
  days: number;
  totals: { contacted: number; bounced: number; replied: number; interested: number; unsubscribed: number; bounceRate: number | null; replyRate: number | null; unsubscribeRate: number | null };
  campaigns: Campaign[];
  mailboxes: Mailbox[];
  weekly: Week[];
  sources: Source[];
  suppressedFromInstantly: number;
}

interface ForgetResult {
  email: string;
  dryRun: boolean;
  instantly: { found: number; deleted: number; skipped?: string; errors: string[] };
  eventsScrubbed: number;
}

type Range = "30" | "90" | "365";

/** Erasure request from a cold-outreach contact: check first (dry run), then erase. */
function EraseContact({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [check, setCheck] = useState<ForgetResult | null>(null);
  const [done, setDone] = useState<ForgetResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async (dryRun: boolean) => {
    setBusy(true);
    setErr(null);
    try {
      const r = await sweetleaseApi.post<ForgetResult>("/api/admin/outreach/forget", { email: email.trim(), dryRun });
      if (dryRun) { setCheck(r); setDone(null); } else { setDone(r); setCheck(null); setEmail(""); onDone(); }
    } catch {
      setErr("Couldn't process that address");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-5">
      <CardHeader
        title={<span className="inline-flex items-center gap-2"><UserX size={16} className="text-slate-500" aria-hidden />Erase a contact</span>}
        description="When a property manager asks us to delete their data: their Instantly leads are deleted, our stored emails are scrubbed, and the address stays on do-not-contact so they are never emailed again."
      />
      <CardBody>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setCheck(null); }}
            className="w-72"
          />
          <Button variant="secondary" disabled={busy || !email.includes("@")} onClick={() => run(true)}>Check</Button>
          {check && (
            <Button variant="danger" disabled={busy} onClick={() => run(false)}>
              Erase {check.email}
            </Button>
          )}
        </div>
        {err && <p className="mt-2 text-sm text-red-700">{err}</p>}
        {check && (
          <p className="mt-3 text-sm text-slate-700">
            Found <span className="font-semibold">{check.instantly.found}</span> Instantly lead{check.instantly.found === 1 ? "" : "s"} and{" "}
            <span className="font-semibold">{check.eventsScrubbed}</span> stored event{check.eventsScrubbed === 1 ? "" : "s"}.
            {check.instantly.skipped && <span className="text-amber-700"> Instantly not checked: {check.instantly.skipped}.</span>}
            {check.instantly.errors.length > 0 && <span className="text-red-700"> Instantly error: {check.instantly.errors[0]}</span>}
          </p>
        )}
        {done && (
          <p className="mt-3 text-sm text-emerald-800">
            Erased {done.email}: {done.instantly.deleted} Instantly lead{done.instantly.deleted === 1 ? "" : "s"} deleted, {done.eventsScrubbed} event{done.eventsScrubbed === 1 ? "" : "s"} scrubbed, kept on do-not-contact.
            {done.instantly.errors.length > 0 && <span className="text-red-700"> Some Instantly deletes failed: {done.instantly.errors.join(", ")}</span>}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
const pct = (v: number | null) => (v == null ? "-" : `${v}%`);
const HEALTH: Record<Campaign["health"], { tone: "success" | "warning" | "danger" | "neutral"; label: string }> = {
  ok: { tone: "success", label: "Healthy" },
  warning: { tone: "warning", label: "Watch bounces" },
  danger: { tone: "danger", label: "Pause: bounces" },
  unknown: { tone: "neutral", label: "No sends" },
};

export default function InstantlyFunnelPage() {
  const [range, setRange] = useState<Range>("90");
  const [data, setData] = useState<Funnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await sweetleaseApi.get<Funnel>(`/api/admin/outreach/funnel?days=${range}`));
    } catch {
      setError("Failed to load outreach data");
    } finally {
      setLoading(false);
    }
  }, [range]);
  useEffect(() => { load(); }, [load]);

  const t = data?.totals;
  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Cold Outreach"
        description="Instantly campaigns, counted in people reached, and what those property managers did next. Opens are left out: Apple Mail inflates them."
        actions={
          <Button variant="ghost" size="icon" aria-label="Refresh" onClick={load}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </Button>
        }
      />

      <FilterChips<Range>
        className="mb-4"
        value={range}
        onChange={setRange}
        items={[{ key: "30", label: "30 days" }, { key: "90", label: "90 days" }, { key: "365", label: "12 months" }]}
      />

      {error && <ErrorBanner message={error} onRetry={load} className="mb-4" />}

      {loading && !data ? (
        <Spinner label="Loading outreach" />
      ) : !data || !t ? null : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <StatTile label="People reached" value={t.contacted} />
            <StatTile label="Reply rate" value={pct(t.replyRate)} hint={`${t.replied} replied, ${t.interested} interested`} />
            <StatTile
              label="Bounce rate"
              value={pct(t.bounceRate)}
              hint="keep under 2%"
              delta={t.bounceRate != null && t.bounceRate >= 2 ? "high" : undefined}
              deltaTone={t.bounceRate != null && t.bounceRate >= 2 ? "down" : undefined}
            />
            <StatTile label="Do-not-contact from Instantly" value={data.suppressedFromInstantly} hint={`${t.unsubscribed} unsubscribed in range`} />
          </div>

          {data.campaigns.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Send size={28} className="mx-auto" aria-hidden />}
                title="No Instantly events yet"
                hint="Events arrive once the Instantly webhook is registered and a campaign sends."
              />
            </Card>
          ) : (
            <Card>
              <CardHeader title="Campaigns" description="Click a campaign for its per-step numbers." />
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <tr>
                      <TH>Campaign</TH>
                      <TH numeric>Reached</TH>
                      <TH numeric>Bounce</TH>
                      <TH numeric>Replied</TH>
                      <TH numeric>Unsub</TH>
                      <TH numeric>Terms</TH>
                      <TH numeric>Units live</TH>
                      <TH numeric>Leases</TH>
                      <TH>Health</TH>
                    </tr>
                  </THead>
                  <TBody>
                    {data.campaigns.map((c) => {
                      const k = c.campaignId || "none";
                      const isOpen = open === k;
                      return (
                        <Fragment key={k}>
                          <TR clickable onClick={() => setOpen(isOpen ? null : k)}>
                            <TD>
                              <span className="inline-flex items-center gap-1.5 font-medium text-slate-900">
                                {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                {c.name}
                              </span>
                              <span className="block text-xs text-slate-500 ml-5">{c.emailsSent} emails sent</span>
                            </TD>
                            <TD numeric className="font-semibold">{c.contacted}</TD>
                            <TD numeric className={c.bounceRate != null && c.bounceRate >= 2 ? "text-red-700 font-semibold" : ""}>{pct(c.bounceRate)}</TD>
                            <TD numeric><span className="font-semibold">{c.replied}</span> <span className="text-slate-500">({pct(c.replyRate)})</span></TD>
                            <TD numeric muted>{c.unsubscribed}</TD>
                            <TD numeric>{c.next.termsAccepted}</TD>
                            <TD numeric>{c.next.unitsLive}</TD>
                            <TD numeric className="font-semibold">{c.next.leasesSigned}</TD>
                            <TD><Badge dot tone={HEALTH[c.health].tone}>{HEALTH[c.health].label}</Badge></TD>
                          </TR>
                          {isOpen && (
                            <tr>
                              <td colSpan={9} className="bg-slate-50 px-5 py-3">
                                {c.steps.length === 0 ? (
                                  <p className="text-sm text-slate-500">No per-step data.</p>
                                ) : (
                                  <table className="text-sm">
                                    <thead>
                                      <tr className="text-xs uppercase tracking-wide text-slate-500">
                                        <th className="text-left pr-8 py-1 font-medium">Step</th>
                                        <th className="text-right pr-8 font-medium">Sent</th>
                                        <th className="text-right pr-8 font-medium">Replied</th>
                                        <th className="text-right pr-8 font-medium">Bounced</th>
                                        <th className="text-right font-medium">Unsub</th>
                                      </tr>
                                    </thead>
                                    <tbody className="tabular">
                                      {c.steps.map((s) => (
                                        <tr key={s.step} className="text-slate-700">
                                          <td className="pr-8 py-1">Email {s.step}</td>
                                          <td className="text-right pr-8">{s.sent}</td>
                                          <td className="text-right pr-8"><span className="font-semibold">{s.replied}</span> <span className="text-slate-500">({pct(s.replyRate)})</span></td>
                                          <td className="text-right pr-8">{s.bounced}</td>
                                          <td className="text-right">{s.unsubscribed}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                                {c.variants.length > 0 && (
                                  <div className="mt-4">
                                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">A/B tests</p>
                                    <div className="flex flex-wrap gap-3">
                                      {c.variants.map((v) => {
                                        const best = Math.max(...v.variants.map((x) => x.replyRate ?? -1));
                                        return (
                                          <div key={v.step} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                                            <p className="font-medium text-slate-900 mb-1">Email {v.step}</p>
                                            {v.variants.map((x) => (
                                              <p key={x.variant} className="tabular text-slate-700">
                                                <span className={x.replyRate === best && best > 0 ? "font-semibold text-slate-900" : ""}>Variant {x.label}</span>
                                                {": "}{x.replied}/{x.sent} replied ({pct(x.replyRate)})
                                              </p>
                                            ))}
                                            {Math.min(...v.variants.map((x) => x.sent)) < 100 && (
                                              <p className="text-xs text-slate-500 mt-1">Under 100 sends per variant: too early to call.</p>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                <p className="mt-2 text-xs text-slate-500">
                                  {c.next.pmsContacted} of these contacts match a PM company in SweetLease. Interested {c.interested}, not interested {c.notInterested}.
                                </p>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </TBody>
                </Table>
              </div>
            </Card>
          )}
          {data.weekly.length > 0 && (
            <Card className="mt-5">
              <CardHeader title="Week by week" description="Reply and bounce rate per week, in people reached. A rising bounce line is the early warning to pause and clean the list." />
              <div className="px-2 pb-3">
                <SimpleLineChart
                  bare
                  height={220}
                  xAxisKey="label"
                  data={data.weekly.map((w) => ({ ...w, label: new Date(w.week + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) }))}
                  lines={[
                    { dataKey: "replyRate", color: "#0284c7", name: "Reply rate %" },
                    { dataKey: "bounceRate", color: "#dc2626", name: "Bounce rate %" },
                  ]}
                />
              </div>
            </Card>
          )}

          {data.mailboxes.length > 0 && (
            <Card className="mt-5">
              <CardHeader title="Sending mailboxes" description="If one account's bounces climb while the others stay low, that mailbox or its domain needs attention." />
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <tr><TH>Mailbox</TH><TH numeric>Reached</TH><TH numeric>Bounce</TH><TH numeric>Replied</TH><TH numeric>Unsub</TH><TH>Health</TH></tr>
                  </THead>
                  <TBody>
                    {data.mailboxes.map((m) => (
                      <TR key={m.account}>
                        <TD className="font-medium text-slate-900">{m.account}</TD>
                        <TD numeric className="font-semibold">{m.sent}</TD>
                        <TD numeric className={m.bounceRate != null && m.bounceRate >= 2 ? "text-red-700 font-semibold" : ""}>{pct(m.bounceRate)}</TD>
                        <TD numeric><span className="font-semibold">{m.replied}</span> <span className="text-slate-500">({pct(m.replyRate)})</span></TD>
                        <TD numeric muted>{m.unsubscribed}</TD>
                        <TD><Badge dot tone={HEALTH[m.health].tone}>{HEALTH[m.health].label}</Badge></TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            </Card>
          )}

          <Card className="mt-5">
            <CardHeader title="Lead sources" description="Which lists are worth buying or building again. Sources are recorded when leads go in through the upload script." />
            {data.sources.length === 0 ? (
              <p className="px-5 pb-4 text-sm text-slate-500">
                No sourced leads yet. Upload with <code className="text-xs bg-slate-100 rounded px-1 py-0.5">scripts/instantly/upload-leads.ts --source &quot;list name&quot;</code> and results will show here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <tr><TH>Source</TH><TH numeric>Reached</TH><TH numeric>Bounce</TH><TH numeric>Replied</TH><TH numeric>Interested</TH></tr>
                  </THead>
                  <TBody>
                    {data.sources.map((src) => (
                      <TR key={src.source}>
                        <TD className="font-medium text-slate-900">{src.source}</TD>
                        <TD numeric className="font-semibold">{src.sent}</TD>
                        <TD numeric className={src.bounceRate != null && src.bounceRate >= 2 ? "text-red-700 font-semibold" : ""}>{pct(src.bounceRate)}</TD>
                        <TD numeric><span className="font-semibold">{src.replied}</span> <span className="text-slate-500">({pct(src.replyRate)})</span></TD>
                        <TD numeric>{src.interested}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </Card>

          <EraseContact onDone={load} />
        </>
      )}
    </div>
  );
}
