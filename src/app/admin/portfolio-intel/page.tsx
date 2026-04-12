"use client";

import { Briefcase, CheckCircle } from "lucide-react";

export default function PortfolioIntelPage() {
  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-amber-600/20 flex items-center justify-center">
          <Briefcase size={24} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Portfolio Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">
            Identifies and tracks portfolio landlords with multiple properties across markets.
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
          This service will aggregate property ownership data to identify landlords managing multiple units - high-value targets who need consistent tenant pipelines and are more likely to partner at scale.
        </p>
      </div>

      {/* Capabilities */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Capabilities</h2>
        <ul className="space-y-3 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
            Multi-property ownership aggregation and mapping
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
            Portfolio size estimation and growth tracking
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
            LLC and entity resolution for hidden portfolios
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
            Cross-market portfolio holder identification
          </li>
        </ul>
      </div>
    </div>
  );
}
