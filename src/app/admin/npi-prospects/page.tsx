"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Button, Card, CardHeader, CardBody, Badge, statusTone, StatTile, PageHeader, FilterChips, type Chip, Table, THead, TH, TBody, TR, TD, Input, Select } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import {
  RefreshCw,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
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

const CREDENTIAL_LABELS: Record<string, string> = {
  "M.D.": "MD",
  MD: "MD",
  "D.O.": "DO",
  DO: "DO",
  DMD: "DMD",
  DDS: "DDS",
  MBBS: "MBBS",
};

/** FilterChips needs a selected key; "" is also the key of a null-state row, so "no filter" gets its own sentinel. */
const NO_STATE = "__all__";

export default function NpiProspectsPage() {
  const [data, setData] = useState<ProspectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [credentialFilter, setCredentialFilter] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load NPI prospects");
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

  const formatPhone = (phone: string | null) => {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, "");
    if (clean.length === 10) {
      return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
    }
    return phone;
  };

  const stateChips: Chip<string>[] = (data?.topStates || []).map((s) => ({
    key: s.state || "",
    label: s.state || "?",
    count: s.count,
  }));

  const hasFilters = !!(stateFilter || statusFilter || credentialFilter);

  return (
    <div className="max-w-[1400px]">
      <PageHeader
        title="NPI Prospects"
        description="New residents & fellows from NPI Registry weekly imports"
        actions={
          <Button variant="ghost" size="icon" aria-label="Refresh" onClick={() => fetchData()} disabled={loading}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </Button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={fetchData} className="mb-5" />}

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <StatTile label="Total" value={data.total.toLocaleString()} />
          {Object.entries(data.stats).map(([status, count]) => (
            <StatTile key={status} label={status} value={count.toLocaleString()} />
          ))}
        </div>
      )}

      {/* Top states */}
      {stateChips.length > 0 && (
        <Card className="mb-5">
          <CardHeader title="Top States" description="Click a state to filter, click again to clear" />
          <CardBody>
            <FilterChips
              items={stateChips}
              value={stateFilter || NO_STATE}
              onChange={(k) => {
                setStateFilter(stateFilter === k ? "" : k);
                setPage(0);
              }}
            />
          </CardBody>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-4">
        <Input
          type="search"
          aria-label="Search prospects"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, NPI, or city..."
          className="sm:flex-1 sm:min-w-[200px] sm:max-w-md"
        />

        <Select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="sm:w-44"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="enriched">Enriched</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="skipped">Skipped</option>
        </Select>

        <Select
          aria-label="Filter by credential"
          value={credentialFilter}
          onChange={(e) => {
            setCredentialFilter(e.target.value);
            setPage(0);
          }}
          className="sm:w-44"
        >
          <option value="">All Credentials</option>
          <option value="M.D.">MD</option>
          <option value="D.O.">DO</option>
          <option value="MBBS">MBBS</option>
          <option value="DMD">DMD</option>
          <option value="DDS">DDS</option>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStateFilter("");
              setStatusFilter("");
              setCredentialFilter("");
              setPage(0);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Credential</TH>
              <TH>Location</TH>
              <TH>NPI</TH>
              <TH>Enumerated</TH>
              <TH>Phone</TH>
              <TH>Status</TH>
            </tr>
          </THead>
          <TBody>
            {loading && !data ? (
              <tr>
                <td colSpan={7}>
                  <Spinner label="Loading prospects" />
                </td>
              </tr>
            ) : filteredProspects.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState title="No prospects found" />
                </td>
              </tr>
            ) : (
              filteredProspects.map((p) => (
                <TR key={p.id} className="hover:bg-slate-50">
                  <TD>
                    <div className="font-medium text-slate-900">
                      {p.firstName} {p.middleName ? `${p.middleName} ` : ""}
                      {p.lastName}
                    </div>
                    {p.email && (
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Mail size={12} aria-hidden />
                        {p.email}
                      </div>
                    )}
                  </TD>
                  <TD>
                    {p.credential ? (
                      <Badge tone="outline">
                        <Stethoscope size={12} aria-hidden />
                        {CREDENTIAL_LABELS[p.credential] || p.credential}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TD>
                  <TD>
                    {p.practiceCity || p.practiceState ? (
                      <div className="flex items-center gap-1 text-slate-700">
                        <MapPin size={12} className="text-slate-400" aria-hidden />
                        {[p.practiceCity, p.practiceState].filter(Boolean).join(", ")}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TD>
                  <TD muted className="font-mono text-xs tabular">{p.npi}</TD>
                  <TD muted className="tabular whitespace-nowrap">{formatDate(p.enumerationDate)}</TD>
                  <TD>
                    {p.phone ? (
                      <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 hover:underline tabular whitespace-nowrap">
                        <Phone size={12} aria-hidden />
                        {formatPhone(p.phone)}
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TD>
                  <TD>
                    <Badge tone={statusTone(p.outreachStatus)} dot>{p.outreachStatus}</Badge>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>

        {/* Pagination */}
        {data && data.total > pageSize && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div className="text-xs text-slate-500 tabular">
              Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, data.total)} of{" "}
              {data.total.toLocaleString()}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Previous page" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
                <ChevronLeft size={14} />
              </Button>
              <span className="text-xs text-slate-600 tabular">
                {page + 1} / {totalPages}
              </span>
              <Button variant="ghost" size="icon" aria-label="Next page" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
