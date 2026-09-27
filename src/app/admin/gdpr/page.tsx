"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { gdprService } from "@/lib/services/gdpr";
import { Button, Card, CardHeader, CardBody, Badge, statusTone, StatTile, PageHeader, FilterChips, type Chip, Table, THead, TH, TBody, TR, TD, Field, Input, Textarea } from "@/components/kit";
import { ErrorBanner, Spinner } from "@/components/ui/AsyncState";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";

type Tab = "overview" | "export" | "deletion";
const TABS: Chip<Tab>[] = [
  { key: "overview", label: "Overview" },
  { key: "export", label: "Data Export" },
  { key: "deletion", label: "Data Deletion" },
];

/** Status/count rows for the export and deletion request cards. */
function RequestStatsTable({ rows }: { rows: { label: string; count: number }[] }) {
  return (
    <Table>
      <THead>
        <tr>
          <TH>Status</TH>
          <TH numeric>Requests</TH>
        </tr>
      </THead>
      <TBody>
        {rows.map((r) => (
          <TR key={r.label}>
            <TD><Badge tone={statusTone(r.label)} dot>{r.label}</Badge></TD>
            <TD numeric className="font-medium">{r.count}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}

/** Inline notice panel for form outcomes and eligibility results. */
function Notice({ tone, title, children }: { tone: "success" | "warning" | "danger"; title?: React.ReactNode; children?: React.ReactNode }) {
  const cls = tone === "success"
    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
    : tone === "warning"
      ? "bg-amber-50 border-amber-200 text-amber-900"
      : "bg-red-50 border-red-200 text-red-900";
  return (
    <div role="status" className={`border rounded-lg p-3 text-sm ${cls}`}>
      {title && <p className="font-semibold flex items-center gap-2">{title}</p>}
      {children}
    </div>
  );
}

export default function GDPRPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [exportUserId, setExportUserId] = useState("");
  const [exportIncludeAnalytics, setExportIncludeAnalytics] = useState(false);
  const [exportReason, setExportReason] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [deletionUserId, setDeletionUserId] = useState("");
  const [deletionEligibility, setDeletionEligibility] = useState<{
    canDelete: boolean;
    blockers: string[];
    warnings: string[];
  } | null>(null);
  const [deletionAnonymize, setDeletionAnonymize] = useState(false);
  const [deletionRetainFinancial, setDeletionRetainFinancial] = useState(false);
  const [deletionRetainLegal, setDeletionRetainLegal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletionMessage, setDeletionMessage] = useState("");
  const [deletionChecking, setDeletionChecking] = useState(false);
  const [deletingData, setDeletingData] = useState(false);

  // Fetch compliance stats for overview
  const {
    data: complianceStats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useApi(
    () => gdprService.getComplianceStats(),
    [activeTab]
  );

  const handleExport = async () => {
    if (!exportUserId) {
      setExportMessage("Please enter a User ID");
      return;
    }
    try {
      await gdprService.exportUserData({
        userId: exportUserId,
        reason: exportReason,
        includeAnalytics: exportIncludeAnalytics,
      });
      setExportMessage(`Export request submitted for user ${exportUserId}. They will receive an email within 24 hours.`);
      setExportUserId("");
      setExportReason("");
      setExportIncludeAnalytics(false);
      setTimeout(() => setExportMessage(""), 5000);
    } catch (error) {
      setExportMessage(`Error submitting export: ${error instanceof Error ? error.message : "Unknown error"}`);
      setTimeout(() => setExportMessage(""), 5000);
    }
  };

  const handleCheckEligibility = async () => {
    if (!deletionUserId) {
      setDeletionMessage("Please enter a User ID");
      return;
    }
    setDeletionChecking(true);
    try {
      const result = await gdprService.checkDeletionEligibility(deletionUserId);
      setDeletionEligibility(result);
    } catch (error) {
      setDeletionMessage(`Error checking eligibility: ${error instanceof Error ? error.message : "Unknown error"}`);
      setTimeout(() => setDeletionMessage(""), 5000);
    } finally {
      setDeletionChecking(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== "DELETE") {
      setDeletionMessage("Please type DELETE to confirm");
      return;
    }
    setDeletingData(true);
    try {
      await gdprService.deleteUserData({
        userId: deletionUserId,
        reason: "Admin-initiated deletion",
        anonymizeOnly: deletionAnonymize,
        retainFinancial: deletionRetainFinancial,
        retainLegal: deletionRetainLegal,
      });
      setDeletionMessage(`Deletion request for user ${deletionUserId} has been processed.`);
      setDeletionUserId("");
      setDeleteConfirmation("");
      setDeletionAnonymize(false);
      setDeletionRetainFinancial(false);
      setDeletionRetainLegal(false);
      setDeletionEligibility(null);
      setTimeout(() => setDeletionMessage(""), 5000);
    } catch (error) {
      setDeletionMessage(`Error deleting data: ${error instanceof Error ? error.message : "Unknown error"}`);
      setTimeout(() => setDeletionMessage(""), 5000);
    } finally {
      setDeletingData(false);
    }
  };

  // Prepare chart data from compliance stats
  const chartData = complianceStats?.usersByRole || [];

  const exportIsSuccess = exportMessage.startsWith("Export request submitted");
  const deletionIsSuccess = deletionMessage.includes("processed");

  return (
    <div className="max-w-7xl">
      <PageHeader title="GDPR Compliance" description="Manage user data export and deletion requests" />

      {/* Tab Navigation */}
      <FilterChips items={TABS} value={activeTab} onChange={setActiveTab} className="mb-4" />

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-3">
          {statsLoading && <Spinner label="Loading compliance stats" />}

          {statsError && (
            <ErrorBanner message={`Failed to load compliance stats: ${statsError}`} onRetry={refetchStats} />
          )}

          {!statsLoading && complianceStats && (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatTile
                  label="Total Export Requests"
                  value={complianceStats.totalExportRequests?.toString() || "0"}
                  hint="All time"
                  icon={<CheckCircle size={14} />}
                />
                <StatTile
                  label="Completed Exports"
                  value={complianceStats.completedExports?.toString() || "0"}
                  hint={`${complianceStats.exportCompletionRate?.toFixed(1) || 0}% completion rate`}
                  icon={<CheckCircle size={14} />}
                />
                <StatTile
                  label="Total Deletion Requests"
                  value={complianceStats.totalDeletionRequests?.toString() || "0"}
                  hint="All time"
                  icon={<AlertCircle size={14} />}
                />
                <StatTile
                  label="Completed Deletions"
                  value={complianceStats.completedDeletions?.toString() || "0"}
                  hint={`${complianceStats.deletionCompletionRate?.toFixed(1) || 0}% completion rate`}
                  icon={<CheckCircle size={14} />}
                />
              </div>

              {/* Chart */}
              {chartData && chartData.length > 0 && (
                <Card>
                  <CardHeader title="Users by role" />
                  <CardBody>
                    <SimpleBarChart
                      bare
                      data={chartData}
                      nameKey="role"
                      dataKey="count"
                      color="#D97706"
                      height={300}
                    />
                  </CardBody>
                </Card>
              )}

              {/* Request Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card>
                  <CardHeader title="Export requests" />
                  <RequestStatsTable rows={[
                    { label: "Pending", count: complianceStats.exportStats?.pending || 0 },
                    { label: "Processing", count: complianceStats.exportStats?.processing || 0 },
                    { label: "Completed", count: complianceStats.exportStats?.completed || 0 },
                    { label: "Failed", count: complianceStats.exportStats?.failed || 0 },
                  ]} />
                </Card>

                <Card>
                  <CardHeader title="Deletion requests" />
                  <RequestStatsTable rows={[
                    { label: "Pending", count: complianceStats.deletionStats?.pending || 0 },
                    { label: "Processing", count: complianceStats.deletionStats?.processing || 0 },
                    { label: "Completed", count: complianceStats.deletionStats?.completed || 0 },
                    { label: "Blocked", count: complianceStats.deletionStats?.blocked || 0 },
                  ]} />
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* Export Tab */}
      {activeTab === "export" && (
        <Card className="max-w-2xl">
          <CardHeader title="Request data export" description="The user receives their export by email within 24 hours." />
          <CardBody className="space-y-4">
            <Field label="User ID">
              <Input
                type="text"
                value={exportUserId}
                onChange={(e) => setExportUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </Field>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportIncludeAnalytics}
                  onChange={(e) => setExportIncludeAnalytics(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-slate-700">Include analytics data</span>
              </label>
              <p className="text-xs text-slate-500 ml-7 mt-1">Includes user behavior tracking and engagement metrics</p>
            </div>

            <Field label="Reason (optional)">
              <Textarea
                value={exportReason}
                onChange={(e) => setExportReason(e.target.value)}
                placeholder="Why is this export being requested?"
                rows={3}
              />
            </Field>

            <div className="flex justify-end">
              <Button variant="primary" onClick={handleExport}>Request export</Button>
            </div>

            {exportMessage && (
              <Notice tone={exportIsSuccess ? "success" : "danger"}>{exportMessage}</Notice>
            )}
          </CardBody>
        </Card>
      )}

      {/* Deletion Tab */}
      {activeTab === "deletion" && (
        <Card className="max-w-2xl">
          <CardHeader title="Request data deletion" description="Check eligibility first; blockers must be cleared before deletion." />
          <CardBody className="space-y-4">
            <Field label="User ID">
              <Input
                type="text"
                value={deletionUserId}
                onChange={(e) => setDeletionUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </Field>

            <div className="flex justify-end">
              <Button onClick={handleCheckEligibility} loading={deletionChecking}>
                {deletionChecking ? "Checking" : "Check eligibility"}
              </Button>
            </div>

            {deletionEligibility && (
              <div className="space-y-4">
                {deletionEligibility.blockers.length > 0 && (
                  <Notice tone="danger" title={<><AlertCircle size={16} aria-hidden />Blockers - Cannot Delete</>}>
                    <ul className="mt-2 space-y-1">
                      {deletionEligibility.blockers.map((blocker, idx) => (
                        <li key={idx}>• {blocker}</li>
                      ))}
                    </ul>
                  </Notice>
                )}

                {deletionEligibility.warnings.length > 0 && (
                  <Notice tone="warning" title={<><AlertCircle size={16} aria-hidden />Warnings</>}>
                    <ul className="mt-2 space-y-1">
                      {deletionEligibility.warnings.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </Notice>
                )}

                {deletionEligibility.canDelete && (
                  <Notice tone="success" title={<><CheckCircle size={16} aria-hidden />User is eligible for deletion</>} />
                )}

                {deletionEligibility.canDelete && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deletionAnonymize}
                        onChange={(e) => setDeletionAnonymize(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Anonymize only (retain no personal data)</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deletionRetainFinancial}
                        onChange={(e) => setDeletionRetainFinancial(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Retain financial records (tax purposes)</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deletionRetainLegal}
                        onChange={(e) => setDeletionRetainLegal(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Retain legal records (dispute resolution)</span>
                    </label>

                    <Field label='Type "DELETE" to confirm'>
                      <Input
                        type="text"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())}
                        placeholder="Type DELETE"
                      />
                    </Field>

                    <div className="flex justify-end">
                      <Button variant="danger" onClick={handleDelete} loading={deletingData}>
                        {deletingData ? "Deleting" : "Delete user data"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {deletionMessage && (
              <Notice tone={deletionIsSuccess ? "success" : "danger"}>{deletionMessage}</Notice>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
