"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Edit2, Save, X, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { MetricCard } from "@/components/ui/MetricCard";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, Zap } from "lucide-react";

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

export default function APIUsagePage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editSubs, setEditSubs] = useState<ManualSubscription[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.get<BillingData>("/api/admin/billing");
      setData(result);
      setEditSubs(result.manualSubscriptions);
    } catch (err) {
      console.error("Failed to load billing data:", err);
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
      fetchData();
    } catch (err) {
      console.error("Failed to save:", err);
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
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="animate-spin text-amber-600" size={32} />
      </div>
    );
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            API Usage &amp; Costs
          </h1>
          <p className="text-slate-500">
            Live billing data + manual subscription tracking
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Burn"
          value={formatCurrency(summary?.totalMonthlyCost || 0)}
          icon={DollarSign}
        />
        <MetricCard
          title="Active Services"
          value={String(summary?.activeServices || 0)}
          icon={Zap}
        />
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 mb-1">
            DO Month-to-Date
          </p>
          <p className="text-2xl font-semibold text-amber-600">
            {summary?.doMtdSpend !== null
              ? formatCurrency(summary?.doMtdSpend || 0)
              : "N/A"}
          </p>
          <p className="text-xs text-slate-400 mt-1">Live from DigitalOcean</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-500 mb-1">
            Stripe Balance
          </p>
          <p className="text-2xl font-semibold text-slate-900">
            {summary?.stripeBalance !== null
              ? formatCurrency(summary?.stripeBalance || 0)
              : "N/A"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {summary?.stripeLiveMode ? "LIVE" : "TEST MODE"}
          </p>
        </div>
      </div>

      {/* Live Services */}
      {liveServices.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            Live Data
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {liveServices.map((svc) => (
              <div
                key={svc.name}
                className="bg-white border border-slate-200 rounded-lg shadow-sm p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {svc.name}
                    </h3>
                    <span className="text-xs text-slate-500">{svc.plan}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded">
                    LIVE
                  </span>
                </div>

                {/* DigitalOcean details */}
                {svc.mtdSpend !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">MTD Spend</span>
                      <span className="font-semibold text-amber-600">
                        {formatCurrency(svc.mtdSpend)}
                      </span>
                    </div>
                    {svc.lastInvoices?.map((inv) => (
                      <div
                        key={inv.period}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-slate-400">{inv.period}</span>
                        <span className="text-slate-600">
                          {formatCurrency(inv.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stripe details */}
                {svc.availableBalance !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Available</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(svc.availableBalance)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Pending</span>
                      <span className="text-slate-600">
                        {formatCurrency(svc.pendingBalance || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Mode</span>
                      <span
                        className={`font-medium ${svc.isLiveMode ? "text-green-600" : "text-amber-600"}`}
                      >
                        {svc.isLiveMode ? "LIVE" : "TEST"}
                      </span>
                    </div>
                    {svc.costPerCall && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Fee</span>
                        <span className="text-slate-600">
                          {svc.costPerCall}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Subscriptions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Subscriptions &amp; Renewals
          </h2>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100"
            >
              <Edit2 size={14} />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={addSub}
                className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                <Plus size={14} />
                Add
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditSubs(data?.manualSubscriptions || []);
                }}
                className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left font-semibold text-slate-600 px-5 py-3">
                  Service
                </th>
                <th className="text-left font-semibold text-slate-600 px-5 py-3">
                  Category
                </th>
                <th className="text-left font-semibold text-slate-600 px-5 py-3">
                  Plan
                </th>
                <th className="text-right font-semibold text-slate-600 px-5 py-3">
                  Cost
                </th>
                <th className="text-left font-semibold text-slate-600 px-5 py-3">
                  Per Call
                </th>
                <th className="text-left font-semibold text-slate-600 px-5 py-3">
                  Renewal
                </th>
                <th className="text-left font-semibold text-slate-600 px-5 py-3">
                  Status
                </th>
                {editing && (
                  <th className="text-center font-semibold text-slate-600 px-3 py-3">
                    Del
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
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
                    <tr
                      key={sub.id || idx}
                      className="border-b border-slate-100"
                    >
                      <td className="px-3 py-2">
                        <input
                          value={sub.name}
                          onChange={(e) =>
                            updateSub(idx, "name", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                          placeholder="Service name"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={sub.category}
                          onChange={(e) =>
                            updateSub(idx, "category", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                          placeholder="Category"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={sub.plan}
                          onChange={(e) =>
                            updateSub(idx, "plan", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                          placeholder="Plan"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={sub.monthlyCost}
                          onChange={(e) =>
                            updateSub(
                              idx,
                              "monthlyCost",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-20 px-2 py-1 border border-slate-200 rounded text-sm text-right"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={sub.costPerCall || ""}
                          onChange={(e) =>
                            updateSub(idx, "costPerCall", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                          placeholder="—"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={sub.renewalDate}
                          onChange={(e) =>
                            updateSub(idx, "renewalDate", e.target.value)
                          }
                          className="w-28 px-2 py-1 border border-slate-200 rounded text-sm"
                          placeholder="YYYY-MM-DD"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={sub.status}
                          onChange={(e) =>
                            updateSub(idx, "status", e.target.value)
                          }
                          className="px-2 py-1 border border-slate-200 rounded text-sm"
                        >
                          <option value="active">Active</option>
                          <option value="trial">Trial</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => removeSub(idx)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={sub.id || idx}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">
                        {sub.name}
                      </div>
                      {sub.notes && (
                        <div className="text-xs text-slate-400 mt-0.5">
                          {sub.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {sub.category}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{sub.plan}</td>
                    <td className="px-5 py-3 text-right">
                      {sub.monthlyCost > 0 ? (
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(sub.monthlyCost)}
                          <span className="text-slate-400 font-normal">
                            /{sub.billingCycle === "annual" ? "yr" : "mo"}
                          </span>
                        </span>
                      ) : (
                        <span className="text-green-600 font-medium">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {sub.costPerCall || "—"}
                    </td>
                    <td className="px-5 py-3">
                      {sub.renewalDate === "N/A" ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <div>
                          <div className="text-slate-900">
                            {new Date(sub.renewalDate).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </div>
                          {daysUntil !== null && daysUntil <= 14 && (
                            <div
                              className={`text-xs font-medium ${daysUntil <= 3 ? "text-red-600" : "text-amber-600"}`}
                            >
                              {daysUntil <= 0 ? "Overdue" : `${daysUntil}d`}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          sub.status === "active"
                            ? "bg-green-50 text-green-700"
                            : sub.status === "trial"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Next Renewal Alert */}
      {nextRenewalDays !== null && nextRenewalDays <= 14 && (
        <div
          className={`border rounded-lg p-4 flex items-center justify-between ${nextRenewalDays <= 3 ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}
        >
          <span
            className={
              nextRenewalDays <= 3 ? "text-red-900" : "text-amber-900"
            }
          >
            <strong>{summary?.nextRenewal?.name}</strong> renews in{" "}
            {nextRenewalDays} days (
            {new Date(summary?.nextRenewal?.date || "").toLocaleDateString()})
          </span>
        </div>
      )}
    </div>
  );
}
