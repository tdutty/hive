"use client";

import { useState, useEffect } from "react";
import {
  Zap,
  Building2,
  Calendar,
  Target,
  CheckSquare,
  Square,
  TrendingUp,
  ArrowRight,
  Activity,
  MapPin,
} from "lucide-react";

// --- Status Badge ---

type BadgeColor = "yellow" | "gray" | "green" | "blue";

function StatusBadge({ label, color }: { label: string; color: BadgeColor }) {
  const colors: Record<BadgeColor, string> = {
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    gray: "bg-slate-50 text-slate-500 border-slate-200",
    green: "bg-green-50 text-green-700 border-green-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}
    >
      {label}
    </span>
  );
}

// --- PM Software Data ---

interface PMPlatform {
  name: string;
  pmsUsing: string;
  apiAccess: string;
  marketplace: string;
  status: "Not Applied" | "Applied" | "Approved" | "Via Propify";
}

const PM_PLATFORMS: PMPlatform[] = [
  { name: "AppFolio", pmsUsing: "19,000+", apiAccess: "Stack API", marketplace: "Stack Marketplace", status: "Not Applied" },
  { name: "Buildium", pmsUsing: "15,000+", apiAccess: "Open API", marketplace: "Open Marketplace", status: "Not Applied" },
  { name: "Yardi", pmsUsing: "Enterprise", apiAccess: "SIPP Program", marketplace: "SIPP Partners", status: "Not Applied" },
  { name: "RealPage", pmsUsing: "Large portfolios", apiAccess: "Via Propify", marketplace: "N/A", status: "Via Propify" },
  { name: "Entrata", pmsUsing: "Multifamily", apiAccess: "Via Propify", marketplace: "N/A", status: "Via Propify" },
  { name: "RentManager", pmsUsing: "Mid-market", apiAccess: "REST API", marketplace: "Integration Network", status: "Not Applied" },
  { name: "Propertyware", pmsUsing: "SFR", apiAccess: "PWService", marketplace: "Open", status: "Not Applied" },
  { name: "ResMan", pmsUsing: "Regional", apiAccess: "Via Propify", marketplace: "N/A", status: "Via Propify" },
];

const STATUS_BADGE_COLOR: Record<PMPlatform["status"], BadgeColor> = {
  "Not Applied": "gray",
  Applied: "yellow",
  Approved: "green",
  "Via Propify": "blue",
};

// --- City Demand Data ---

interface CityDemand {
  city: string;
  hospital: string;
  annualDemand: number;
  tenantsInPipeline: number;
  pmPartners: number;
}

const CITY_DEMAND: CityDemand[] = [
  { city: "Boston", hospital: "Mass General / Brigham", annualDemand: 3000, tenantsInPipeline: 0, pmPartners: 0 },
  { city: "Houston", hospital: "Texas Medical Center", annualDemand: 2500, tenantsInPipeline: 0, pmPartners: 0 },
  { city: "Miami", hospital: "Jackson Memorial / UM", annualDemand: 1500, tenantsInPipeline: 0, pmPartners: 0 },
  { city: "Pittsburgh", hospital: "UPMC", annualDemand: 1200, tenantsInPipeline: 0, pmPartners: 0 },
  { city: "Cleveland", hospital: "Cleveland Clinic / UH", annualDemand: 900, tenantsInPipeline: 0, pmPartners: 0 },
  { city: "Nashville", hospital: "Vanderbilt", annualDemand: 800, tenantsInPipeline: 0, pmPartners: 0 },
  { city: "Cincinnati", hospital: "UC Medical / Cincinnati Children's", annualDemand: 700, tenantsInPipeline: 0, pmPartners: 0 },
  { city: "Columbus", hospital: "Ohio State Wexner", annualDemand: 650, tenantsInPipeline: 0, pmPartners: 0 },
  { city: "Sacramento", hospital: "UC Davis", annualDemand: 400, tenantsInPipeline: 0, pmPartners: 0 },
  { city: "Albuquerque", hospital: "UNM Hospital", annualDemand: 300, tenantsInPipeline: 0, pmPartners: 0 },
  { city: "Lubbock", hospital: "Texas Tech / UMC", annualDemand: 200, tenantsInPipeline: 0, pmPartners: 0 },
];

