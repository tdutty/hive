"use client";

import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { auditLogsService } from "@/lib/services/audit-logs";
import { Card, CardHeader, CardBody, Badge, statusTone, PageHeader, FilterChips, Table, THead, TH, TBody, TR, TD, Input } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";

interface AuditLogRow {
  id: string;
  timestamp: string;
  level: string;
  category: string;
  action: string;
  user: string;
  ipAddress?: string;
  complianceFlag: boolean;
  riskScore: number;
}

type CategoryKey = "all" | "authentication" | "admin" | "data" | "payment" | "compliance";
type LevelKey = "all" | "critical" | "error" | "warning" | "info";

const CATEGORIES: { key: CategoryKey; label: string }[] = [
  { key: "all", label: "All Categories" },
  { key: "authentication", label: "Authentication" },
  { key: "admin", label: "Admin Action" },
  { key: "data", label: "Data Modification" },
  { key: "payment", label: "Payment" },
  { key: "compliance", label: "Compliance" },
];

const LEVELS: { key: LevelKey; label: string }[] = [
  { key: "all", label: "All Levels" },
  { key: "critical", label: "Critical" },
  { key: "error", label: "Error" },
  { key: "warning", label: "Warning" },
  { key: "info", label: "Info" },
];

const categoryMap: Record<CategoryKey, string | undefined> = {
  all: undefined,
  authentication: "Authentication",
  admin: "Admin Action",
  data: "Data Modification",
  payment: "Payment",
  compliance: "Compliance",
};

const levelMap: Record<LevelKey, string | undefined> = {
  all: undefined,
  critical: "CRITICAL",
  error: "ERROR",
  warning: "WARNING",
  info: "INFO",
};

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey>("all");
  const [levelFilter, setLevelFilter] = useState<LevelKey>("all");
  const [page] = useState(1);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogRow[]>([]);

  const { data, loading, error, refetch } = useApi(
    () =>
      auditLogsService.getAll({
        page,
        limit: 20,
        category: categoryMap[categoryFilter],
        level: levelMap[levelFilter],
      }),
    [page, categoryFilter, levelFilter]
  );

  useEffect(() => {
    if (data?.auditLogs) {
      let logs = data.auditLogs as any[];

      if (searchTerm) {
        logs = logs.filter((log) => {
          const searchLower = searchTerm.toLowerCase();
          return (
            (log.action || "").toLowerCase().includes(searchLower) ||
            (log.user || "").toLowerCase().includes(searchLower) ||
            (log.ipAddress && log.ipAddress.includes(searchTerm))
          );
        });
      }

      setFilteredLogs(logs);
    }
  }, [data, searchTerm]);

  if (loading) {
    return <div className="max-w-7xl"><PageHeader title="Audit Logs" /><Spinner /></div>;
  }

  if (error) {
    return <div className="max-w-7xl"><PageHeader title="Audit Logs" /><ErrorBanner message={error} onRetry={refetch} /></div>;
  }

  return (
    <div className="max-w-7xl">
      <PageHeader title="Audit Logs" description="Track all system activities and compliance events" />

      <div className="flex flex-col gap-3 mb-4">
        <Input
          type="search"
          aria-label="Search audit logs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by action, user, or IP..."
          className="sm:max-w-xs"
        />
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Category</p>
          <FilterChips items={CATEGORIES} value={categoryFilter} onChange={setCategoryFilter} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">Log Level</p>
          <FilterChips items={LEVELS} value={levelFilter} onChange={setLevelFilter} />
        </div>
      </div>

      <Card className="mb-5">
        <CardHeader title={`Logs (${filteredLogs.length})`} />
        {filteredLogs.length === 0 ? (
          <EmptyState title="No audit logs found" />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Timestamp</TH>
                <TH>Level</TH>
                <TH>Category</TH>
                <TH>Action</TH>
                <TH>User</TH>
                <TH>IP Address</TH>
                <TH>Compliance</TH>
                <TH numeric>Risk Score</TH>
              </tr>
            </THead>
            <TBody>
              {filteredLogs.map((log, i) => (
                <TR key={log.id ?? i}>
                  <TD muted className="tabular whitespace-nowrap">{log.timestamp || "-"}</TD>
                  <TD><Badge tone={statusTone(log.level)} dot>{log.level || "-"}</Badge></TD>
                  <TD>{log.category || "-"}</TD>
                  <TD className="font-medium">{log.action || "-"}</TD>
                  <TD muted>{log.user || "-"}</TD>
                  <TD muted className="tabular">{log.ipAddress || "-"}</TD>
                  <TD>
                    {log.complianceFlag ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <Shield size={14} className="text-amber-600" aria-hidden />
                        Flagged
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </TD>
                  <TD numeric>{log.riskScore ?? "-"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Card>
        <CardBody className="text-sm text-slate-500">
          Showing {filteredLogs.length} of {data?.pagination?.total || 0} logs. All timestamps are in UTC.
        </CardBody>
      </Card>
    </div>
  );
}
