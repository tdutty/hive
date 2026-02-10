"use client";

import { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { auditLogsService } from "@/lib/services/audit-logs";
import { DataTable } from "@/components/ui/DataTable";
import { FilterBar } from "@/components/ui/FilterBar";
import { SearchInput } from "@/components/ui/SearchInput";

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

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [page] = useState(1);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogRow[]>([]);

  const categories = [
    { key: "all", label: "All Categories" },
    { key: "authentication", label: "Authentication" },
    { key: "admin", label: "Admin Action" },
    { key: "data", label: "Data Modification" },
    { key: "payment", label: "Payment" },
    { key: "compliance", label: "Compliance" },
  ];

  const levels = [
    { key: "all", label: "All Levels" },
    { key: "critical", label: "Critical" },
    { key: "error", label: "Error" },
    { key: "warning", label: "Warning" },
    { key: "info", label: "Info" },
  ];

  const categoryMap: Record<string, string | undefined> = {
    all: undefined,
    authentication: "Authentication",
    admin: "Admin Action",
    data: "Data Modification",
    payment: "Payment",
    compliance: "Compliance",
  };

  const levelMap: Record<string, string | undefined> = {
    all: undefined,
    critical: "CRITICAL",
    error: "ERROR",
    warning: "WARNING",
    info: "INFO",
  };

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
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Audit Logs</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Audit Logs</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <p className="font-medium">Failed to load data</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={refetch}
            className="mt-3 bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">Audit Logs</h1>
        <p className="text-slate-500">Track all system activities and compliance events</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by action, user, or IP..."
        />

        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Category</p>
            <FilterBar
              filters={categories}
              selected={categoryFilter}
              onChange={setCategoryFilter}
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Log Level</p>
            <FilterBar
              filters={levels}
              selected={levelFilter}
              onChange={setLevelFilter}
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <DataTable
        columns={[
          { key: "timestamp", label: "Timestamp" },
          {
            key: "level",
            label: "Level",
            render: (value) => {
              const colorMap: Record<string, string> = {
                CRITICAL: "bg-red-100 text-red-900 border-red-200",
                ERROR: "bg-orange-100 text-orange-900 border-orange-200",
                WARNING: "bg-amber-100 text-amber-900 border-amber-200",
                INFO: "bg-blue-100 text-blue-900 border-blue-200",
              };
              return (
                <span
                  className={`inline-flex items-center border rounded-md px-3 py-1.5 text-sm font-medium ${
                    colorMap[value] || colorMap.INFO
                  }`}
                >
                  {value}
                </span>
              );
            },
          },
          { key: "category", label: "Category" },
          { key: "action", label: "Action" },
          { key: "user", label: "User" },
          { key: "ipAddress", label: "IP Address" },
          {
            key: "complianceFlag",
            label: "Compliance",
            render: (value) =>
              value ? (
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-amber-600" />
                  <span className="text-sm text-slate-700">Flagged</span>
                </div>
              ) : (
                <span className="text-sm text-slate-500">-</span>
              ),
          },
          { key: "riskScore", label: "Risk Score" },
        ]}
        data={filteredLogs}
        emptyMessage="No audit logs found"
      />

      {/* Footer Note */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 text-sm text-slate-500">
        <p>
          Showing {filteredLogs.length} of {data?.pagination?.total || 0} logs. All
          timestamps are in UTC.
        </p>
      </div>
    </div>
  );
}