const MAX_DEMAND = Math.max(...CITY_DEMAND.map((c) => c.annualDemand));

// --- Timeline Data ---

interface TimelinePhase {
  months: string;
  label: string;
  description: string;
  isCurrent: boolean;
}

const ANNUAL_CYCLE: TimelinePhase[] = [
  { months: "Oct - Feb", label: "Collect Profiles", description: "Gather tenant preferences, budgets, and program details", isCurrent: false },
  { months: "March", label: "Match Day", description: "NRMP results lock in - demand is known", isCurrent: false },
  { months: "Apr - May", label: "Peak Matching", description: "80% of placements happen in this window", isCurrent: true },
  { months: "June", label: "Final Signing", description: "Last lease signatures and move-in coordination", isCurrent: false },
  { months: "July 1", label: "Move-in", description: "Residents start at their programs", isCurrent: false },
];

// --- Roadmap Data ---

interface RoadmapPhase {
  phase: string;
  timeline: string;
  title: string;
  items: string[];
}

const ROADMAP: RoadmapPhase[] = [
  {
    phase: "Phase 1",
    timeline: "Month 1-2",
    title: "Foundation",
    items: ["Propify partnership call", "Manual pilot with 5-10 PMs", "Validate matching logic with real placements"],
  },
  {
    phase: "Phase 2",
    timeline: "Month 3-5",
    title: "Integration Build",
    items: ["API integration with Propify", "Matching score algorithm", "Apply to AppFolio + Buildium marketplaces"],
  },
  {
    phase: "Phase 3",
    timeline: "Month 6-8",
    title: "Launch",
    items: ["Live platform with automated vacancy feeds", "First automated matching cycle", "PM dashboard for partners"],
  },
  {
    phase: "Phase 4",
    timeline: "Month 9-12",
    title: "Scale",
    items: ["Predictive placement from profile data", "Expand to 20+ cities", "Direct marketplace integrations"],
  },
];

// --- Action Items ---

interface ActionItem {
  id: string;
  label: string;
}

const ACTION_ITEMS: ActionItem[] = [
  { id: "propify-email", label: "Email Propify (hello@propifyapp.com) for partnership call" },
  { id: "appfolio-apply", label: "Apply to AppFolio Stack Marketplace" },
  { id: "buildium-apply", label: "Apply to Buildium Open Marketplace" },
  { id: "rentmanager-apply", label: "Apply to RentManager Integration Network" },
  { id: "matching-algo", label: "Build matching score algorithm" },
  { id: "nrmp-map", label: "Map NRMP 2026 match data to city-level demand" },
];

// --- Main Page ---

