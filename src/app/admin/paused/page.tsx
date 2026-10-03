"use client";

import { RefreshCw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { ErrorBanner, Spinner } from "@/components/ui/AsyncState";
import { Button, Card, CardHeader, CardBody, Badge, PageHeader, StatTile, type BadgeTone } from "@/components/kit";
import { useApi } from "@/lib/hooks";
import { pausedService, type PausedItem, type LiveState } from "@/lib/services/paused";

const GROUPS: PausedItem["group"][] = ["Hive switches", "Outreach tools", "Turned off in code", "Archived or removed"];

function stateBadge(item: PausedItem): { label: string; tone: BadgeTone } {
  const archivedGroup = item.group === "Archived or removed";
  const s: LiveState = item.state;
  if (s === "unknown") return { label: "Can't check", tone: "outline" };
  if (archivedGroup) return s === "archived" ? { label: "Archived", tone: "neutral" } : { label: "Still present", tone: "warning" };
  return s === "off" ? { label: "Stopped", tone: "neutral" } : { label: "Running", tone: "warning" };
}

function Line({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800">{children}</dd>
    </div>
  );
}

export default function PausedServicesPage() {
  const list = useApi(() => pausedService.list(), []);
  const droplet = useApi(() => pausedService.droplet(), []);

  // The droplet reply pipeline is checked by Hive itself, since it runs on this server
  const items: PausedItem[] = (list.data?.items ?? []).map(i => {
    if (i.id !== "reply-pipeline") return i;
    if (droplet.error) return { ...i, state: "unknown", detail: `Hive could not check it: ${droplet.error}` };
    if (!droplet.data) return i;
    const d = droplet.data;
    const cron = d.cron.map(c => `${c.paused ? "paused" : "RUNNING"}: ${c.line}`).join(" | ") || "no pipeline cron lines found";
    return { ...i, state: d.state, detail: `Approval server (pm2 reply-approvals): ${d.pm2Status ?? "?"}. Cron: ${cron}. Drafts waiting for approval: ${d.pendingApprovals ?? "?"}.` };
  });

  const running = items.filter(i => i.group !== "Archived or removed" && i.state === "on").length;
  const stopped = items.filter(i => i.group !== "Archived or removed" && i.state === "off").length;
  const archived = items.filter(i => i.group === "Archived or removed").length;
  const refresh = () => { list.refetch(); droplet.refetch(); };

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Paused & Archived"
        description="Everything that has been switched off, paused or archived, with its live status and how to bring it back."
        meta={list.data?.checkedAt ? `Checked ${new Date(list.data.checkedAt).toLocaleString()}` : undefined}
        actions={<Button variant="secondary" size="sm" onClick={refresh} loading={list.loading} icon={<RefreshCw size={14} aria-hidden />}>Refresh</Button>}
      />

      {list.error && <ErrorBanner message={String(list.error)} onRetry={refresh} className="mb-4" />}
      {list.loading && !list.data && <Spinner label="Checking services" />}

      {list.data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <StatTile label="Stopped" value={stopped} hint="Off as intended" />
            <StatTile label="Running" value={running} hint={running ? "Expected off, check below" : "Nothing unexpected"} />
            <StatTile label="Archived or removed" value={archived} />
          </div>

          {GROUPS.map(group => {
            const rows = items.filter(i => i.group === group);
            if (!rows.length) return null;
            return (
              <Card key={group} className="mb-4">
                <CardHeader title={group} />
                <CardBody className="divide-y divide-slate-100 py-0">
                  {rows.map(item => {
                    const b = stateBadge(item);
                    return (
                      <section key={item.id} className="py-4" aria-labelledby={`p-${item.id}`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 id={`p-${item.id}`} className="text-sm font-semibold text-slate-900">{item.name}</h3>
                          <Badge tone={b.tone} dot>{b.label}</Badge>
                        </div>
                        <dl className="space-y-1.5">
                          <Line label="What it did">{item.whatItDid}</Line>
                          <Line label="How stopped">{item.howStopped}</Line>
                          <Line label="Since">{item.stoppedOn}</Line>
                          <Line label="To resume">
                            {item.group === "Hive switches" ? <Link href="/admin/settings" className="text-amber-700 hover:underline">{item.howToResume}</Link> : item.howToResume}
                          </Line>
                          {item.detail && <Line label="Live detail"><span className="text-slate-600">{item.detail}</span></Line>}
                        </dl>
                        {item.warning && (
                          <p className="mt-2 flex items-start gap-2 text-sm text-amber-800 bg-amber-50 rounded-md px-3 py-2">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />{item.warning}
                          </p>
                        )}
                      </section>
                    );
                  })}
                </CardBody>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
