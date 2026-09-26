"use client";

import { useState, useEffect } from "react";
import { sweetleaseApi } from "@/lib/api";
import { ErrorBanner, Spinner } from "@/components/ui/AsyncState";
import { toast } from "sonner";
import {
  RefreshCw,
  CheckCheck,
  Clock,
  AlertTriangle,
  XCircle,
} from "lucide-react";

// --- Types ---

interface Commitment {
  id: string;
  contactId: string;
  contactName: string;
  description: string;
  owner: "US" | "THEM";
  dueDate: string | null;
  status: "OPEN" | "FULFILLED" | "MISSED" | "OVERDUE";
  createdAt: string;
}

interface CommitmentsResponse {
  commitments: Commitment[];
  total: number;
}

type FilterKey = "ALL" | "OPEN" | "OVERDUE" | "FULFILLED" | "MISSED";

// --- Helpers ---

function isOverdue(c: Commitment): boolean {
  if (c.status === "FULFILLED" || c.status === "MISSED") return false;
  if (!c.dueDate) return false;
  return new Date(c.dueDate) < new Date();
}

function statusBadge(status: string, overdue: boolean) {
  if (overdue || status === "OVERDUE") {
    return (
      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-red-500/20 text-red-400 flex items-center gap-1">
        <AlertTriangle size={10} />
        Overdue
      </span>
    );
  }
  const styles: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    OPEN: { bg: "bg-blue-500/20", text: "text-blue-400", icon: <Clock size={10} /> },
    FULFILLED: { bg: "bg-green-500/20", text: "text-green-400", icon: <CheckCheck size={10} /> },
    MISSED: { bg: "bg-red-500/20", text: "text-red-400", icon: <XCircle size={10} /> },
  };
  const s = styles[status] || styles.OPEN;
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${s.bg} ${s.text} flex items-center gap-1`}>
      {s.icon}
      {status}
    </span>
  );
}

// --- Component ---

export default function CommitmentsPage() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCommitments = async () => {
    try {
      const params: Record<string, string> = {};
      if (filter !== "ALL") {
        params.status = filter;
      }
      const data = await sweetleaseApi.get<CommitmentsResponse>(
        "/api/admin/concierge/commitments",
        params
      );
      setCommitments(data.commitments);
      setTotal(data.total);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load commitments");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkStatus = async (id: string, newStatus: "FULFILLED" | "MISSED") => {
    setActionLoading(id);
    try {
      await sweetleaseApi.patch(`/api/admin/concierge/commitments/${id}`, {
        status: newStatus,
      });
      await fetchCommitments();
      toast.success(`Commitment marked as ${newStatus.toLowerCase()}.`);
    } catch (err: any) {
      toast.error("Failed to update commitment", { description: err?.message });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchCommitments();
  }, [filter]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "OPEN", label: "Open" },
    { key: "OVERDUE", label: "Overdue" },
    { key: "FULFILLED", label: "Fulfilled" },
    { key: "MISSED", label: "Missed" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <CheckCheck size={24} className="text-amber-500" />
            Commitments
            {total > 0 && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-slate-600 text-slate-900 rounded-full">
                {total}
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track promises made to and by contacts
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchCommitments(); }}
          className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-500 hover:text-slate-900 rounded-lg text-sm transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-4">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              filter === f.key
                ? "bg-amber-600 text-white"
                : "bg-slate-50 text-slate-500 hover:text-slate-900"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="p-4">
            <ErrorBanner message={error} onRetry={() => { setLoading(true); fetchCommitments(); }} />
          </div>
        ) : commitments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No commitments found for this filter.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {commitments.map((c) => {
                const overdue = isOverdue(c);
                const isTerminal = c.status === "FULFILLED" || c.status === "MISSED";
                return (
                  <tr
                    key={c.id}
                    className={`border-b border-slate-200 hover:bg-slate-50 transition ${
                      overdue ? "border-l-2 border-l-red-500" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-900 font-medium">
                      <a
                        href={`/admin/concierge/contacts/${c.contactId}`}
                        className="hover:text-amber-400 transition"
                      >
                        {c.contactName}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                      {c.description}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                          c.owner === "US"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {c.owner === "US" ? "Us" : "Them"}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs ${overdue ? "text-red-400 font-medium" : "text-slate-500"}`}>
                      {c.dueDate
                        ? new Date(c.dueDate).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(c.status, overdue)}
                    </td>
                    <td className="px-4 py-3">
                      {!isTerminal && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleMarkStatus(c.id, "FULFILLED")}
                            disabled={actionLoading === c.id}
                            className="text-[10px] font-medium px-2 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition disabled:opacity-50"
                          >
                            {actionLoading === c.id ? "..." : "Fulfilled"}
                          </button>
                          <button
                            onClick={() => handleMarkStatus(c.id, "MISSED")}
                            disabled={actionLoading === c.id}
                            className="text-[10px] font-medium px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition disabled:opacity-50"
                          >
                            {actionLoading === c.id ? "..." : "Missed"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
