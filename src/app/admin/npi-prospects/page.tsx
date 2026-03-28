"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  RefreshCw,
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  GraduationCap,
  Phone,
  Mail,
} from "lucide-react";

interface NpiProspect {
  id: string;
  npi: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  credential: string | null;
  sex: string | null;
  enumerationDate: string;
  taxonomyCode: string | null;
  taxonomyDesc: string | null;
  practiceCity: string | null;
  practiceState: string | null;
  practiceZip: string | null;
  practiceAddress: string | null;
  mailingCity: string | null;
  mailingState: string | null;
  phone: string | null;
  email: string | null;
  outreachStatus: string;
  source: string;
  createdAt: string;
}

interface ProspectResponse {
  prospects: NpiProspect[];
  total: number;
  limit: number;
  offset: number;
  stats: Record<string, number>;
  topStates: Array<{ state: string | null; count: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  enriched: "bg-purple-100 text-purple-700",
  contacted: "bg-amber-100 text-amber-700",
  converted: "bg-green-100 text-green-700",
  skipped: "bg-slate-100 text-slate-500",
};

const CREDENTIAL_LABELS: Record<string, string> = {
  "M.D.": "MD",
  MD: "MD",
  "D.O.": "DO",
  DO: "DO",
  DMD: "DMD",
  DDS: "DDS",
  MBBS: "MBBS",
};

export default function NpiProspectsPage() {
  const [data, setData] = useState<ProspectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [credentialFilter, setCredentialFilter] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.get<ProspectResponse>(
        "/api/admin/npi-prospects",
        {
          limit: pageSize,
          offset: page * pageSize,
          state: stateFilter || undefined,
          status: statusFilter || undefined,
          credential: credentialFilter || undefined,
        }
      );
      setData(result);
    } catch (err) {
      console.error("Failed to load NPI prospects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, stateFilter, statusFilter, credentialFilter]);

  const filteredProspects =
    data?.prospects.filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.npi.includes(q) ||
        p.practiceCity?.toLowerCase().includes(q) ||
        false
      );
    }) || [];

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, "");
    if (clean.length === 10) {
      return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
    }
    return phone;
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-3">
            <GraduationCap size={28} />
            NPI Prospects
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            New residents & fellows from NPI Registry weekly imports
          </p>
        </div>
        <button
          onClick={() => fetchData()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wider">
              Total
            </div>
            <div className="text-2xl font-semibold text-slate-900 mt-1">
              {data.total.toLocaleString()}
            </div>
          </div>
          {Object.entries(data.stats).map(([status, count]) => (
            <div
              key={status}
              className="bg-white border border-slate-200 rounded-lg p-4"
            >
              <div className="text-xs text-slate-500 uppercase tracking-wider">
                {status}
              </div>
              <div className="text-2xl font-semibold text-slate-900 mt-1">
                {count.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top States */}
      {data?.topStates && data.topStates.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">
            Top States
          </div>
          <div className="flex flex-wrap gap-2">
            {data.topStates.map((s) => (
              <button
                key={s.state}
                onClick={() => {
                  setStateFilter(
                    stateFilter === (s.state || "") ? "" : s.state || ""
                  );
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  stateFilter === s.state
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s.state || "?"} ({s.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, NPI, or city..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="enriched">Enriched</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="skipped">Skipped</option>
        </select>

        <select
          value={credentialFilter}
          onChange={(e) => {
            setCredentialFilter(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none"
        >
          <option value="">All Credentials</option>
          <option value="M.D.">MD</option>
          <option value="D.O.">DO</option>
          <option value="MBBS">MBBS</option>
          <option value="DMD">DMD</option>
          <option value="DDS">DDS</option>
        </select>

        {(stateFilter || statusFilter || credentialFilter) && (
          <button
            onClick={() => {
              setStateFilter("");
              setStatusFilter("");
              setCredentialFilter("");
              setPage(0);
            }}
            className="px-3 py-2 text-xs text-slate-500 hover:text-slate-900 transition"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Credential
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  NPI
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Enumerated
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && !data ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <RefreshCw
                      size={20}
                      className="animate-spin mx-auto text-slate-400"
                    />
                    <p className="text-sm text-slate-500 mt-2">Loading...</p>
                  </td>
                </tr>
              ) : filteredProspects.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    No prospects found
                  </td>
                </tr>
              ) : (
                filteredProspects.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {p.firstName} {p.middleName ? `${p.middleName} ` : ""}
                        {p.lastName}
                      </div>
                      {p.email && (
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail size={10} />
                          {p.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.credential ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded">
                          <Stethoscope size={10} />
                          {CREDENTIAL_LABELS[p.credential] || p.credential}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.practiceCity || p.practiceState ? (
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin size={12} className="text-slate-400" />
                          {[p.practiceCity, p.practiceState]
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500 font-mono">
                        {p.npi}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">
                        {formatDate(p.enumerationDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.phone ? (
                        <a
                          href={`tel:${p.phone}`}
                          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
                        >
                          <Phone size={10} />
                          {formatPhone(p.phone)}
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          STATUS_COLORS[p.outreachStatus] ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {p.outreachStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div className="text-xs text-slate-500">
              Showing {page * pageSize + 1}–
              {Math.min((page + 1) * pageSize, data.total)} of{" "}
              {data.total.toLocaleString()}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-1.5 rounded border border-slate-200 hover:bg-white disabled:opacity-30 transition"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-slate-600">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded border border-slate-200 hover:bg-white disabled:opacity-30 transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
