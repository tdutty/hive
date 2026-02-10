"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { gdprService } from "@/lib/services/gdpr";
import { MetricCard } from "@/components/ui/MetricCard";
import { SimpleBarChart } from "@/components/charts/SimpleBarChart";

export default function GDPRPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "export" | "deletion">("overview");
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

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 mb-2">GDPR Compliance</h1>
        <p className="text-slate-500">Manage user data export and deletion requests</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-b-amber-500 text-slate-900"
              : "border-b-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "export"
              ? "border-b-amber-500 text-slate-900"
              : "border-b-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Data Export
        </button>
        <button
          onClick={() => setActiveTab("deletion")}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "deletion"
              ? "border-b-amber-500 text-slate-900"
              : "border-b-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          Data Deletion
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {statsLoading && (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin text-amber-600" size={32} />
            </div>
          )}

          {statsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
              <span className="text-red-900">Failed to load compliance stats</span>
              <button
                onClick={refetchStats}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {!statsLoading && complianceStats && (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-6">
                <MetricCard
                  title="Total Export Requests"
                  value={complianceStats.totalExportRequests?.toString() || "0"}
                  subtitle="All time"
                  icon={CheckCircle}
                />
                <MetricCard
                  title="Completed Exports"
                  value={complianceStats.completedExports?.toString() || "0"}
                  subtitle={`${complianceStats.exportCompletionRate?.toFixed(1) || 0}% completion rate`}
                  icon={CheckCircle}
                />
                <MetricCard
                  title="Total Deletion Requests"
                  value={complianceStats.totalDeletionRequests?.toString() || "0"}
                  subtitle="All time"
                  icon={AlertCircle}
                />
                <MetricCard
                  title="Completed Deletions"
                  value={complianceStats.completedDeletions?.toString() || "0"}
                  subtitle={`${complianceStats.deletionCompletionRate?.toFixed(1) || 0}% completion rate`}
                  icon={CheckCircle}
                />
              </div>

              {/* Chart */}
              {chartData && chartData.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    Users by Role
                  </h2>
                  <SimpleBarChart
                    data={chartData}
                    nameKey="role"
                    dataKey="count"
                    color="#D97706"
                    height={300}
                  />
                </div>
              )}

              {/* Request Stats */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">
                    Export Requests
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Pending</span>
                      <span className="font-semibold text-slate-900">{complianceStats.exportStats?.pending || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Processing</span>
                      <span className="font-semibold text-blue-600">{complianceStats.exportStats?.processing || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Completed</span>
                      <span className="font-semibold text-green-600">{complianceStats.exportStats?.completed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Failed</span>
                      <span className="font-semibold text-red-600">{complianceStats.exportStats?.failed || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">
                    Deletion Requests
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Pending</span>
                      <span className="font-semibold text-slate-900">{complianceStats.deletionStats?.pending || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Processing</span>
                      <span className="font-semibold text-blue-600">{complianceStats.deletionStats?.processing || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Completed</span>
                      <span className="font-semibold text-green-600">{complianceStats.deletionStats?.completed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Blocked</span>
                      <span className="font-semibold text-red-600">{complianceStats.deletionStats?.blocked || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Export Tab */}
      {activeTab === "export" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Request Data Export
            </h2>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={exportUserId}
                onChange={(e) => setExportUserId(e.target.value)}
                placeholder="Enter user ID"
                className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportIncludeAnalytics}
                  onChange={(e) => setExportIncludeAnalytics(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm font-semibold text-slate-600">
                  Include Analytics Data
                </span>
              </label>
              <p className="text-xs text-slate-500 ml-7 mt-1">
                Includes user behavior tracking and engagement metrics
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={exportReason}
                onChange={(e) => setExportReason(e.target.value)}
                placeholder="Why is this export being requested?"
                rows={3}
                className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <button
              onClick={handleExport}
              className="w-full bg-amber-600 text-white rounded-md px-4 py-3 font-medium hover:bg-amber-700 transition-colors"
            >
              Request Export
            </button>

            {exportMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg text-green-900 p-4 text-sm">
                {exportMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deletion Tab */}
      {activeTab === "deletion" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Request Data Deletion
            </h2>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">
                User ID
              </label>
              <input
                type="text"
                value={deletionUserId}
                onChange={(e) => setDeletionUserId(e.target.value)}
                placeholder="Enter user ID"
                className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <button
              onClick={handleCheckEligibility}
              disabled={deletionChecking}
              className="w-full bg-white border border-slate-200 text-slate-700 rounded-md px-4 py-2 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {deletionChecking ? "Checking..." : "Check Eligibility"}
            </button>

            {deletionEligibility && (
              <div className="space-y-4">
                {deletionEligibility.blockers.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <AlertCircle size={18} />
                      Blockers - Cannot Delete
                    </h3>
                    <ul className="text-red-900 text-sm space-y-1">
                      {deletionEligibility.blockers.map((blocker, idx) => (
                        <li key={idx}>• {blocker}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {deletionEligibility.warnings.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                      <AlertCircle size={18} />
                      Warnings
                    </h3>
                    <ul className="text-amber-900 text-sm space-y-1">
                      {deletionEligibility.warnings.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {deletionEligibility.canDelete && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-semibold text-green-900 flex items-center gap-2">
                      <CheckCircle size={18} />
                      User is eligible for deletion
                    </p>
                  </div>
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
                      <span className="text-sm font-semibold text-slate-600">
                        Anonymize Only (retain no personal data)
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deletionRetainFinancial}
                        onChange={(e) => setDeletionRetainFinancial(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm font-semibold text-slate-600">
                        Retain Financial Records (tax purposes)
                      </span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deletionRetainLegal}
                        onChange={(e) => setDeletionRetainLegal(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm font-semibold text-slate-600">
                        Retain Legal Records (dispute resolution)
                      </span>
                    </label>

                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">
                        Type &quot;DELETE&quot; to confirm
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())}
                        placeholder="Type DELETE"
                        className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>

                    <button
                      onClick={handleDelete}
                      disabled={deletingData}
                      className="w-full bg-red-600 text-white rounded-md px-4 py-3 font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {deletingData ? "Deleting..." : "Delete User Data"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {deletionMessage && (
              <div
                className={`border rounded-lg p-4 text-sm ${
                  deletionMessage.includes("processed")
                    ? "bg-green-50 border-green-200 text-green-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                {deletionMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
