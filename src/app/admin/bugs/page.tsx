"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bug,
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  ExternalLink,
  Clock,
  Users,
  Hash,
  XCircle,
  CheckCircle2,
  EyeOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { sentryService, type SentryIssue } from "@/lib/services/sentry";

type FilterTab = "unresolved" | "all" | "fatal" | "error" | "warning";

const LEVEL_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string; badge: string }
> = {
  fatal: {
    icon: <XCircle size={16} />,
    color: "text-red-700",
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-700 border-red-200",
  },
  error: {
    icon: <AlertCircle size={16} />,
    color: "text-orange-700",
    bg: "bg-orange-50",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    color: "text-amber-700",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  info: {
    icon: <Info size={16} />,
    color: "text-blue-700",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  debug: {
    icon: <Bug size={16} />,
    color: "text-gray-600",
    bg: "bg-gray-50",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
  },
};

const STATUS_CONFIG: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  unresolved: {
    icon: <AlertCircle size={14} />,
    label: "Unresolved",
    color: "text-orange-600",
  },
  resolved: {
    icon: <CheckCircle2 size={14} />,
    label: "Resolved",
    color: "text-green-600",
  },
  ignored: {
    icon: <EyeOff size={14} />,
    label: "Ignored",
    color: "text-gray-500",
  },
};

function IssueRow({ issue }: { issue: SentryIssue }) {
  const level = LEVEL_CONFIG[issue.level] || LEVEL_CONFIG.error;
  const status = STATUS_CONFIG[issue.status] || STATUS_CONFIG.unresolved;

  return (
    <div className="border border-slate-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 p-1.5 rounded-md ${level.bg} ${level.color} flex-shrink-0`}
          >
            {level.icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {issue.title}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {issue.culprit}
                </p>
              </div>

              <a
                href={issue.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-1.5 hover:bg-slate-100 rounded transition-colors"
                title="Open in Sentry"
              >
                <ExternalLink size={14} className="text-gray-400" />
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Hash size={12} />
                {issue.shortId}
              </span>

              <span
                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${level.badge}`}
              >
                {issue.level}
              </span>

              <span
                className={`flex items-center gap-1 text-xs font-medium ${status.color}`}
              >
                {status.icon}
                {status.label}
              </span>

              <span className="flex items-center gap-1 text-xs text-gray-500">
                <AlertCircle size={12} />
                {Number(issue.count).toLocaleString()} events
              </span>

              {issue.userCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Users size={12} />
                  {issue.userCount.toLocaleString()} users
                </span>
              )}

              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={12} />
                {issue.lastSeen && !isNaN(new Date(issue.lastSeen).getTime())
                  ? formatDistanceToNow(new Date(issue.lastSeen), {
                      addSuffix: true,
                    })
                  : "-"}
              </span>
            </div>

            {issue.metadata?.value && (
              <p className="text-xs text-gray-600 bg-slate-50 rounded px-2.5 py-1.5 mt-2 font-mono truncate">
                {issue.metadata.value}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BugsPage() {
  const [issues, setIssues] = useState<SentryIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("unresolved");
  const [refreshing, setRefreshing] = useState(false);

  const fetchIssues = useCallback(async (tab: FilterTab) => {
    try {
      let data: SentryIssue[];

      switch (tab) {
        case "unresolved":
          data = await sentryService.getUnresolvedIssues();
          break;
        case "fatal":
        case "error":
        case "warning":
          data = await sentryService.getIssuesByLevel(tab);
          break;
        case "all":
        default:
          data = await sentryService.getAllIssues();
          break;
      }

      setIssues(data);
      setError("");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load issues from Sentry";
      setError(message);
      setIssues([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchIssues(activeTab).finally(() => setLoading(false));
  }, [activeTab, fetchIssues]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchIssues(activeTab);
    setRefreshing(false);
  };

  const fatalCount = issues.filter((i) => i.level === "fatal").length;
  const errorCount = issues.filter((i) => i.level === "error").length;
  const warningCount = issues.filter((i) => i.level === "warning").length;
  const totalEvents = issues.reduce((sum, i) => sum + Number(i.count), 0);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "unresolved", label: "Unresolved" },
    { key: "all", label: "All" },
    { key: "fatal", label: "Fatal" },
    { key: "error", label: "Errors" },
    { key: "warning", label: "Warnings" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bugs & Errors</h1>
          <p className="text-sm text-gray-500 mt-1">
            Live issues from Sentry — SweetLease production
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total Issues
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {loading ? "—" : issues.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-red-600 uppercase tracking-wider">
            Fatal
          </p>
          <p className="text-2xl font-bold text-red-700 mt-1">
            {loading ? "—" : fatalCount}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-orange-600 uppercase tracking-wider">
            Errors
          </p>
          <p className="text-2xl font-bold text-orange-700 mt-1">
            {loading ? "—" : errorCount}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wider">
            Warnings
          </p>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {loading ? "—" : warningCount}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total Events
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {loading ? "—" : totalEvents.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-amber-500 text-amber-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={24} className="animate-spin text-amber-600" />
            <p className="text-sm text-gray-500">
              Loading issues from Sentry…
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle size={24} className="text-red-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-red-800">{error}</p>
          <p className="text-xs text-red-600 mt-1">
            Check that SENTRY_AUTH_TOKEN is configured in .env.local
          </p>
          <button
            onClick={handleRefresh}
            className="mt-3 px-4 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle2 size={24} className="text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-800">
            No issues found
          </p>
          <p className="text-xs text-green-600 mt-1">
            {activeTab === "unresolved"
              ? "All clear — no unresolved issues."
              : `No ${activeTab} issues to display.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <IssueRow key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}
