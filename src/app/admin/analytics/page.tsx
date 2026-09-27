"use client";

import { BarChart3, Play, ExternalLink, Bug, AlertTriangle } from "lucide-react";
import { buttonVariants, Card, CardHeader, CardBody, PageHeader } from "@/components/kit";

const POSTHOG_PROJECT_URL = "https://us.posthog.com/project";
const SENTRY_ORG_URL = "https://sentry.io/organizations";

const linkBtn = buttonVariants({ variant: "secondary", size: "sm" });

export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Analytics & Monitoring"
        description="User behavior, session replays, and error tracking. Each destination opens in its own tool."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* PostHog */}
        <Card>
          <CardHeader
            title="PostHog"
            description="Product analytics for sweetlease.io"
            actions={
              <a href={POSTHOG_PROJECT_URL} target="_blank" rel="noopener noreferrer" className={linkBtn}>
                <BarChart3 size={14} aria-hidden /> Open dashboard <ExternalLink size={12} className="text-slate-400" aria-hidden />
              </a>
            }
          />
          <CardBody className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">What it tracks</p>
              <ul className="space-y-1.5 text-sm text-slate-700">
                <li>Every pageview across the site</li>
                <li>Session recordings (watch user sessions)</li>
                <li>Button clicks, form submissions, inputs</li>
                <li>Referrer and UTM source tracking</li>
                <li>Bounce rates and page leave events</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Key pages tracked</p>
              <ul className="space-y-1.5 text-sm text-slate-700">
                <li className="flex items-baseline gap-2"><code className="text-xs font-mono text-slate-500 shrink-0">/site-access</code> Homepage / signup</li>
                <li className="flex items-baseline gap-2"><code className="text-xs font-mono text-slate-500 shrink-0">/programs/*</code> Program portals (515)</li>
                <li className="flex items-baseline gap-2"><code className="text-xs font-mono text-slate-500 shrink-0">/reddit</code> Reddit landing page</li>
                <li className="flex items-baseline gap-2"><code className="text-xs font-mono text-slate-500 shrink-0">/matches/*</code> Tenant matches pages</li>
                <li className="flex items-baseline gap-2"><code className="text-xs font-mono text-slate-500 shrink-0">/onboarding/*</code> Onboarding survey</li>
                <li className="flex items-baseline gap-2"><code className="text-xs font-mono text-slate-500 shrink-0">/landlord/*</code> Landlord invite pages</li>
              </ul>
            </div>
          </CardBody>
        </Card>

        {/* Session recordings */}
        <Card>
          <CardHeader
            title="Session recordings"
            description="Watch real visitors move through the site"
            actions={
              <a href={POSTHOG_PROJECT_URL} target="_blank" rel="noopener noreferrer" className={linkBtn}>
                <Play size={14} aria-hidden /> Watch recordings <ExternalLink size={12} className="text-slate-400" aria-hidden />
              </a>
            }
          />
          <CardBody>
            <p className="text-sm text-slate-700">
              Recordings live in the same PostHog project. Filter by page (for example <code className="text-xs font-mono text-slate-500">/onboarding/*</code>) to see where people drop off, or by UTM source to compare Reddit and program-portal traffic.
            </p>
          </CardBody>
        </Card>

        {/* Sentry */}
        <Card>
          <CardHeader
            title="Sentry"
            description="Error and performance monitoring"
            actions={
              <a href={SENTRY_ORG_URL} target="_blank" rel="noopener noreferrer" className={linkBtn}>
                <AlertTriangle size={14} aria-hidden /> Open Sentry <ExternalLink size={12} className="text-slate-400" aria-hidden />
              </a>
            }
          />
          <CardBody className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">What it tracks</p>
              <ul className="space-y-1.5 text-sm text-slate-700">
                <li>Unhandled exceptions and errors</li>
                <li>API failures and timeouts</li>
                <li>Performance metrics (slow pages, API latency)</li>
                <li>Stack traces with source maps</li>
              </ul>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-700 mb-3">
                Sentry error reports are also available on the Bugs page with full issue details, stack traces, and resolution status.
              </p>
              <a href="/admin/bugs" className={linkBtn}>
                <Bug size={14} aria-hidden /> View bug reports (Hive)
              </a>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
