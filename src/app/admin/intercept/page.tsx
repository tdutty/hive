"use client";

import { MessageCircle, CheckCircle } from "lucide-react";

export default function InterceptPage() {
  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-amber-600/20 flex items-center justify-center">
          <MessageCircle size={24} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Intercept Messages</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitors and intercepts relevant communications for outreach timing.
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
            Active
          </span>
        </div>
        <p className="text-sm text-slate-500">
          This service will monitor relevant communication channels and signals to optimize outreach timing - ensuring messages reach landlords at the moment they are most receptive to tenant placement services.
        </p>
      </div>

      {/* Capabilities */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Capabilities</h2>
        <ul className="space-y-3 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
            Communication signal monitoring across channels
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
            Optimal outreach timing recommendations
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
            Intent signal aggregation and scoring
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
            Automated message queue based on intercept triggers
          </li>
        </ul>
      </div>
    </div>
  );
}
