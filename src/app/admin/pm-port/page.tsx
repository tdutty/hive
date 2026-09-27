"use client";

import { useState, useEffect, useCallback } from "react";
import { sweetleaseApi } from "@/lib/api";
import { Button, Card, CardHeader, PageHeader, Badge, Table, THead, TH, TBody, TR, TD } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import {
  Inbox,
  RefreshCw,
  CheckCircle2,
  X,
  Building2,
  MapPin,
  BedDouble,
  DollarSign,
} from "lucide-react";

interface PortedProperty {
  id: string;
  pmCompanyId: string;
  company?: string;
  source: string;
  status: string;
  title: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  propertyType: string | null;
  createdAt: string;
}

interface RollupRow {
  pmCompanyId: string;
  company?: string;
  status: string;
  n: number;
}

interface StagingResponse {
  count: number;
  rollup: RollupRow[];
  properties: PortedProperty[];
}

export default function PMPortReviewPage() {
  const [data, setData] = useState<StagingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await sweetleaseApi.get<StagingResponse>("/api/admin/pm-port/staging");
      setData(res);
    } catch {
      setError("Failed to load staging queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (ids: string[], reject: boolean) => {
    setBusy(ids.join(",") + (reject ? ":reject" : ":approve"));
    try {
      await sweetleaseApi.post("/api/admin/pm-port/approve", { ids, reject });
      await load();
    } catch {
      setError(reject ? "Reject failed" : "Approve failed");
    } finally {
      setBusy(null);
    }
  };

  const approveCompany = async (pmCompanyId: string) => {
    setBusy(pmCompanyId + ":all");
    try {
      await sweetleaseApi.post("/api/admin/pm-port/approve", { pmCompanyId });
      await load();
    } catch {
      setError("Approve-all failed");
    } finally {
      setBusy(null);
    }
  };

  // group staged properties by company
  const byCompany = (data?.properties || []).reduce<Record<string, PortedProperty[]>>((acc, p) => {
    (acc[p.pmCompanyId] ||= []).push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="PM Port Review"
        description="Properties accepted PMs sent in, awaiting approval to go live."
        actions={
          <Button variant="ghost" size="icon" aria-label="Refresh" onClick={load}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={load} className="mb-4" />}

      {loading ? (
        <Spinner label="Loading staging queue" />
      ) : !data || data.count === 0 ? (
        <Card>
          <EmptyState
            title="Nothing staged"
            hint="When an accepted PM uploads units, they show up here."
            icon={<Inbox size={28} className="mx-auto" aria-hidden />}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(byCompany).map(([pmCompanyId, props]) => (
            <Card key={pmCompanyId} className="overflow-hidden">
              <CardHeader
                title={
                  <span className="inline-flex items-center gap-2">
                    <Building2 size={16} className="text-slate-500" aria-hidden />
                    {props[0].company || pmCompanyId}
                  </span>
                }
                description={`${props.length} staged`}
                actions={
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle2 size={14} />}
                    onClick={() => approveCompany(pmCompanyId)}
                    loading={busy === pmCompanyId + ":all"}
                    disabled={busy === pmCompanyId + ":all"}
                  >
                    Approve all
                  </Button>
                }
              />
              <Table>
                <THead>
                  <tr>
                    <TH>Property</TH>
                    <TH numeric>Actions</TH>
                  </tr>
                </THead>
                <TBody>
                  {props.map((p) => (
                    <TR key={p.id}>
                      <TD>
                        <div className="font-medium text-slate-900">{p.title || `${p.bedrooms ?? "?"}BR`}</div>
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                          <span className="inline-flex items-center gap-1"><MapPin size={12} aria-hidden />{p.address}, {p.city} {p.state}</span>
                          <span className="inline-flex items-center gap-1 tabular"><BedDouble size={12} aria-hidden />{p.bedrooms}bd/{p.bathrooms ?? "?"}ba</span>
                          <span className="inline-flex items-center gap-1 tabular"><DollarSign size={12} aria-hidden />{p.price?.toLocaleString()}</span>
                          <Badge tone="outline" className="uppercase tracking-wide">{p.source}</Badge>
                        </div>
                      </TD>
                      <TD numeric className="whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <Button size="sm" icon={<CheckCircle2 size={13} />} onClick={() => act([p.id], false)} disabled={!!busy} loading={busy === p.id + ":approve"}>
                            Approve
                          </Button>
                          <Button size="sm" variant="ghost" icon={<X size={13} />} onClick={() => act([p.id], true)} disabled={!!busy} loading={busy === p.id + ":reject"}>
                            Reject
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
