"use client";

import { useState, useEffect, useCallback } from "react";
import { sweetleaseApi } from "@/lib/api";
import {
  Users,
  Building2,
  GraduationCap,
  Mail,
  Phone,
  Search,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

// --- Types ---

interface ConciergeContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: "LANDLORD" | "RESIDENT" | "PARTNER";
  market: string | null;
  dealStage: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  lastContactAt: string | null;
  structuredMemory: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface ContactsResponse {
  contacts: ConciergeContact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: {
    total: number;
    landlords: number;
    residents: number;
    withEmail: number;
  };
  markets: string[];
}

// --- Constants ---

const TYPE_BADGE: Record<string, { bg: string; text: string }> = {
  LANDLORD: { bg: "bg-blue-50", text: "text-blue-700" },
  RESIDENT: { bg: "bg-green-50", text: "text-green-700" },
  PARTNER: { bg: "bg-purple-50", text: "text-purple-700" },
};

const SENTIMENT_DOT: Record<string, string> = {
  positive: "bg-green-500",
  neutral: "bg-gray-400",
  negative: "bg-red-500",
};

// --- Helpers ---

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

// --- Page Component ---

export default function ConciergeContactsPage() {
  const [contacts, setContacts] = useState<ConciergeContact[]>([]);
  const [stats, setStats] = useState({ total: 0, landlords: 0, residents: 0, withEmail: 0 });
  const [markets, setMarkets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState("");
  const [marketFilter, setMarketFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 50;

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean | undefined> = {
        page,
        pageSize,
      };
      if (typeFilter) params.type = typeFilter;
      if (marketFilter) params.market = marketFilter;
      if (searchQuery) params.search = searchQuery;

      const data = await sweetleaseApi.get<ContactsResponse>(
        "/api/admin/concierge/contacts",
        params
      );
      setContacts(data.contacts);
      setStats(data.stats);
      setMarkets(data.markets);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Failed to fetch concierge contacts:", err);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, marketFilter, searchQuery]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [typeFilter, marketFilter, searchQuery]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await sweetleaseApi.post("/api/admin/concierge/contacts/sync");
      await fetchContacts();
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const statCards = [
    { label: "Total Contacts", value: stats.total, icon: <Users size={20} className="text-amber-600" /> },
    { label: "Landlords / PMs", value: stats.landlords, icon: <Building2 size={20} className="text-blue-600" /> },
    { label: "Residents", value: stats.residents, icon: <GraduationCap size={20} className="text-green-600" /> },
    { label: "With Email", value: stats.withEmail, icon: <Mail size={20} className="text-purple-600" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Concierge Contacts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Contact directory synced from PM companies and tenant match requests
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Sync Contacts
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{card.value.toLocaleString()}</p>
              <p className="text-xs text-slate-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 uppercase">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All</option>
            <option value="LANDLORD">Landlord</option>
            <option value="RESIDENT">Resident</option>
            <option value="PARTNER">Partner</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 uppercase">Market</label>
          <select
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Markets</option>
            {markets.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-slate-400" />
            <span className="ml-2 text-sm text-slate-500">Loading contacts...</span>
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Users size={40} className="mb-3" />
            <p className="text-sm">No contacts found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-500 w-8"></th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Type</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Market</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Deal Stage</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Last Contact</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Sentiment</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => {
                const isExpanded = expandedId === contact.id;
                const badge = TYPE_BADGE[contact.type] || TYPE_BADGE.PARTNER;
                const sentimentDot = contact.sentiment ? SENTIMENT_DOT[contact.sentiment] : null;

                return (
                  <>
                    <tr
                      key={contact.id}
                      onClick={() => toggleExpand(contact.id)}
                      className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-400">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{contact.name}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                        >
                          {contact.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{contact.market || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {contact.email ? (
                          <span className="flex items-center gap-1">
                            <Mail size={14} className="text-slate-400" />
                            {contact.email}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {contact.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone size={14} className="text-slate-400" />
                            {contact.phone}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {contact.dealStage ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                            {contact.dealStage}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {relativeTime(contact.lastContactAt)}
                      </td>
                      <td className="px-4 py-3">
                        {sentimentDot ? (
                          <span className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${sentimentDot}`} />
                            <span className="text-xs text-slate-500 capitalize">{contact.sentiment}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Row - Structured Memory */}
                    {isExpanded && (
                      <tr key={`${contact.id}-detail`} className="bg-slate-50">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="ml-8">
                            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">
                              Structured Memory
                            </h4>
                            {contact.structuredMemory &&
                            Object.keys(contact.structuredMemory).length > 0 ? (
                              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                {Object.entries(contact.structuredMemory).map(([key, value]) => (
                                  <div key={key} className="flex items-start gap-2">
                                    <span className="text-xs font-medium text-slate-500 min-w-[120px]">
                                      {key
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, (s) => s.toUpperCase())
                                        .trim()}
                                    </span>
                                    <span className="text-xs text-slate-700">
                                      {typeof value === "object"
                                        ? JSON.stringify(value, null, 2)
                                        : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400">No memory recorded yet</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of{" "}
              {total.toLocaleString()} contacts
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
