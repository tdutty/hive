"use client";

import { Eye, CheckCircle } from "lucide-react";

export default function ListingMonitorPage() {
  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-amber-600/20 flex items-center justify-center">
          <Eye size={24} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Listing Monitor</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tracks price changes, DOM updates, and status changes on rental listings across platforms.
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle size={20} className="text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-900">Service Status</h2>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            Coming Soon
          </span>
        </div>
        <p className="text-sm text-slate-500">
          This service will continuously monitor rental listings across platforms to detect price drops, extended days on market, and status changes - signals that landlords are struggling to fill vacancies.
        </p>
      </div>

      {/* Capabilities */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Capabilities</h2>
        <ul className="space-y-3 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
            Real-time price change detection across rental platforms
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
            Days on market tracking and stale listing alerts
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
            Listing status change monitoring (active, pending, withdrawn)
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
            Automated outreach triggers for high-signal listings
          </li>
        </ul>
      </div>
    </div>
  );
}
