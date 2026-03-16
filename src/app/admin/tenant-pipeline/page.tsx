"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface PipelineData {
  pipeline: Record<string, number>;
  total: number;
  recentRequests: Array<{
    id: string;
    name: string;
    email: string;
    city: string;
    state: string;
    status: string;
    matchCount: number;
    selectionsConfirmed: boolean;
    hasNegotiation: boolean;
    createdAt: string;
  }>;
  activeNegotiations: Array<{
    groupId: string;
    status: string;
    memberCount: number;
    listingTitle: string | null;
    listingPrice: number | null;
    offerStatus: string | null;
    offerAmount: number | null;
    counterAmount: number | null;
  }>;
  revenue: {
    activeLeases: number;
    totalMonthlyRent: number;
    totalAnnualRent: number;
    totalDepositsHeld: number;
  };
  outreach: Record<string, number>;
  recentLeased: Array<{
    id: string;
    name: string;
    city: string;
    state: string;
    createdAt: string;
  }>;
}

const STAGE_CONFIG: Array<{
  key: string;
  label: string;
  color: string;
}> = [
  { key: "pending", label: "Pending", color: "bg-gray-500" },
  { key: "searching", label: "Searching", color: "bg-blue-500" },
  { key: "matched", label: "Matched", color: "bg-indigo-500" },
  { key: "selections_confirmed", label: "Selected", color: "bg-purple-500" },
  { key: "outreach", label: "Outreach", color: "bg-cyan-500" },
  { key: "negotiating", label: "Negotiating", color: "bg-amber-500" },
  { key: "lease_pending", label: "Lease Pending", color: "bg-orange-500" },
  { key: "leased", label: "Leased", color: "bg-green-500" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "text-gray-400 bg-gray-400/10",
  searching: "text-blue-400 bg-blue-400/10",
  matched: "text-indigo-400 bg-indigo-400/10",
  selections_confirmed: "text-purple-400 bg-purple-400/10",
  outreach: "text-cyan-400 bg-cyan-400/10",
  landlord_responded: "text-teal-400 bg-teal-400/10",
  negotiating: "text-amber-400 bg-amber-400/10",
  lease_pending: "text-orange-400 bg-orange-400/10",
  leased: "text-green-400 bg-green-400/10",
};

export default function TenantPipelinePage() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchPipeline() {
      try {
        const result = await api.get<PipelineData>(
          "/api/admin/tenant-match/pipeline"
        );
        setData(result);
      } catch (err) {
        console.error("Failed to load pipeline:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPipeline();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading pipeline...</div>
      </div>
    );
  }

  if (!data) return null;

  const filteredRequests =
    statusFilter === "all"
      ? data.recentRequests
      : data.recentRequests.filter((r) => r.status === statusFilter);

  const maxStageCount = Math.max(
    ...STAGE_CONFIG.map((s) => data.pipeline[s.key] || 0),
    1
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Tenant Pipeline</h1>
        <p className="text-gray-400 mt-1">
          {data.total} total match requests across all stages
        </p>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[#2a2a3d] border border-[#3a3a4d] rounded-lg p-5">
          <div className="text-gray-500 text-xs uppercase tracking-wider">
            Active Leases
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {data.revenue.activeLeases}
          </div>
        </div>
        <div className="bg-[#2a2a3d] border border-[#3a3a4d] rounded-lg p-5">
          <div className="text-gray-500 text-xs uppercase tracking-wider">
            Monthly Rent
          </div>
          <div className="text-2xl font-bold text-green-400 mt-1">
            ${data.revenue.totalMonthlyRent.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#2a2a3d] border border-[#3a3a4d] rounded-lg p-5">
          <div className="text-gray-500 text-xs uppercase tracking-wider">
            Annual Rent
          </div>
          <div className="text-2xl font-bold text-green-400 mt-1">
            ${data.revenue.totalAnnualRent.toLocaleString()}
          </div>
        </div>
        <div className="bg-[#2a2a3d] border border-[#3a3a4d] rounded-lg p-5">
          <div className="text-gray-500 text-xs uppercase tracking-wider">
            Deposits Held
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            ${data.revenue.totalDepositsHeld.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Pipeline Funnel */}
      <div className="bg-[#2a2a3d] border border-[#3a3a4d] rounded-lg p-6 mb-8">
        <h2 className="text-white font-semibold mb-4">Pipeline Funnel</h2>
        <div className="space-y-3">
          {STAGE_CONFIG.map((stage) => {
            const count = data.pipeline[stage.key] || 0;
            const width = maxStageCount > 0 ? (count / maxStageCount) * 100 : 0;
            return (
              <div key={stage.key} className="flex items-center gap-4">
                <div className="w-28 text-sm text-gray-400 text-right flex-shrink-0">
                  {stage.label}
                </div>
                <div className="flex-1 bg-[#1e1e2d] rounded-full h-8 overflow-hidden">
                  <div
                    className={`${stage.color} h-full rounded-full flex items-center justify-end pr-3 transition-all duration-500`}
                    style={{ width: `${Math.max(width, count > 0 ? 8 : 0)}%` }}
                  >
                    {count > 0 && (
                      <span className="text-white text-xs font-bold">
                        {count}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-8 text-sm text-gray-500 text-right">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Negotiations */}
      {data.activeNegotiations.length > 0 && (
        <div className="bg-[#2a2a3d] border border-[#3a3a4d] rounded-lg p-6 mb-8">
          <h2 className="text-white font-semibold mb-4">
            Active Negotiations ({data.activeNegotiations.length})
          </h2>
          <div className="space-y-3">
            {data.activeNegotiations.map((n) => (
              <div
                key={n.groupId}
                className="flex items-center justify-between p-4 bg-[#1e1e2d] rounded-lg"
              >
                <div>
                  <div className="text-white font-medium">
                    {n.listingTitle || "Unknown Property"}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {n.memberCount} tenant(s) &middot; Listed at $
                    {(n.listingPrice || 0).toLocaleString()}/mo
                  </div>
                </div>
                <div className="text-right">
                  {n.counterAmount ? (
                    <div>
                      <div className="text-amber-400 font-bold">
                        Counter: ${n.counterAmount.toLocaleString()}/mo
                      </div>
                      <div className="text-gray-500 text-xs">
                        Our offer: ${(n.offerAmount || 0).toLocaleString()}/mo
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      Offer: ${(n.offerAmount || 0).toLocaleString()}/mo
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Requests Table */}
      <div className="bg-[#2a2a3d] border border-[#3a3a4d] rounded-lg overflow-hidden">
        <div className="p-6 border-b border-[#3a3a4d] flex items-center justify-between">
          <h2 className="text-white font-semibold">Match Requests</h2>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1e1e2d] border border-[#3a3a4d] text-gray-300 text-sm rounded px-3 py-1.5 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            {STAGE_CONFIG.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label} ({data.pipeline[s.key] || 0})
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#3a3a4d]">
                <th className="text-left text-gray-500 font-medium px-6 py-3">
                  Name
                </th>
                <th className="text-left text-gray-500 font-medium px-6 py-3">
                  Location
                </th>
                <th className="text-left text-gray-500 font-medium px-6 py-3">
                  Status
                </th>
                <th className="text-left text-gray-500 font-medium px-6 py-3">
                  Matches
                </th>
                <th className="text-left text-gray-500 font-medium px-6 py-3">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[#3a3a4d] hover:bg-[#2e2e42]"
                >
                  <td className="px-6 py-3">
                    <div className="text-white">{r.name}</div>
                    <div className="text-gray-500 text-xs">{r.email}</div>
                  </td>
                  <td className="px-6 py-3 text-gray-300">
                    {r.city}, {r.state}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[r.status] || "text-gray-400 bg-gray-400/10"}`}
                    >
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-300">{r.matchCount}</td>
                  <td className="px-6 py-3 text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No match requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
