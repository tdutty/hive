"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
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
    } catch (err) {
      setError("Failed to load signing pipeline data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      reminder_sent: "bg-yellow-100 text-yellow-800",
      at_risk: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || "bg-gray-100 text-gray-600"}`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Signing Pipeline
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track lease signatures, reminders, and tenant swaps
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-gray-400">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock size={20} className="text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {data.summary.pendingSignatures}
                </div>
                <div className="text-xs text-gray-500">Awaiting Signature</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {data.summary.atRisk}
                </div>
                <div className="text-xs text-gray-500">At Risk (72h+)</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {data.summary.completedAllTime}
                </div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <XCircle size={20} className="text-gray-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {data.summary.cancelledAllTime}
                </div>
                <div className="text-xs text-gray-500">Cancelled</div>
              </div>
            </div>
          </div>
          <div className={`bg-white border rounded-lg p-5 ${data.summary.fundsHeld > 0 ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <DollarSign size={20} className="text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {data.summary.fundsHeld}
                </div>
                <div className="text-xs text-gray-500">Funds Held</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Funds Held — Landlords Need to Onboard */}
      {data && data.fundsHeld.length > 0 && (
        <div className="bg-white border border-amber-300 rounded-lg">
          <div className="px-6 py-4 border-b border-amber-200 bg-amber-50 rounded-t-lg">
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-amber-600" />
              <h2 className="font-semibold text-amber-900">
                Funds Held — Landlord Bank Account Needed
              </h2>
            </div>
            <p className="text-xs text-amber-700 mt-1">Call these landlords to complete their Stripe Connect setup</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                <th className="text-left px-6 py-3">Landlord</th>
                <th className="text-left px-6 py-3">Contact</th>
                <th className="text-left px-6 py-3">Property</th>
                <th className="text-left px-6 py-3">Amount Held</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.fundsHeld.map((entry) => (
                <tr key={entry.notificationId} className="hover:bg-amber-50">
                  <td className="px-6 py-3">
                    <div className="font-medium text-sm text-gray-900">{entry.landlordName}</div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-sm text-gray-900">{entry.landlordPhone || 'No phone'}</div>
                    <div className="text-xs text-gray-500">{entry.landlordEmail}</div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">{entry.property}</td>
                  <td className="px-6 py-3 text-sm font-bold text-amber-700">${entry.amount.toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                      {entry.onboardingStatus}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-500">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* At Risk Tenants */}
      {data && data.atRisk.length > 0 && (
        <div className="bg-white border border-red-200 rounded-lg">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50 rounded-t-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600" />
              <h2 className="font-semibold text-red-900">
                At Risk — Action Required
              </h2>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {data.atRisk.map((entry) => (
              <div key={entry.documentId} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {entry.tenantName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {entry.property} — ${entry.monthlyRent}/mo
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {entry.tenantEmail}
                    </div>
                  </div>
                  <div className="text-right">
                    {statusBadge(entry.status)}
                    <div className="text-sm text-red-600 font-medium mt-1">
                      {entry.daysOld} days unsigned
                    </div>
                    <div className="text-xs text-gray-400">
                      {entry.daysOld >= 7
                        ? "Will be cancelled"
                        : `${7 - entry.daysOld} days until auto-cancel`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Signatures */}
      {data && data.pending.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Pending Signatures
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                <th className="text-left px-6 py-3">Tenant</th>
                <th className="text-left px-6 py-3">Property</th>
                <th className="text-left px-6 py-3">Rent</th>
                <th className="text-left px-6 py-3">Landlord Signed</th>
                <th className="text-left px-6 py-3">Age</th>
                <th className="text-left px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.pending.map((entry) => (
                <tr key={entry.documentId} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="font-medium text-sm text-gray-900">
                      {entry.tenantName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {entry.tenantEmail}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {entry.property}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                    ${entry.monthlyRent}
                  </td>
                  <td className="px-6 py-3">
                    {entry.landlordSigned ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <Clock size={16} className="text-gray-400" />
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {entry.hoursOld}h
                  </td>
                  <td className="px-6 py-3">{statusBadge(entry.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Swap Candidates */}
      {data && data.swapCandidates.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-amber-600" />
              <h2 className="font-semibold text-gray-900">Swap Candidates</h2>
            </div>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                <th className="text-left px-6 py-3">Candidate</th>
                <th className="text-left px-6 py-3">Property</th>
                <th className="text-left px-6 py-3">Notified</th>
                <th className="text-left px-6 py-3">Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.swapCandidates.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="font-medium text-sm text-gray-900">
                      {s.candidateName}
                    </div>
                    <div className="text-xs text-gray-400">
                      {s.candidateEmail}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {s.property}
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-500">
                    {new Date(s.sentAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3">
                    {s.read ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <span className="text-xs text-gray-400">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Completed */}
      {data && data.recentCompleted.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Recently Completed (30 days)
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                <th className="text-left px-6 py-3">Tenant</th>
                <th className="text-left px-6 py-3">Landlord</th>
                <th className="text-left px-6 py-3">Property</th>
                <th className="text-left px-6 py-3">Rent</th>
                <th className="text-left px-6 py-3">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.recentCompleted.map((entry) => (
                <tr key={entry.documentId} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    {entry.tenantName}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {entry.landlordName}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {entry.property}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 font-medium">
                    ${entry.monthlyRent}
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-500">
                    {new Date(entry.completedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent Cancelled */}
      {data && data.recentCancelled.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Recently Cancelled (30 days)
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentCancelled.map((entry) => (
              <div
                key={entry.documentId}
                className="px-6 py-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {entry.tenantName}
                  </span>
                  <span className="text-sm text-gray-400 ml-2">
                    — {entry.property}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(entry.cancelledAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {data &&
        data.pending.length === 0 &&
        data.atRisk.length === 0 &&
        data.recentCompleted.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">All clear</h3>
            <p className="text-sm text-gray-500 mt-1">
              No pending signatures or at-risk tenants.
            </p>
          </div>
        )}
    </div>
  );
}
