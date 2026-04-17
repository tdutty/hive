"use client";

import { useState, useEffect } from "react";
import { sweetleaseApi } from "@/lib/api";
import {
  Building2,
  Plus,
  ChevronDown,
  ChevronRight,
  Globe,
  Phone,
  Mail,
  MapPin,
  X,
  Filter,
  Users,
  Home,
  CheckCircle,
  Star,
  RefreshCw,
  Loader2,
} from "lucide-react";

// --- Types ---

type Stage = "Lead Drop" | "Responded" | "Placement" | "Repeat" | "Partnership";

interface PMCompany {
  id: string;
  company: string;
  city: string;
  website: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  neighborhoods: string;
  estDoors: number;
  stage: Stage;
  lastAction: string;
  notes: string;
  pmSoftware: string;
  tenantsMatched: number;
  placementsMade: number;
  currentVacancies: number;
}

interface Stats {
  total: number;
  totalDoors: number;
  totalPlacements: number;
  stageCounts: Record<string, number>;
}

// --- Constants ---

const STAGES: Stage[] = ["Lead Drop", "Responded", "Placement", "Repeat", "Partnership"];

const CITIES = ["Houston", "Nashville", "Columbus", "Pittsburgh", "Cleveland", "Cincinnati"];

const STAGE_COLORS: Record<Stage, { bg: string; text: string; border: string }> = {
  "Lead Drop": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Responded: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  Placement: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  Repeat: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  Partnership: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
};

// --- Components ---

function StageBadge({ stage, onClick }: { stage: Stage; onClick?: () => void }) {
  const colors = STAGE_COLORS[stage];
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border} ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
    >
      {stage}
    </span>
  );
}

