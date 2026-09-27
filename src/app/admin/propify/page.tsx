"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Square, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardBody, Badge, statusTone, StatTile, PageHeader, Table, THead, TH, TBody, TR, TD } from "@/components/kit";

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
    <div className="max-w-7xl">
      <PageHeader
        title="Propify Integration & Predictive Placement"
        meta="Strategy · PM software integrations"
        description={
          <>
            From tenant placement service to medical housing marketplace.
            <span className="block text-xs text-slate-400 mt-1">Static playbook. The figures and phases are hardcoded and checkbox state is stored in this browser only.</span>
          </>
        }
      />

      {/* Status tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        <StatTile label="Integration status" value={<Badge tone={statusTone("Planning")} dot>Planning</Badge>} />
        <StatTile label="PM software connected" value="0" />
        <StatTile label="Annual demand" value={totalDemand.toLocaleString()} hint="all markets" />
        <StatTile label="Pre-match window" value="120" hint="days" />
        <StatTile label="Placements this cycle" value="0" />
      </div>

      <div className="space-y-5">
        {/* PM Software Landscape */}
        <Card>
          <CardHeader title="PM software landscape" description="Platforms Propify connects to and direct marketplace opportunities" />
          <Table>
            <THead>
              <TR>
                <TH>Platform</TH>
                <TH>PMs using it</TH>
                <TH>API access</TH>
                <TH>Marketplace</TH>
                <TH>Our status</TH>
              </TR>
            </THead>
            <TBody>
              {PM_PLATFORMS.map((p) => (
                <TR key={p.name}>
                  <TD className="font-medium text-slate-900">{p.name}</TD>
                  <TD muted>{p.pmsUsing}</TD>
                  <TD muted>{p.apiAccess}</TD>
                  <TD muted>{p.marketplace}</TD>
                  <TD><Badge tone={statusTone(p.status)} dot>{p.status}</Badge></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        {/* Demand Forecast by City */}
        <Card>
          <CardHeader title="Demand forecast by city" description="Estimated annual medical resident demand across target markets" />
          <Table>
            <THead>
              <TR>
                <TH>City</TH>
                <TH>Anchor hospital</TH>
                <TH numeric>Annual demand</TH>
                <TH className="w-40 hidden md:table-cell"><span className="sr-only">Share of largest market</span></TH>
                <TH numeric>In pipeline</TH>
                <TH numeric>PM partners</TH>
              </TR>
            </THead>
            <TBody>
              {CITY_DEMAND.map((city) => (
                <TR key={city.city}>
                  <TD className="font-medium text-slate-900">{city.city}</TD>
                  <TD muted>{city.hospital}</TD>
                  <TD numeric className="font-medium">{city.annualDemand.toLocaleString()}</TD>
                  <TD className="hidden md:table-cell">
                    <div className="w-full bg-slate-100 rounded-full h-1.5" aria-hidden>
                      <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${(city.annualDemand / MAX_DEMAND) * 100}%` }} />
                    </div>
                  </TD>
                  <TD numeric muted>{city.tenantsInPipeline}</TD>
                  <TD numeric muted>{city.pmPartners}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        {/* Predictive Timeline */}
        <Card>
          <CardHeader title="Predictive timeline: annual cycle" description="The medical residency housing cycle repeats every year. We are currently in the peak matching window." />
          <CardBody className="overflow-x-auto">
            <ol className="flex items-start min-w-[640px]">
              {ANNUAL_CYCLE.map((phase, i) => (
                <li key={phase.months} className="flex-1 relative">
                  {i < ANNUAL_CYCLE.length - 1 && <div className="absolute top-4 left-1/2 right-0 h-px bg-slate-200" aria-hidden />}
                  {i > 0 && <div className="absolute top-4 left-0 right-1/2 h-px bg-slate-200" aria-hidden />}
                  <div className="flex justify-center mb-3 relative">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold tabular ${
                        phase.isCurrent ? "bg-amber-600 text-white ring-4 ring-amber-50" : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                      aria-current={phase.isCurrent ? "step" : undefined}
                    >
                      {i + 1}
                    </div>
                  </div>
                  <div className="text-center px-2">
                    <p className={`text-xs font-medium mb-0.5 ${phase.isCurrent ? "text-amber-700" : "text-slate-500"}`}>{phase.months}</p>
                    <p className="text-sm font-medium text-slate-900 mb-1">{phase.label}</p>
                    <p className="text-xs text-slate-500">{phase.description}</p>
                    {phase.isCurrent && <div className="mt-2"><Badge tone="accent">We are here</Badge></div>}
                  </div>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>

        {/* Execution Roadmap */}
        <Card>
          <CardHeader title="Execution roadmap" />
          <CardBody className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {ROADMAP.map((phase, i) => (
              <div key={phase.phase} className={`border rounded-lg p-4 ${i === 0 ? "border-amber-300" : "border-slate-200"}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge tone={i === 0 ? "accent" : "neutral"}>{phase.phase}</Badge>
                  <span className="text-xs text-slate-500">{phase.timeline}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">{phase.title}</h3>
                <ul className="space-y-1.5">
                  {phase.items.map((item) => (
                    <li key={item} className="text-sm text-slate-700 flex items-start gap-2">
                      <ArrowRight size={14} className="text-slate-300 mt-0.5 shrink-0" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Next Actions */}
        <Card>
          <CardHeader
            title="Next actions"
            description="Immediate next steps. Checkbox states persist in your browser."
            actions={<span className="text-xs text-slate-500 tabular">{ACTION_ITEMS.filter((a) => checkedItems[a.id]).length}/{ACTION_ITEMS.length} done</span>}
          />
          <ul className="divide-y divide-slate-100">
            {ACTION_ITEMS.map((item) => {
              const done = !!checkedItems[item.id];
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={done}
                    onClick={() => toggleItem(item.id)}
                    className="flex items-center gap-3 w-full text-left px-4 py-2.5 hover:bg-slate-50 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset"
                  >
                    {done ? (
                      <CheckSquare size={18} className="text-emerald-600 shrink-0" aria-hidden />
                    ) : (
                      <Square size={18} className="text-slate-300 group-hover:text-slate-400 shrink-0" aria-hidden />
                    )}
                    <span className={`text-sm ${done ? "text-slate-400 line-through" : "text-slate-700"}`}>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
