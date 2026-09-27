"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Edit2, Save, X, Plus, Trash2, DollarSign, Zap } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button, Card, CardHeader, CardBody, Badge, statusTone, StatTile, PageHeader, Table, THead, TH, TBody, TR, TD, Input, Select } from "@/components/kit";
import type { BadgeProps } from "@/components/kit/Badge";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { formatCurrency } from "@/lib/utils";

interface ManualSubscription {
  id: string;
  name: string;
  category: string;
  plan: string;
  monthlyCost: number;
  billingCycle: "monthly" | "annual";
  renewalDate: string;
  status: "active" | "trial" | "cancelled";
  costPerCall?: string;
  notes?: string;
}

interface LiveService {
  name: string;
  category: string;
  plan: string;
  status: string;
  live: true;
  monthlyCost: number;
  mtdSpend?: number;
  accountBalance?: number;
  lastInvoices?: Array<{ period: string; amount: number }>;
  availableBalance?: number;
  pendingBalance?: number;
  isLiveMode?: boolean;
  costPerCall?: string;
  recentCharges?: Array<{ amount: number; status: string; created: string }>;
}

interface BillingData {
  liveServices: LiveService[];
  manualSubscriptions: ManualSubscription[];
  summary: {
    totalMonthlyCost: number;
    activeServices: number;
    nextRenewal: { name: string; date: string } | null;
    doMtdSpend: number | null;
    stripeBalance: number | null;
    stripeLiveMode: boolean;
  };
}

const EMPTY_SUB: ManualSubscription = {
  id: "",
  name: "",
  category: "",
  plan: "",
  monthlyCost: 0,
  billingCycle: "monthly",
  renewalDate: "N/A",
  status: "active",
  costPerCall: "",
  notes: "",
};

type BadgeTone = NonNullable<BadgeProps["tone"]>;
/** trial and cancelled are not in the shared status map. */
const subTone = (status: ManualSubscription["status"]): BadgeTone =>
  status === "trial" ? "warning" : status === "cancelled" ? "danger" : statusTone(status) ?? "neutral";

