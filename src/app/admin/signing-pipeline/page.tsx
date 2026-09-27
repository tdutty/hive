"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { usePolling } from "@/lib/hooks";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { Button, Card, CardHeader, Badge, statusTone, StatTile, PageHeader, Table, THead, TH, TBody, TR, TD } from "@/components/kit";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRightLeft,
  DollarSign,
} from "lucide-react";

interface PipelineEntry {
  documentId: string;
  tenantName: string;
  tenantEmail: string;
  landlordName: string;
  property: string;
  monthlyRent: number;
  createdAt: string;
  hoursOld: number;
  daysOld: number;
  landlordSigned: boolean;
  status: "new" | "reminder_sent" | "at_risk" | "expired";
  signingUrl: string | null;
}

interface CompletedEntry {
  documentId: string;
  tenantName: string;
  landlordName: string;
  property: string;
  monthlyRent: number;
  completedAt: string;
}

interface CancelledEntry {
  documentId: string;
  tenantName: string;
  property: string;
  cancelledAt: string;
}

interface FundsHeldEntry {
  notificationId: string;
  landlordName: string;
  landlordEmail: string;
  landlordPhone: string;
  property: string;
  amount: number;
  onboardingStatus: string;
  createdAt: string;
}

interface SwapCandidate {
  candidateName: string;
  candidateEmail: string;
  property: string;
  sentAt: string;
  read: boolean;
}

interface PipelineData {
  summary: {
    pendingSignatures: number;
    atRisk: number;
    completedAllTime: number;
    cancelledAllTime: number;
    fundsHeld: number;
  };
  atRisk: PipelineEntry[];
  pending: PipelineEntry[];
  recentCompleted: CompletedEntry[];
  recentCancelled: CancelledEntry[];
  fundsHeld: FundsHeldEntry[];
  swapCandidates: SwapCandidate[];
}

