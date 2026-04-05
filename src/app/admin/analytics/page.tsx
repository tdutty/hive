"use client";

import { useState } from "react";
import { BarChart3, Play, ExternalLink } from "lucide-react";

const POSTHOG_PROJECT_URL = "https://us.posthog.com/project";
const SENTRY_ORG_URL = "https://sentry.io/organizations";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"posthog" | "sentry">("posthog");

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 size={24} className="text-amber-500" />
            Analytics & Monitoring
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            User behavior, session replays, and error tracking
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("posthog")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === "posthog"
              ? "bg-amber-600 text-white"
              : "bg-[#2a2a3e] text-slate-400 hover:text-white"
          }`}
        >
          PostHog - User Analytics
        </button>
        <button
          onClick={() => setActiveTab("sentry")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === "sentry"
              ? "bg-red-600 text-white"
              : "bg-[#2a2a3e] text-slate-400 hover:text-white"
          }`}
        >
          Sentry - Error Tracking
        </button>
      </div>

      {activeTab === "posthog" && (
        <div className="space-y-6">
          {/* Quick Stats Embeds */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1e1e2d] border border-[#2f2f42] rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2 font-medium">
                What PostHog Tracks
              </div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Every pageview across the site
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Session recordings (watch user sessions)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Button clicks, form submissions, inputs
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Referrer and UTM source tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Bounce rates and page leave events
                </li>
              </ul>
            </div>

            <div className="bg-[#1e1e2d] border border-[#2f2f42] rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2 font-medium">
                Key Pages Tracked
              </div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono text-xs">/site-access</span>
                  Homepage / signup
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono text-xs">/programs/*</span>
                  Program portals (515)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono text-xs">/reddit</span>
                  Reddit landing page
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono text-xs">/matches/*</span>
                  Tenant matches pages
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono text-xs">/onboarding/*</span>
                  Onboarding survey
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono text-xs">/landlord/*</span>
                  Landlord invite pages
                </li>
              </ul>
            </div>

            <div className="bg-[#1e1e2d] border border-[#2f2f42] rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2 font-medium">
                Quick Actions
              </div>
              <div className="space-y-3">
                <a
                  href={`${POSTHOG_PROJECT_URL}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-[#2a2a3e] hover:bg-[#33334d] rounded-lg transition text-sm text-white"
                >
                  <BarChart3 size={16} className="text-amber-500" />
                  Open PostHog Dashboard
                  <ExternalLink size={12} className="ml-auto text-slate-500" />
                </a>
                <a
                  href={`${POSTHOG_PROJECT_URL}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-[#2a2a3e] hover:bg-[#33334d] rounded-lg transition text-sm text-white"
                >
                  <Play size={16} className="text-emerald-500" />
                  Watch Session Recordings
                  <ExternalLink size={12} className="ml-auto text-slate-500" />
                </a>
              </div>
            </div>
          </div>

          {/* PostHog Embed */}
          <div className="bg-[#1e1e2d] border border-[#2f2f42] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2f2f42] flex items-center justify-between">
              <div className="text-sm font-medium text-white">PostHog Dashboard</div>
              <a
                href={POSTHOG_PROJECT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"
              >
                Open full dashboard <ExternalLink size={10} />
              </a>
            </div>
            <div className="p-6">
              <iframe
                src={`${POSTHOG_PROJECT_URL}`}
                className="w-full h-[700px] rounded-lg border border-[#2f2f42]"
                title="PostHog Dashboard"
                allow="clipboard-read; clipboard-write"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "sentry" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#1e1e2d] border border-[#2f2f42] rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2 font-medium">
                What Sentry Tracks
              </div>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Unhandled exceptions and errors
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  API failures and timeouts
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Performance metrics (slow pages, API latency)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Stack traces with source maps
                </li>
              </ul>
            </div>

            <div className="bg-[#1e1e2d] border border-[#2f2f42] rounded-xl p-5">
              <div className="text-xs uppercase tracking-wider text-slate-500 mb-2 font-medium">
                Quick Actions
              </div>
              <div className="space-y-3">
                <a
                  href="/admin/bugs"
                  className="flex items-center gap-3 px-4 py-3 bg-[#2a2a3e] hover:bg-[#33334d] rounded-lg transition text-sm text-white"
                >
                  <Bug size={16} className="text-red-500" />
                  View Bug Reports (Hive)
                </a>
                <a
                  href={SENTRY_ORG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-[#2a2a3e] hover:bg-[#33334d] rounded-lg transition text-sm text-white"
                >
                  <ExternalLink size={16} className="text-amber-500" />
                  Open Sentry Dashboard
                  <ExternalLink size={12} className="ml-auto text-slate-500" />
                </a>
              </div>
            </div>
          </div>

          {/* Link to existing bugs page */}
          <div className="bg-[#1e1e2d] border border-[#2f2f42] rounded-xl p-6 text-center">
            <p className="text-slate-400 text-sm mb-4">
              Sentry error reports are available on the Bugs page with full issue details, stack traces, and resolution status.
            </p>
            <a
              href="/admin/bugs"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition"
            >
              <Bug size={16} />
              Go to Bug Reports
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Need to import Bug icon used in Sentry tab
import { Bug } from "lucide-react";