export default function APIUsagePage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editSubs, setEditSubs] = useState<ManualSubscription[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<BillingData>("/api/admin/billing");
      setData(result);
      setEditSubs(result.manualSubscriptions);
    } catch (err: any) {
      setError(err?.message || "Failed to load billing data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/api/admin/billing", { subscriptions: editSubs });
      setEditing(false);
      toast.success("Subscriptions saved");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to save subscriptions", { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  const updateSub = (index: number, field: string, value: string | number) => {
    setEditSubs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addSub = () => {
    setEditSubs((prev) => [...prev, { ...EMPTY_SUB, id: `sub-${Date.now()}` }]);
  };

  const removeSub = (index: number) => {
    setEditSubs((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return <div className="max-w-7xl"><PageHeader title="API Usage & Costs" /><Spinner label="Loading billing data" /></div>;
  }

  if (error && !data) {
    return <div className="max-w-7xl"><PageHeader title="API Usage & Costs" /><ErrorBanner message={error} onRetry={fetchData} /></div>;
  }

  const summary = data?.summary;
  const liveServices = data?.liveServices || [];
  const manualSubs = editing ? editSubs : data?.manualSubscriptions || [];

  const nextRenewalDays = summary?.nextRenewal
    ? Math.ceil(
        (new Date(summary.nextRenewal.date).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="API Usage & Costs"
        description="Live billing data + manual subscription tracking"
        actions={
          <Button variant="ghost" size="icon" aria-label="Refresh" onClick={fetchData}>
            <RefreshCw size={15} />
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={fetchData} className="mb-5" />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile label="Monthly Burn" value={formatCurrency(summary?.totalMonthlyCost || 0)} icon={<DollarSign size={14} />} />
        <StatTile label="Active Services" value={String(summary?.activeServices || 0)} icon={<Zap size={14} />} />
        <StatTile
          label="DO Month-to-Date"
          value={summary?.doMtdSpend !== null ? formatCurrency(summary?.doMtdSpend || 0) : "N/A"}
          hint="Live from DigitalOcean"
        />
        <StatTile
          label="Stripe Balance"
          value={summary?.stripeBalance !== null ? formatCurrency(summary?.stripeBalance || 0) : "N/A"}
          hint={summary?.stripeLiveMode ? "LIVE" : "TEST MODE"}
        />
      </div>

      {liveServices.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-md font-semibold text-slate-900">Live Data</h2>
            <Badge tone="success" dot>Live</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {liveServices.map((svc) => (
              <Card key={svc.name}>
                <CardHeader title={svc.name} description={svc.plan} actions={<Badge tone="success" dot>Live</Badge>} />
                <CardBody>
                  {svc.mtdSpend !== undefined && (
                    <dl className="divide-y divide-slate-100">
                      <div className="flex justify-between items-center py-1.5 gap-4">
                        <dt className="text-sm text-slate-500">MTD Spend</dt>
                        <dd className="text-sm font-semibold text-slate-900 tabular">{formatCurrency(svc.mtdSpend)}</dd>
                      </div>
                      {svc.lastInvoices?.map((inv) => (
                        <div key={inv.period} className="flex justify-between items-center py-1.5 gap-4">
                          <dt className="text-sm text-slate-500">{inv.period}</dt>
                          <dd className="text-sm text-slate-700 tabular">{formatCurrency(inv.amount)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {svc.availableBalance !== undefined && (
                    <dl className="divide-y divide-slate-100">
                      <div className="flex justify-between items-center py-1.5 gap-4">
                        <dt className="text-sm text-slate-500">Available</dt>
                        <dd className="text-sm font-semibold text-slate-900 tabular">{formatCurrency(svc.availableBalance)}</dd>
                      </div>
                      <div className="flex justify-between items-center py-1.5 gap-4">
                        <dt className="text-sm text-slate-500">Pending</dt>
                        <dd className="text-sm text-slate-700 tabular">{formatCurrency(svc.pendingBalance || 0)}</dd>
                      </div>
                      <div className="flex justify-between items-center py-1.5 gap-4">
                        <dt className="text-sm text-slate-500">Mode</dt>
                        <dd><Badge tone={svc.isLiveMode ? "success" : "warning"}>{svc.isLiveMode ? "LIVE" : "TEST"}</Badge></dd>
                      </div>
                      {svc.costPerCall && (
                        <div className="flex justify-between items-center py-1.5 gap-4">
                          <dt className="text-sm text-slate-500">Fee</dt>
                          <dd className="text-sm text-slate-700">{svc.costPerCall}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Card className="mb-5">
        <CardHeader
          title="Subscriptions & Renewals"
          actions={
            !editing ? (
              <Button variant="primary" size="sm" icon={<Edit2 size={14} />} onClick={() => setEditing(true)}>
                Edit
              </Button>
            ) : (
              <>
                <Button size="sm" icon={<Plus size={14} />} onClick={addSub}>Add</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<X size={14} />}
                  onClick={() => {
                    setEditing(false);
                    setEditSubs(data?.manualSubscriptions || []);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" icon={<Save size={14} />} loading={saving} onClick={handleSave}>
                  {saving ? "Saving" : "Save"}
                </Button>
              </>
            )
          }
        />
        {manualSubs.length === 0 ? (
          <EmptyState title="No subscriptions tracked" hint={editing ? "Use Add to track a service." : "Edit to add a service."} />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Service</TH>
                <TH>Category</TH>
                <TH>Plan</TH>
                <TH numeric>Cost</TH>
                <TH>Per Call</TH>
                <TH>Renewal</TH>
                <TH>Status</TH>
                {editing && <TH aria-label="Delete" />}
              </tr>
            </THead>
            <TBody>
              {manualSubs.map((sub, idx) => {
                const daysUntil =
                  sub.renewalDate !== "N/A"
                    ? Math.ceil(
                        (new Date(sub.renewalDate).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null;

                if (editing) {
                  return (
                    <TR key={sub.id || idx}>
                      <TD>
                        <Input
                          aria-label="Service name"
                          value={sub.name}
                          onChange={(e) => updateSub(idx, "name", e.target.value)}
                          placeholder="Service name"
                          className="h-8 min-w-[9rem]"
                        />
                      </TD>
                      <TD>
                        <Input
                          aria-label="Category"
                          value={sub.category}
                          onChange={(e) => updateSub(idx, "category", e.target.value)}
                          placeholder="Category"
                          className="h-8 min-w-[7rem]"
                        />
                      </TD>
                      <TD>
                        <Input
                          aria-label="Plan"
                          value={sub.plan}
                          onChange={(e) => updateSub(idx, "plan", e.target.value)}
                          placeholder="Plan"
                          className="h-8 min-w-[7rem]"
                        />
                      </TD>
                      <TD numeric>
                        <Input
                          aria-label="Monthly cost"
                          type="number"
                          value={sub.monthlyCost}
                          onChange={(e) => updateSub(idx, "monthlyCost", parseFloat(e.target.value) || 0)}
                          className="h-8 w-24 text-right tabular"
                        />
                      </TD>
                      <TD>
                        <Input
                          aria-label="Cost per call"
                          value={sub.costPerCall || ""}
                          onChange={(e) => updateSub(idx, "costPerCall", e.target.value)}
                          placeholder="-"
                          className="h-8 min-w-[6rem]"
                        />
                      </TD>
                      <TD>
                        <Input
                          aria-label="Renewal date"
                          value={sub.renewalDate}
                          onChange={(e) => updateSub(idx, "renewalDate", e.target.value)}
                          placeholder="YYYY-MM-DD"
                          className="h-8 w-32 tabular"
                        />
                      </TD>
                      <TD>
                        <Select
                          aria-label="Status"
                          value={sub.status}
                          onChange={(e) => updateSub(idx, "status", e.target.value)}
                          className="h-8 w-auto"
                        >
                          <option value="active">Active</option>
                          <option value="trial">Trial</option>
                          <option value="cancelled">Cancelled</option>
                        </Select>
                      </TD>
                      <TD className="w-10">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Remove subscription"
                          className="text-red-700 hover:text-red-800 hover:bg-red-50 px-2"
                          onClick={() => removeSub(idx)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TD>
                    </TR>
                  );
                }

                return (
                  <TR key={sub.id || idx} className="hover:bg-slate-50">
                    <TD>
                      <div className="font-medium text-slate-900">{sub.name}</div>
                      {sub.notes && <div className="text-xs text-slate-500 mt-0.5">{sub.notes}</div>}
                    </TD>
                    <TD muted>{sub.category}</TD>
                    <TD muted>{sub.plan}</TD>
                    <TD numeric>
                      {sub.monthlyCost > 0 ? (
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(sub.monthlyCost)}
                          <span className="text-slate-400 font-normal">/{sub.billingCycle === "annual" ? "yr" : "mo"}</span>
                        </span>
                      ) : (
                        <Badge tone="success">Free</Badge>
                      )}
                    </TD>
                    <TD muted>{sub.costPerCall || "-"}</TD>
                    <TD>
                      {sub.renewalDate === "N/A" ? (
                        <span className="text-slate-400">-</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="tabular whitespace-nowrap">
                            {new Date(sub.renewalDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          {daysUntil !== null && daysUntil <= 14 && (
                            <Badge tone={daysUntil <= 3 ? "danger" : "warning"}>
                              {daysUntil <= 0 ? "Overdue" : `${daysUntil}d`}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TD>
                    <TD><Badge tone={subTone(sub.status)} dot>{sub.status}</Badge></TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>

      {nextRenewalDays !== null && nextRenewalDays <= 14 && (
        <Card>
          <CardBody className="flex flex-wrap items-center gap-3">
            <Badge tone={nextRenewalDays <= 3 ? "danger" : "warning"} dot>
              {nextRenewalDays <= 3 ? "Renews soon" : "Upcoming renewal"}
            </Badge>
            <span className="text-sm text-slate-700">
              <strong>{summary?.nextRenewal?.name}</strong> renews in {nextRenewalDays} days
              {" "}(<span className="tabular">{new Date(summary?.nextRenewal?.date || "").toLocaleDateString()}</span>)
            </span>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