export default function SigningPipelinePage() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await api.get<PipelineData>(
 "/api/admin/signing-pipeline"
      );
      setData(result);
      setLastRefresh(new Date());
      setError("");
    } catch (err: any) {
      setError(err?.message ? `Failed to load signing pipeline data: ${err.message}` : "Failed to load signing pipeline data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  usePolling(fetchData, 30000);

  const statusBadge = (status: string) => (
    <Badge tone={statusTone(status)} dot>{status.replace("_", " ")}</Badge>
  );

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Signing Pipeline"
        description="Track lease signatures, reminders, and tenant swaps"
        actions={<>
          {lastRefresh && (
            <span className="text-xs text-slate-500 tabular">Updated {lastRefresh.toLocaleTimeString()}</span>
          )}
          <Button icon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />} onClick={fetchData} disabled={loading}>
            Refresh
          </Button>
        </>}
      />

      {error && <ErrorBanner className="mb-5" message={error} onRetry={fetchData} />}

      {loading && !data && <Spinner label="Loading signing pipeline" />}

      {data && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatTile label="Awaiting Signature" value={data.summary.pendingSignatures} icon={<Clock size={14} />} />
            <StatTile label="At Risk (72h+)" value={data.summary.atRisk} icon={<AlertTriangle size={14} />} />
            <StatTile label="Completed" value={data.summary.completedAllTime} icon={<CheckCircle size={14} />} />
            <StatTile label="Cancelled" value={data.summary.cancelledAllTime} icon={<XCircle size={14} />} />
            <StatTile label="Funds Held" value={data.summary.fundsHeld} icon={<DollarSign size={14} />} hint={data.summary.fundsHeld > 0 ? "Landlord onboarding needed" : undefined} />
          </div>

          {/* Funds Held: Landlords Need to Onboard */}
          {data.fundsHeld.length > 0 && (
            <Card>
              <CardHeader
                title={<span className="inline-flex items-center gap-2"><DollarSign size={16} className="text-amber-600" aria-hidden />Funds Held: Landlord Bank Account Needed</span>}
                description="Call these landlords to complete their Stripe Connect setup"
              />
              <Table>
                <THead>
                  <tr>
                    <TH>Landlord</TH>
                    <TH>Contact</TH>
                    <TH>Property</TH>
                    <TH numeric>Amount Held</TH>
                    <TH>Status</TH>
                    <TH>Since</TH>
                  </tr>
                </THead>
                <TBody>
                  {data.fundsHeld.map((entry) => (
                    <TR key={entry.notificationId}>
                      <TD className="font-medium">{entry.landlordName}</TD>
                      <TD>
                        <div>{entry.landlordPhone || "No phone"}</div>
                        <div className="text-xs text-slate-500">{entry.landlordEmail}</div>
                      </TD>
                      <TD muted>{entry.property}</TD>
                      <TD numeric className="font-medium">${entry.amount.toLocaleString()}</TD>
                      <TD><Badge tone={statusTone(entry.onboardingStatus)} dot>{entry.onboardingStatus}</Badge></TD>
                      <TD muted className="tabular whitespace-nowrap">{new Date(entry.createdAt).toLocaleDateString()}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}

          {/* At Risk Tenants */}
          {data.atRisk.length > 0 && (
            <Card className="border-red-200">
              <CardHeader title={<span className="inline-flex items-center gap-2 text-red-900"><AlertTriangle size={16} className="text-red-600" aria-hidden />At Risk: Action Required</span>} />
              <div className="divide-y divide-slate-100">
                {data.atRisk.map((entry) => (
                  <div key={entry.documentId} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900">{entry.tenantName}</div>
                      <div className="text-sm text-slate-500">{entry.property} · ${entry.monthlyRent}/mo</div>
                      <div className="text-xs text-slate-500 mt-0.5">{entry.tenantEmail}</div>
                    </div>
                    <div className="sm:text-right shrink-0">
                      {statusBadge(entry.status)}
                      <div className="text-sm text-red-700 font-medium mt-1 tabular">{entry.daysOld} days unsigned</div>
                      <div className="text-xs text-slate-500">
                        {entry.daysOld >= 7
                          ? "Will be cancelled"
                          : `${7 - entry.daysOld} days until auto-cancel`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Pending Signatures */}
          {data.pending.length > 0 && (
            <Card>
              <CardHeader title="Pending Signatures" />
              <Table>
                <THead>
                  <tr>
                    <TH>Tenant</TH>
                    <TH>Property</TH>
                    <TH numeric>Rent</TH>
                    <TH>Landlord Signed</TH>
                    <TH numeric>Age</TH>
                    <TH>Status</TH>
                  </tr>
                </THead>
                <TBody>
                  {data.pending.map((entry) => (
                    <TR key={entry.documentId}>
                      <TD>
                        <div className="font-medium">{entry.tenantName}</div>
                        <div className="text-xs text-slate-500">{entry.tenantEmail}</div>
                      </TD>
                      <TD muted>{entry.property}</TD>
                      <TD numeric className="font-medium">${entry.monthlyRent}</TD>
                      <TD>
                        {entry.landlordSigned ? (
                          <CheckCircle size={16} className="text-emerald-600" aria-label="Landlord signed" />
                        ) : (
                          <Clock size={16} className="text-slate-400" aria-label="Awaiting landlord" />
                        )}
                      </TD>
                      <TD numeric muted>{entry.hoursOld}h</TD>
                      <TD>{statusBadge(entry.status)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}

          {/* Swap Candidates */}
          {data.swapCandidates.length > 0 && (
            <Card>
              <CardHeader title={<span className="inline-flex items-center gap-2"><ArrowRightLeft size={16} className="text-amber-600" aria-hidden />Swap Candidates</span>} />
              <Table>
                <THead>
                  <tr>
                    <TH>Candidate</TH>
                    <TH>Property</TH>
                    <TH>Notified</TH>
                    <TH>Seen</TH>
                  </tr>
                </THead>
                <TBody>
                  {data.swapCandidates.map((s, i) => (
                    <TR key={i}>
                      <TD>
                        <div className="font-medium">{s.candidateName}</div>
                        <div className="text-xs text-slate-500">{s.candidateEmail}</div>
                      </TD>
                      <TD muted>{s.property}</TD>
                      <TD muted className="tabular whitespace-nowrap">{new Date(s.sentAt).toLocaleDateString()}</TD>
                      <TD>
                        {s.read ? (
                          <CheckCircle size={14} className="text-emerald-600" aria-label="Seen" />
                        ) : (
                          <span className="text-xs text-slate-500">No</span>
                        )}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}

          {/* Recent Completed */}
          {data.recentCompleted.length > 0 && (
            <Card>
              <CardHeader title="Recently Completed (30 days)" />
              <Table>
                <THead>
                  <tr>
                    <TH>Tenant</TH>
                    <TH>Landlord</TH>
                    <TH>Property</TH>
                    <TH numeric>Rent</TH>
                    <TH>Completed</TH>
                  </tr>
                </THead>
                <TBody>
                  {data.recentCompleted.map((entry) => (
                    <TR key={entry.documentId}>
                      <TD className="font-medium">{entry.tenantName}</TD>
                      <TD muted>{entry.landlordName}</TD>
                      <TD muted>{entry.property}</TD>
                      <TD numeric className="font-medium">${entry.monthlyRent}</TD>
                      <TD muted className="tabular whitespace-nowrap">{new Date(entry.completedAt).toLocaleDateString()}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}

          {/* Recent Cancelled */}
          {data.recentCancelled.length > 0 && (
            <Card>
              <CardHeader title="Recently Cancelled (30 days)" />
              <div className="divide-y divide-slate-100">
                {data.recentCancelled.map((entry) => (
                  <div key={entry.documentId} className="px-4 py-2.5 flex items-center justify-between gap-4">
                    <div className="min-w-0 truncate">
                      <span className="text-sm font-medium text-slate-900">{entry.tenantName}</span>
                      <span className="text-sm text-slate-500 ml-2">· {entry.property}</span>
                    </div>
                    <span className="text-xs text-slate-500 tabular shrink-0">{new Date(entry.cancelledAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Empty State */}
          {data.pending.length === 0 &&
            data.atRisk.length === 0 &&
            data.recentCompleted.length === 0 && (
              <Card>
                <EmptyState icon={<CheckCircle size={28} className="mx-auto text-emerald-500" aria-hidden />} title="All clear" hint="No pending signatures or at-risk tenants." />
              </Card>
            )}
        </div>
      )}
    </div>
  );
}
