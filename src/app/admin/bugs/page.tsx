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
import { Button, Card, CardBody, Badge, statusTone, StatTile, PageHeader, FilterChips } from "@/components/kit";
import type { BadgeProps } from "@/components/kit/Badge";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";

type FilterTab = "unresolved" | "all" | "fatal" | "error" | "warning";
type BadgeTone = NonNullable<BadgeProps["tone"]>;

const LEVEL_ICON: Record<string, React.ReactNode> = {
  fatal: <XCircle size={16} />,
  error: <AlertCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
  debug: <Bug size={16} />,
};

/** Sentry levels: fatal is not in the shared status map, so it is pinned to danger. */
const levelTone = (level: string): BadgeTone =>
  level === "fatal" ? "danger" : level === "debug" ? "neutral" : statusTone(level) ?? "neutral";

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; tone: BadgeTone }> = {
  unresolved: { icon: <AlertCircle size={12} />, label: "Unresolved", tone: "warning" },
  resolved: { icon: <CheckCircle2 size={12} />, label: "Resolved", tone: "success" },
  ignored: { icon: <EyeOff size={12} />, label: "Ignored", tone: "neutral" },
};

function IssueRow({ issue }: { issue: SentryIssue }) {
  const icon = LEVEL_ICON[issue.level] || LEVEL_ICON.error;
  const status = STATUS_CONFIG[issue.status] || STATUS_CONFIG.unresolved;

  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-1.5 rounded-md bg-slate-100 text-slate-600 shrink-0" aria-hidden>
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 truncate">{issue.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{issue.culprit}</p>
              </div>

              <a
                href={issue.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 p-1.5 hover:bg-slate-100 rounded transition-colors"
                title="Open in Sentry"
              >
                <ExternalLink size={14} className="text-slate-400" aria-hidden />
                <span className="sr-only">Open in Sentry</span>
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5">
              <span className="flex items-center gap-1 text-xs text-slate-500 tabular">
                <Hash size={12} aria-hidden />
                {issue.shortId}
              </span>

              <Badge tone={levelTone(issue.level)} dot>{issue.level}</Badge>

              <Badge tone={status.tone}>
                {status.icon}
                {status.label}
              </Badge>

              <span className="flex items-center gap-1 text-xs text-slate-500 tabular">
                <AlertCircle size={12} aria-hidden />
                {Number(issue.count).toLocaleString()} events
              </span>

              {issue.userCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-slate-500 tabular">
                  <Users size={12} aria-hidden />
                  {issue.userCount.toLocaleString()} users
                </span>
              )}

              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock size={12} aria-hidden />
                {issue.lastSeen && !isNaN(new Date(issue.lastSeen).getTime())
                  ? formatDistanceToNow(new Date(issue.lastSeen), { addSuffix: true })
                  : "-"}
              </span>
            </div>

            {issue.metadata?.value && (
              <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 mt-2 font-mono truncate">
                {issue.metadata.value}
              </p>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: "unresolved", label: "Unresolved" },
  { key: "all", label: "All" },
  { key: "fatal", label: "Fatal" },
  { key: "error", label: "Errors" },
  { key: "warning", label: "Warnings" },
];

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

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Bugs & Errors"
        description="Live issues from Sentry, SweetLease production"
        actions={
          <Button variant="primary" icon={<RefreshCw size={14} />} loading={refreshing} onClick={handleRefresh}>
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <StatTile label="Total Issues" value={loading ? "-" : issues.length} />
        <StatTile label="Fatal" value={loading ? "-" : fatalCount} icon={<XCircle size={14} />} />
        <StatTile label="Errors" value={loading ? "-" : errorCount} icon={<AlertCircle size={14} />} />
        <StatTile label="Warnings" value={loading ? "-" : warningCount} icon={<AlertTriangle size={14} />} />
        <StatTile label="Total Events" value={loading ? "-" : totalEvents.toLocaleString()} />
      </div>

      <FilterChips items={TABS} value={activeTab} onChange={setActiveTab} className="mb-4" />

      {loading ? (
        <Spinner label="Loading issues from Sentry" />
      ) : error ? (
        <ErrorBanner
          message={`${error}. Check that SENTRY_AUTH_TOKEN is configured in .env.local`}
          onRetry={handleRefresh}
        />
      ) : issues.length === 0 ? (
        <Card>
          <EmptyState
            title="No issues found"
            hint={activeTab === "unresolved" ? "All clear, no unresolved issues." : `No ${activeTab} issues to display.`}
            icon={<CheckCircle2 size={28} className="mx-auto text-emerald-500" aria-hidden />}
          />
        </Card>
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
