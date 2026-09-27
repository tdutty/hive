"use client";

import { Fragment, useState, useEffect, useCallback } from "react";
import { sweetleaseApi } from "@/lib/api";
import { Button, Card, Badge, statusTone, StatTile, PageHeader, FilterChips, type Chip, Table, THead, TH, TBody, TR, TD, Field, Input, Select } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { toast } from "sonner";
import {
  Users,
  Building2,
  GraduationCap,
  Mail,
  Phone,
  Search,
  RefreshCw,
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

type TypeFilter = "" | "LANDLORD" | "RESIDENT" | "PARTNER";

const TYPE_CHIPS: Chip<TypeFilter>[] = [
  { key: "", label: "All" },
  { key: "LANDLORD", label: "Landlord" },
  { key: "RESIDENT", label: "Resident" },
  { key: "PARTNER", label: "Partner" },
];

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

/** Sentiment is a fixed three-value enum, toned per value like the other fixed labels. */
function sentimentBadge(sentiment: ConciergeContact["sentiment"]) {
  if (!sentiment) return <span className="text-slate-400">-</span>;
  const tone = sentiment === "positive" ? "success" : sentiment === "negative" ? "danger" : "neutral";
  return <Badge tone={tone} dot className="capitalize">{sentiment}</Badge>;
}

// --- Page Component ---

export default function ConciergeContactsPage() {
  const [contacts, setContacts] = useState<ConciergeContact[]>([]);
  const [stats, setStats] = useState({ total: 0, landlords: 0, residents: 0, withEmail: 0 });
  const [markets, setMarkets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("");
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
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load contacts");
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
    } catch (err: any) {
      toast.error("Sync failed", { description: err?.message });
    } finally {
      setSyncing(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Concierge Contacts"
        description="Contact directory synced from PM companies and tenant match requests"
        actions={
          <Button variant="primary" icon={<RefreshCw size={14} />} loading={syncing} onClick={handleSync}>
            Sync Contacts
          </Button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Total Contacts" value={stats.total.toLocaleString()} icon={<Users size={16} />} />
        <StatTile label="Landlords / PMs" value={stats.landlords.toLocaleString()} icon={<Building2 size={16} />} />
        <StatTile label="Residents" value={stats.residents.toLocaleString()} icon={<GraduationCap size={16} />} />
        <StatTile label="With Email" value={stats.withEmail.toLocaleString()} icon={<Mail size={16} />} />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-end gap-3">
        <FilterChips items={TYPE_CHIPS} value={typeFilter} onChange={setTypeFilter} />
        <div className="flex flex-col sm:flex-row gap-3 md:ml-auto md:flex-1 md:max-w-xl">
          <Field label="Market" className="sm:w-48 shrink-0">
            <Select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)}>
              <option value="">All Markets</option>
              {markets.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Search" className="flex-1">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden />
              <Input
                type="search"
                placeholder="Search by name, email, or phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </Field>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <Spinner label="Loading contacts" />
        ) : error ? (
          <div className="p-4">
            <ErrorBanner message={error} onRetry={fetchContacts} />
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState title="No contacts found" icon={<Users size={28} className="mx-auto" aria-hidden />} />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH className="w-10"><span className="sr-only">Expand</span></TH>
                <TH>Name</TH>
                <TH>Type</TH>
                <TH>Market</TH>
                <TH>Email</TH>
                <TH>Phone</TH>
                <TH>Deal Stage</TH>
                <TH>Last Contact</TH>
                <TH>Sentiment</TH>
              </tr>
            </THead>
            <TBody>
              {contacts.map((contact) => {
                const isExpanded = expandedId === contact.id;

                return (
                  <Fragment key={contact.id}>
                    <TR clickable selected={isExpanded} onClick={() => toggleExpand(contact.id)}>
                      <TD className="w-10 pr-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label={isExpanded ? "Collapse" : "Expand"}
                          aria-expanded={isExpanded}
                          onClick={(e) => { e.stopPropagation(); toggleExpand(contact.id); }}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </Button>
                      </TD>
                      <TD className="font-medium text-slate-900">{contact.name}</TD>
                      <TD>
                        <Badge tone={statusTone(contact.type)}>{contact.type}</Badge>
                      </TD>
                      <TD muted>{contact.market || "-"}</TD>
                      <TD muted>
                        {contact.email ? (
                          <span className="flex items-center gap-1.5">
                            <Mail size={13} className="text-slate-400 shrink-0" aria-hidden />
                            {contact.email}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TD>
                      <TD muted className="whitespace-nowrap tabular">
                        {contact.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone size={13} className="text-slate-400 shrink-0" aria-hidden />
                            {contact.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TD>
                      <TD>
                        {contact.dealStage ? (
                          <Badge tone={statusTone(contact.dealStage)}>{contact.dealStage}</Badge>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TD>
                      <TD muted className="whitespace-nowrap tabular" title={contact.lastContactAt || ""}>
                        {relativeTime(contact.lastContactAt)}
                      </TD>
                      <TD>{sentimentBadge(contact.sentiment)}</TD>
                    </TR>

                    {/* Expanded Row - Structured Memory */}
                    {isExpanded && (
                      <tr className="bg-slate-50">
                        <td colSpan={9} className="px-4 py-4">
                          <div className="md:ml-10">
                            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                              Structured Memory
                            </h4>
                            {contact.structuredMemory &&
                            Object.keys(contact.structuredMemory).length > 0 ? (
                              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                {Object.entries(contact.structuredMemory).map(([key, value]) => (
                                  <div key={key} className="flex items-start gap-2">
                                    <dt className="text-xs font-medium text-slate-500 min-w-[120px] shrink-0">
                                      {key
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, (s) => s.toUpperCase())
                                        .trim()}
                                    </dt>
                                    <dd className="text-xs text-slate-700 break-words min-w-0">
                                      {typeof value === "object"
                                        ? JSON.stringify(value, null, 2)
                                        : String(value)}
                                    </dd>
                                  </div>
                                ))}
                              </dl>
                            ) : (
                              <p className="text-xs text-slate-500">No memory recorded yet</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </TBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500 tabular">
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of{" "}
              {total.toLocaleString()} contacts
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<ChevronLeft size={14} />}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-xs text-slate-500 tabular">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight size={14} aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