function StageDropdown({ current, onSelect, onClose }: { current: Stage; onSelect: (s: Stage) => void; onClose: () => void }) {
  return (
    <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[160px]">
      {STAGES.map((s) => (
        <button
          key={s}
          onClick={() => { onSelect(s); onClose(); }}
          className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${s === current ? "font-semibold" : ""}`}
        >
          <StageBadge stage={s} />
          {s === current && <span className="text-slate-400 text-xs ml-auto">(current)</span>}
        </button>
      ))}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-1">
        <div className="text-slate-400">{icon}</div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

// --- Add PM Modal ---

function AddPMModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (data: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({
    company: "", city: CITIES[0], website: "", contactName: "", contactEmail: "", contactPhone: "", neighborhoods: "", estDoors: "", notes: "", pmSoftware: "",
  });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company.trim()) return;
    setSaving(true);
    await onSave({ ...form, estDoors: parseInt(form.estDoors) || 0 });
    setForm({ company: "", city: CITIES[0], website: "", contactName: "", contactEmail: "", contactPhone: "", neighborhoods: "", estDoors: "", notes: "", pmSoftware: "" });
    setSaving(false);
    onClose();
  };

  const inputClass = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent";
  const labelClass = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Add Property Manager</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X size={20} className="text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Company Name *</label>
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputClass} placeholder="Company name" required />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass}>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Website</label>
            <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputClass} placeholder="example.com" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Contact Name</label>
              <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputClass} placeholder="Name" />
            </div>
            <div>
              <label className={labelClass}>Contact Email</label>
              <input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className={inputClass} placeholder="email@co.com" />
            </div>
            <div>
              <label className={labelClass}>Contact Phone</label>
              <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className={inputClass} placeholder="555-123-4567" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Neighborhoods</label>
              <input value={form.neighborhoods} onChange={(e) => setForm({ ...form, neighborhoods: e.target.value })} className={inputClass} placeholder="Midtown, Heights, etc." />
            </div>
            <div>
              <label className={labelClass}>Est. Doors</label>
              <input value={form.estDoors} onChange={(e) => setForm({ ...form, estDoors: e.target.value })} className={inputClass} placeholder="0" type="number" min="0" />
            </div>
          </div>
          <div>
            <label className={labelClass}>PM Software</label>
            <input value={form.pmSoftware} onChange={(e) => setForm({ ...form, pmSoftware: e.target.value })} className={inputClass} placeholder="AppFolio, Buildium, etc." />
          </div>
          <div>
            <label className={labelClass}>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputClass} rows={3} placeholder="Notes about this PM..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 font-medium disabled:opacity-50">
              {saving ? "Adding..." : "Add PM"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Row Component ---

function PMRow({ pm, isExpanded, showStageDropdown, onToggleExpand, onToggleStageDropdown, onCloseStageDropdown, onUpdateStage }: {
  pm: PMCompany; isExpanded: boolean; showStageDropdown: boolean;
  onToggleExpand: () => void; onToggleStageDropdown: () => void; onCloseStageDropdown: () => void; onUpdateStage: (stage: Stage) => void;
}) {
  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors">
        <td className="px-4 py-3">
          <button onClick={onToggleExpand} className="text-slate-400 hover:text-slate-600">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </td>
        <td className="px-4 py-3"><span className="text-sm font-medium text-slate-900">{pm.company}</span></td>
        <td className="px-4 py-3"><div className="flex items-center gap-1.5 text-sm text-slate-600"><MapPin size={14} className="text-slate-400" />{pm.city}</div></td>
        <td className="px-4 py-3"><span className="text-sm text-slate-600">{pm.neighborhoods || "-"}</span></td>
        <td className="px-4 py-3"><span className="text-sm text-slate-900 font-medium">{pm.estDoors || "-"}</span></td>
        <td className="px-4 py-3 relative">
          <StageBadge stage={pm.stage} onClick={onToggleStageDropdown} />
          {showStageDropdown && <StageDropdown current={pm.stage} onSelect={onUpdateStage} onClose={onCloseStageDropdown} />}
        </td>
        <td className="px-4 py-3">
          {pm.contactName ? (
            <div className="text-sm">
              <span className="text-slate-900">{pm.contactName}</span>
              {pm.contactEmail && <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5"><Mail size={10} />{pm.contactEmail}</div>}
            </div>
          ) : pm.contactEmail ? (
            <div className="flex items-center gap-1 text-xs text-slate-500"><Mail size={10} />{pm.contactEmail}</div>
          ) : (
            <span className="text-sm text-slate-400">-</span>
          )}
        </td>
        <td className="px-4 py-3"><span className="text-sm text-slate-600">{pm.lastAction || "-"}</span></td>
        <td className="px-4 py-3"><span className="text-sm text-slate-500 truncate max-w-[200px] block">{pm.notes || "-"}</span></td>
      </tr>
      {isExpanded && (
        <tr className="bg-slate-50">
          <td colSpan={9} className="px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div>
                <span className="text-slate-400 block mb-1">Website</span>
                {pm.website ? (
                  <a href={`https://${pm.website}`} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 flex items-center gap-1"><Globe size={14} />{pm.website}</a>
                ) : <span className="text-slate-500">-</span>}
              </div>
              <div><span className="text-slate-400 block mb-1">PM Software</span><span className="text-slate-900">{pm.pmSoftware || "-"}</span></div>
              <div><span className="text-slate-400 block mb-1">Tenants Matched</span><span className="text-slate-900 flex items-center gap-1"><Users size={14} className="text-slate-400" />{pm.tenantsMatched}</span></div>
              <div><span className="text-slate-400 block mb-1">Placements Made</span><span className="text-slate-900 flex items-center gap-1"><CheckCircle size={14} className="text-slate-400" />{pm.placementsMade}</span></div>
              <div><span className="text-slate-400 block mb-1">Current Vacancies</span><span className="text-slate-900">{pm.currentVacancies}</span></div>
              <div>
                <span className="text-slate-400 block mb-1">Contact Phone</span>
                {pm.contactPhone ? <span className="text-slate-900 flex items-center gap-1"><Phone size={14} className="text-slate-400" />{pm.contactPhone}</span> : <span className="text-slate-500">-</span>}
              </div>
              <div className="col-span-2"><span className="text-slate-400 block mb-1">Notes</span><span className="text-slate-700">{pm.notes || "No notes"}</span></div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// --- Main Page ---

export default function PMPipelinePage() {
  const [pms, setPms] = useState<PMCompany[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, totalDoors: 0, totalPlacements: 0, stageCounts: {} });
  const [loading, setLoading] = useState(true);
  const [filterCity, setFilterCity] = useState<string>("All");
  const [filterStage, setFilterStage] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stageDropdownId, setStageDropdownId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = async () => {
    try {
      const data = await sweetleaseApi.get<{ pms: PMCompany[]; stats: Stats }>("/api/admin/pm-pipeline", { city: filterCity, stage: filterStage });
      setPms(data.pms);
      setStats(data.stats);
    } catch (err) {
      console.error("Failed to fetch PM pipeline:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterCity, filterStage]);

  const updateStage = async (id: string, stage: Stage) => {
    // Optimistic update
    setPms((prev) => prev.map((pm) => pm.id === id ? { ...pm, stage, lastAction: new Date().toISOString().split("T")[0] } : pm));
    try {
      await sweetleaseApi.patch("/api/admin/pm-pipeline", { id, stage });
      fetchData(); // Refresh stats
    } catch (err) {
      console.error("Failed to update stage:", err);
      fetchData(); // Revert on error
    }
  };

  const addPM = async (data: Record<string, unknown>) => {
    try {
      await sweetleaseApi.post("/api/admin/pm-pipeline", data);
      fetchData();
    } catch (err) {
      console.error("Failed to add PM:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PM Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">Track property manager acquisition across {CITIES.length} cities</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setLoading(true); fetchData(); }} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium">
            <Plus size={16} /> Add PM
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total PMs" value={stats.total} icon={<Building2 size={20} />} />
        <StatCard label="Total Doors (est)" value={stats.totalDoors.toLocaleString()} icon={<Home size={20} />} />
        <StatCard label="Placements" value={stats.totalPlacements} icon={<CheckCircle size={20} />} />
        <StatCard label="Partnerships" value={stats.stageCounts["Partnership"] || 0} icon={<Star size={20} />} />
      </div>

      {/* Stage breakdown */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-medium text-slate-500 mb-3">Pipeline Stages</h3>
        <div className="flex flex-wrap gap-4">
          {STAGES.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <StageBadge stage={s} />
              <span className="text-sm font-semibold text-slate-900">{stats.stageCounts[s] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-500"><Filter size={16} /><span className="text-sm font-medium">Filters:</span></div>
        <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
          <option value="All">All Cities</option>
          {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStage} onChange={(e) => setFilterStage(e.target.value)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
          <option value="All">All Stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-sm text-slate-400">{pms.length} results</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3 w-8" />
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Company</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">City</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Neighborhoods</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Doors</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Stage</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Contact</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Last Action</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pms.map((pm) => (
                <PMRow
                  key={pm.id}
                  pm={pm}
                  isExpanded={expandedId === pm.id}
                  showStageDropdown={stageDropdownId === pm.id}
                  onToggleExpand={() => setExpandedId(expandedId === pm.id ? null : pm.id)}
                  onToggleStageDropdown={() => setStageDropdownId(stageDropdownId === pm.id ? null : pm.id)}
                  onCloseStageDropdown={() => setStageDropdownId(null)}
                  onUpdateStage={(stage) => updateStage(pm.id, stage)}
                />
              ))}
              {pms.length === 0 && (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400 text-sm">No PMs match current filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddPMModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={addPM} />
    </div>
  );
}