export default function PropifyPage() {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("propify-actions");
      if (saved) {
        setCheckedItems(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage
  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem("propify-actions", JSON.stringify(next));
      return next;
    });
  };

  const totalDemand = CITY_DEMAND.reduce((sum, c) => sum + c.annualDemand, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Zap size={24} className="text-amber-500" />
          <h1 className="text-2xl font-bold text-slate-900">
            Propify Integration & Predictive Placement
          </h1>
        </div>
        <p className="text-slate-500 text-sm ml-9">
          From tenant placement service to medical housing marketplace
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Integration Status</p>
          <StatusBadge label="Planning" color="yellow" />
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">PM Software Connected</p>
          <p className="text-2xl font-bold text-slate-900">0</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Annual Demand (All Markets)</p>
          <p className="text-2xl font-bold text-slate-900">{totalDemand.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Pre-Match Window</p>
          <p className="text-2xl font-bold text-slate-900">120 <span className="text-sm font-normal text-slate-400">days</span></p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-xs text-slate-500 mb-1">Placements This Cycle</p>
          <p className="text-2xl font-bold text-slate-900">0</p>
        </div>
      </div>

      {/* PM Software Landscape */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Building2 size={18} className="text-slate-400" />
            PM Software Landscape
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Platforms Propify connects to and direct marketplace opportunities
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Platform</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">PMs Using It</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">API Access</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Marketplace</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Our Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PM_PLATFORMS.map((p) => (
                <tr key={p.name} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-6 py-3 text-slate-600">{p.pmsUsing}</td>
                  <td className="px-6 py-3 text-slate-600">{p.apiAccess}</td>
                  <td className="px-6 py-3 text-slate-600">{p.marketplace}</td>
                  <td className="px-6 py-3">
                    <StatusBadge label={p.status} color={STATUS_BADGE_COLOR[p.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demand Forecast by City */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-slate-400" />
            Demand Forecast by City
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Estimated annual medical resident demand across target markets
          </p>
        </div>
        <div className="p-6 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {CITY_DEMAND.map((city) => (
            <div
              key={city.city}
              className="border border-slate-200 rounded-lg p-4 hover:border-amber-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <MapPin size={14} className="text-amber-500" />
                  {city.city}
                </h3>
                <span className="text-lg font-bold text-slate-900">
                  {city.annualDemand.toLocaleString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">{city.hospital}</p>
              {/* Bar chart */}
              <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${(city.annualDemand / MAX_DEMAND) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>{city.tenantsInPipeline} in pipeline</span>
                <span>{city.pmPartners} PM partners</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Predictive Timeline */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Calendar size={18} className="text-slate-400" />
            Predictive Timeline - Annual Cycle
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            The medical residency housing cycle repeats every year. We are currently in the peak matching window.
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-start gap-0">
            {ANNUAL_CYCLE.map((phase, i) => (
              <div key={phase.months} className="flex-1 relative">
                {/* Connector line */}
                {i < ANNUAL_CYCLE.length - 1 && (
                  <div className="absolute top-4 left-1/2 right-0 h-0.5 bg-slate-200 z-0" />
                )}
                {i > 0 && (
                  <div className="absolute top-4 left-0 right-1/2 h-0.5 bg-slate-200 z-0" />
                )}
                {/* Dot */}
                <div className="flex justify-center mb-3 relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      phase.isCurrent
                        ? "bg-amber-500 text-white ring-4 ring-amber-100"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </div>
                </div>
                <div className="text-center px-2">
                  <p
                    className={`text-xs font-semibold mb-0.5 ${
                      phase.isCurrent ? "text-amber-600" : "text-slate-500"
                    }`}
                  >
                    {phase.months}
                  </p>
                  <p
                    className={`text-sm font-medium mb-1 ${
                      phase.isCurrent ? "text-slate-900" : "text-slate-700"
                    }`}
                  >
                    {phase.label}
                  </p>
                  <p className="text-xs text-slate-400">{phase.description}</p>
                  {phase.isCurrent && (
                    <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      WE ARE HERE
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Execution Roadmap */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Target size={18} className="text-slate-400" />
            Execution Roadmap
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {ROADMAP.map((phase, i) => (
            <div
              key={phase.phase}
              className={`border rounded-lg p-5 ${
                i === 0
                  ? "border-amber-300 bg-amber-50/30"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    i === 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {phase.phase}
                </span>
                <span className="text-xs text-slate-400">{phase.timeline}</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-3">{phase.title}</h3>
              <ul className="space-y-2">
                {phase.items.map((item) => (
                  <li
                    key={item}
                    className="text-sm text-slate-600 flex items-start gap-2"
                  >
                    <ArrowRight size={14} className="text-slate-300 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Next Actions */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Activity size={18} className="text-slate-400" />
            Next Actions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immediate next steps - checkbox states persist in your browser
          </p>
        </div>
        <div className="p-6 space-y-3">
          {ACTION_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className="flex items-center gap-3 w-full text-left group"
            >
              {checkedItems[item.id] ? (
                <CheckSquare size={20} className="text-green-500 flex-shrink-0" />
              ) : (
                <Square size={20} className="text-slate-300 group-hover:text-slate-400 flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  checkedItems[item.id]
                    ? "text-slate-400 line-through"
                    : "text-slate-700"
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
