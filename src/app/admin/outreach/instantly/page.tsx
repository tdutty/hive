"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import { sweetleaseApi } from "@/lib/api";
import { Button, Card, CardHeader, PageHeader, Badge, StatTile, FilterChips, Table, THead, TH, TBody, TR, TD } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { RefreshCw, Send, ChevronDown, ChevronRight } from "lucide-react";

interface Step { step: number; sent: number; replied: number; replyRate: number | null; bounced: number; unsubscribed: number }
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
}
interface Funnel {
  days: number;
  totals: { contacted: number; bounced: number; replied: number; interested: number; unsubscribed: number; bounceRate: number | null; replyRate: number | null; unsubscribeRate: number | null };
  campaigns: Campaign[];
  suppressedFromInstantly: number;
}

type Range = "30" | "90" | "365";
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
        </>
      )}
    </div>
  );
}
