"use client";

import { useState, useEffect, useCallback } from "react";
import { sweetleaseApi } from "@/lib/api";
import {
  Inbox,
  RefreshCw,
  Loader2,
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Inbox className="text-orange-500" size={28} />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">PM Port Review</h1>
            <p className="text-sm text-gray-500">Properties accepted PMs sent in, awaiting approval to go live.</p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin" size={18} /> Loading…</div>
      ) : !data || data.count === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Inbox size={40} className="mx-auto mb-3 opacity-40" />
          Nothing staged. When an accepted PM uploads units, they show up here.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCompany).map(([pmCompanyId, props]) => (
            <div key={pmCompanyId} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-gray-500" />
                  <span className="font-medium text-gray-900">{props[0].company || pmCompanyId}</span>
                  <span className="text-xs text-gray-500">{props.length} staged</span>
                </div>
                <button
                  onClick={() => approveCompany(pmCompanyId)}
                  disabled={busy === pmCompanyId + ":all"}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
                >
                  {busy === pmCompanyId + ":all" ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                  Approve all
                </button>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {props.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{p.title || `${p.bedrooms ?? "?"}BR`}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1"><MapPin size={12} />{p.address}, {p.city} {p.state}</span>
                          <span className="flex items-center gap-1"><BedDouble size={12} />{p.bedrooms}bd/{p.bathrooms ?? "?"}ba</span>
                          <span className="flex items-center gap-1"><DollarSign size={12} />{p.price?.toLocaleString()}</span>
                          <span className="uppercase tracking-wide text-gray-400">{p.source}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => act([p.id], false)}
                          disabled={!!busy}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 mr-2"
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>
                        <button
                          onClick={() => act([p.id], true)}
                          disabled={!!busy}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                        >
                          <X size={13} /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
