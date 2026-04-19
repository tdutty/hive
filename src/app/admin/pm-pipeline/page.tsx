"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Users,
  CheckCircle,
  CheckCircle2,
  Star,
  RefreshCw,
  Loader2,
  Search,
  MessageSquare,
  ExternalLink,
  Send,
  FileText,
  Inbox,
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

const STAGE_CONFIG: Record<Stage, { color: string; bg: string; text: string; border: string; barBg: string; icon: React.ReactNode }> = {
  "Lead Drop": {
    color: "#3b82f6",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    barBg: "bg-blue-500",
    icon: <Send size={14} />,
  },
  Responded: {
    color: "#f59e0b",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    barBg: "bg-amber-500",
    icon: <MessageSquare size={14} />,
  },
  Placement: {
    color: "#22c55e",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    barBg: "bg-green-500",
    icon: <CheckCircle size={14} />,
  },
  Repeat: {
    color: "#a855f7",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    barBg: "bg-purple-500",
    icon: <RefreshCw size={14} />,
  },
  Partnership: {
    color: "#eab308",
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    border: "border-yellow-300",
    barBg: "bg-yellow-500",
    icon: <Star size={14} />,
  },
};

const STAGE_ORDER: Record<Stage, number> = {
  "Lead Drop": 0,
  Responded: 1,
  Placement: 2,
  Repeat: 3,
  Partnership: 4,
};

// --- Utility ---

function relativeTime(dateStr: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

// --- Components ---

function StageBadge({ stage, onClick, size = "sm" }: { stage: Stage; onClick?: () => void; size?: "sm" | "md" }) {
  const config = STAGE_CONFIG[stage];
  const progressWidth = ((STAGE_ORDER[stage] + 1) / STAGES.length) * 100;
  const padClass = size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs";

  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden inline-flex items-center gap-1.5 ${padClass} rounded-full font-medium border ${config.bg} ${config.text} ${config.border} ${onClick ? "cursor-pointer hover:shadow-sm transition-shadow" : "cursor-default"}`}
    >
      <div
        className={`absolute inset-y-0 left-0 opacity-[0.12] ${config.barBg}`}
        style={{ width: `${progressWidth}%` }}
      />
      <span className="relative flex items-center gap-1.5">
        {config.icon}
        {stage}
      </span>
    </button>
  );
}

function StageDropdown({ current, onSelect, onClose }: { current: Stage; onSelect: (s: Stage) => void; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 min-w-[180px] right-0">
        <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
          Update Stage
        </div>
        {STAGES.map((s) => (
          <button
            key={s}
            onClick={() => { onSelect(s); onClose(); }}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors ${s === current ? "bg-slate-50" : ""}`}
          >
            <StageBadge stage={s} />
            {s === current && <span className="text-slate-400 text-xs ml-auto">Current</span>}
          </button>
        ))}
      </div>
    </>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${accent || "bg-amber-50"}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// --- Pipeline Funnel ---

function PipelineFunnel({ stageCounts, total, activeStage, onStageClick }: {
  stageCounts: Record<string, number>;
  total: number;
  activeStage: string;
  onStageClick: (stage: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Pipeline Funnel</h3>
        {activeStage !== "All" && (
          <button
            onClick={() => onStageClick("All")}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium"
          >
            Clear filter
          </button>
        )}
      </div>
      <div className="flex rounded-lg overflow-hidden h-10 bg-slate-100">
        {STAGES.map((s) => {
          const count = stageCounts[s] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          if (pct === 0) return null;
          const config = STAGE_CONFIG[s];
          const isActive = activeStage === "All" || activeStage === s;
          return (
            <button
              key={s}
              onClick={() => onStageClick(activeStage === s ? "All" : s)}
              className={`relative flex items-center justify-center transition-all ${config.barBg} ${isActive ? "opacity-100" : "opacity-40"} hover:opacity-100`}
              style={{ width: `${Math.max(pct, 8)}%` }}
              title={`${s}: ${count}`}
            >
              <span className="text-white text-xs font-bold drop-shadow-sm">{count}</span>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {STAGES.map((s) => {
          const config = STAGE_CONFIG[s];
          const count = stageCounts[s] || 0;
          const isActive = activeStage === s;
          return (
            <button
              key={s}
              onClick={() => onStageClick(isActive ? "All" : s)}
              className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ${isActive ? `${config.bg} ${config.text} font-semibold ring-1 ${config.border}` : "text-slate-500 hover:text-slate-700"}`}
            >
              <span className={`w-2 h-2 rounded-full ${config.barBg}`} />
              {s}
              <span className="font-semibold">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- City Chips ---

function CityChips({ pms, activeCity, onCityClick }: {
  pms: PMCompany[];
  activeCity: string;
  onCityClick: (city: string) => void;
}) {
  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pms.forEach((pm) => {
      counts[pm.city] = (counts[pm.city] || 0) + 1;
    });
    return counts;
  }, [pms]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
          <MapPin size={14} className="text-slate-400" />
          Cities
        </h3>
        {activeCity !== "All" && (
          <button
            onClick={() => onCityClick("All")}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium"
          >
            Show all
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {CITIES.map((city) => {
          const count = cityCounts[city] || 0;
          const isActive = activeCity === city;
          return (
            <button
              key={city}
              onClick={() => onCityClick(isActive ? "All" : city)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? "bg-amber-500 text-white shadow-sm"
                  : count > 0
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  : "bg-slate-50 text-slate-400"
              }`}
            >
              {city}
              <span className={`text-xs font-bold ${isActive ? "text-amber-100" : "text-slate-400"}`}>{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Add PM Modal ---

function AddPMModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (data: Record<string, unknown>) => void }) {
  const [form, setForm] = useState({
    company: "", city: CITIES[0], website: "", contactName: "", contactEmail: "", contactPhone: "", neighborhoods: "", estDoors: "", notes: "", pmSoftware: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const filteredCities = useMemo(
    () => CITIES.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase())),
    [citySearch]
  );

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.company.trim()) errs.company = "Company name is required";
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      errs.contactEmail = "Invalid email format";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    await onSave({ ...form, estDoors: parseInt(form.estDoors) || 0 });
    setForm({ company: "", city: CITIES[0], website: "", contactName: "", contactEmail: "", contactPhone: "", neighborhoods: "", estDoors: "", notes: "", pmSoftware: "" });
    setErrors({});
    setSaving(false);
    onClose();
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
      errors[field] ? "border-red-300 bg-red-50" : "border-slate-200 bg-white hover:border-slate-300"
    }`;
  const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-slate-100 rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Add Property Manager</h2>
            <p className="text-xs text-slate-500 mt-0.5">Fill in the details to add a new PM to the pipeline</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Company + City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Company Name *</label>
              <input
                value={form.company}
                onChange={(e) => { setForm({ ...form, company: e.target.value }); setErrors({ ...errors, company: "" }); }}
                className={inputClass("company")}
                placeholder="Acme Properties"
              />
              {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company}</p>}
            </div>
            <div className="relative">
              <label className={labelClass}>City</label>
              <input
                value={showCityDropdown ? citySearch : form.city}
                onFocus={() => { setShowCityDropdown(true); setCitySearch(""); }}
                onChange={(e) => setCitySearch(e.target.value)}
                onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                className={inputClass("city")}
                placeholder="Search city..."
              />
              {showCityDropdown && filteredCities.length > 0 && (
                <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg py-1 max-h-[160px] overflow-y-auto">
                  {filteredCities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setForm({ ...form, city: c }); setCitySearch(""); setShowCityDropdown(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-amber-50 hover:text-amber-700 transition-colors ${form.city === c ? "bg-amber-50 text-amber-700 font-medium" : "text-slate-700"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Website */}
          <div>
            <label className={labelClass}>Website</label>
            <div className="relative">
              <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className={`${inputClass("website")} pl-9`}
                placeholder="www.example.com"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Information</h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className={labelClass}>Name</label>
                <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className={inputClass("contactName")} placeholder="John Smith" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    value={form.contactEmail}
                    onChange={(e) => { setForm({ ...form, contactEmail: e.target.value }); setErrors({ ...errors, contactEmail: "" }); }}
                    className={inputClass("contactEmail")}
                    placeholder="john@company.com"
                    type="email"
                  />
                  {errors.contactEmail && <p className="text-xs text-red-500 mt-1">{errors.contactEmail}</p>}
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className={inputClass("contactPhone")} placeholder="555-123-4567" />
                </div>
              </div>
            </div>
          </div>

          {/* Property Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Neighborhoods</label>
              <input value={form.neighborhoods} onChange={(e) => setForm({ ...form, neighborhoods: e.target.value })} className={inputClass("neighborhoods")} placeholder="Midtown, Heights" />
            </div>
            <div>
              <label className={labelClass}>Est. Doors</label>
              <input value={form.estDoors} onChange={(e) => setForm({ ...form, estDoors: e.target.value })} className={inputClass("estDoors")} placeholder="0" type="number" min="0" />
            </div>
          </div>

          <div>
            <label className={labelClass}>PM Software</label>
            <input value={form.pmSoftware} onChange={(e) => setForm({ ...form, pmSoftware: e.target.value })} className={inputClass("pmSoftware")} placeholder="AppFolio, Buildium, etc." />
          </div>

          <div>
            <label className={labelClass}>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${inputClass("notes")} resize-none`} rows={3} placeholder="Any relevant notes..." />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-semibold disabled:opacity-50 shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              {saving ? <><Loader2 size={14} className="animate-spin" /> Adding...</> : <><Plus size={14} /> Add PM</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --- Edit Notes Modal ---

function EditNotesModal({ pm, onClose, onSave }: { pm: PMCompany; onClose: () => void; onSave: (notes: string) => void }) {
  const [notes, setNotes] = useState(pm.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(notes);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Update Notes</h2>
          <p className="text-xs text-slate-500">{pm.company}</p>
        </div>
        <div className="p-6">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            rows={5}
            placeholder="Add notes..."
            autoFocus
          />
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-semibold disabled:opacity-50">
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Expanded Row ---

function ExpandedRow({ pm, onUpdateStage, onUpdateNotes }: {
  pm: PMCompany;
  onUpdateStage: (stage: Stage) => void;
  onUpdateNotes: (notes: string) => void;
}) {
  const [editingNotes, setEditingNotes] = useState(false);

  return (
    <tr>
      <td colSpan={9} className="p-0">
        <div className="bg-gradient-to-b from-slate-50 to-white px-8 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Website Card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Online Presence</h4>
              {pm.website ? (
                <a
                  href={pm.website.startsWith("http") ? pm.website : `https://${pm.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-colors font-medium text-sm w-full justify-center"
                >
                  <Globe size={16} />
                  Visit Website
                  <ExternalLink size={14} />
                </a>
              ) : (
                <p className="text-sm text-slate-400 italic">No website on file</p>
              )}
              {pm.pmSoftware && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">PM Software</span>
                  <p className="text-sm font-medium text-slate-700 mt-0.5">{pm.pmSoftware}</p>
                </div>
              )}
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact Info</h4>
              <div className="space-y-2.5">
                {pm.contactName && (
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-900">{pm.contactName}</span>
                  </div>
                )}
                {pm.contactEmail && (
                  <a href={`mailto:${pm.contactEmail}`} className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700">
                    <Mail size={14} className="flex-shrink-0" />
                    {pm.contactEmail}
                  </a>
                )}
                {pm.contactPhone && (
                  <a href={`tel:${pm.contactPhone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800">
                    <Phone size={14} className="flex-shrink-0" />
                    {pm.contactPhone}
                  </a>
                )}
                {!pm.contactName && !pm.contactEmail && !pm.contactPhone && (
                  <p className="text-sm text-slate-400 italic">No contact info on file</p>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Activity</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-slate-900">{pm.tenantsMatched}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Matched</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-green-600">{pm.placementsMade}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Placed</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-amber-600">{pm.currentVacancies}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Vacancies</p>
                </div>
              </div>
              {pm.neighborhoods && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">Neighborhoods</span>
                  <p className="text-sm text-slate-700 mt-0.5">{pm.neighborhoods}</p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {pm.notes && (
            <div className="mt-4 bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes</h4>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{pm.notes}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            {pm.contactEmail && pm.stage === "Lead Drop" && (
              <a
                href={`mailto:${pm.contactEmail}?subject=SweetLease Partnership - ${pm.city} Market`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Send size={12} /> Send Lead Drop
              </a>
            )}
            {pm.contactEmail && (
              <a
                href={`mailto:${pm.contactEmail}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
              >
                <Mail size={12} /> Send Email
              </a>
            )}
            <button
              onClick={() => setEditingNotes(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <FileText size={12} /> Update Notes
            </button>
            {pm.stage !== "Responded" && (
              <button
                onClick={() => onUpdateStage("Responded")}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <CheckCircle2 size={12} /> Mark Responded
              </button>
            )}
          </div>

          {editingNotes && (
            <EditNotesModal pm={pm} onClose={() => setEditingNotes(false)} onSave={onUpdateNotes} />
          )}
        </div>
      </td>
    </tr>
  );
}

// --- Row Component ---

function PMRow({ pm, isExpanded, showStageDropdown, index, onToggleExpand, onToggleStageDropdown, onCloseStageDropdown, onUpdateStage, onUpdateNotes }: {
  pm: PMCompany;
  isExpanded: boolean;
  showStageDropdown: boolean;
  index: number;
  onToggleExpand: () => void;
  onToggleStageDropdown: () => void;
  onCloseStageDropdown: () => void;
  onUpdateStage: (stage: Stage) => void;
  onUpdateNotes: (notes: string) => void;
}) {
  const rowBg = index % 2 === 0 ? "bg-white" : "bg-slate-50/50";

  return (
    <>
      <tr className={`${rowBg} hover:bg-amber-50/30 transition-colors group`}>
        {/* Expand */}
        <td className="px-4 py-3.5">
          <button onClick={onToggleExpand} className="text-slate-300 group-hover:text-amber-500 transition-colors">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </td>

        {/* Company */}
        <td className="px-4 py-3.5">
          <span className="text-sm font-semibold text-slate-900">{pm.company}</span>
        </td>

        {/* City */}
        <td className="px-4 py-3.5">
          <span className="inline-flex items-center gap-1 text-sm text-slate-600">
            <MapPin size={12} className="text-slate-400" />{pm.city}
          </span>
        </td>

        {/* Website */}
        <td className="px-4 py-3.5">
          {pm.website ? (
            <a
              href={pm.website.startsWith("http") ? pm.website : `https://${pm.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
              title={pm.website}
            >
              <Globe size={14} />
            </a>
          ) : (
            <span className="text-slate-300">-</span>
          )}
        </td>

        {/* Contact */}
        <td className="px-4 py-3.5">
          {pm.contactName || pm.contactEmail || pm.contactPhone ? (
            <div className="space-y-0.5">
              {pm.contactName && <p className="text-sm font-medium text-slate-900 leading-tight">{pm.contactName}</p>}
              {pm.contactEmail && <p className="text-xs text-slate-400 leading-tight">{pm.contactEmail}</p>}
              {pm.contactPhone && <p className="text-xs text-slate-400 leading-tight">{pm.contactPhone}</p>}
            </div>
          ) : (
            <span className="text-sm text-slate-300">-</span>
          )}
        </td>

        {/* Doors */}
        <td className="px-4 py-3.5">
          <span className="text-sm font-semibold text-slate-900">{pm.estDoors || "-"}</span>
        </td>

        {/* Stage */}
        <td className="px-4 py-3.5 relative">
          <StageBadge stage={pm.stage} onClick={onToggleStageDropdown} />
          {showStageDropdown && (
            <StageDropdown current={pm.stage} onSelect={onUpdateStage} onClose={onCloseStageDropdown} />
          )}
        </td>

        {/* Last Action */}
        <td className="px-4 py-3.5">
          <span className="text-sm text-slate-500" title={pm.lastAction || ""}>
            {relativeTime(pm.lastAction)}
          </span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-1">
            {pm.contactEmail && (
              <a
                href={`mailto:${pm.contactEmail}`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                title={`Email ${pm.contactName || pm.contactEmail}`}
              >
                <Mail size={14} />
              </a>
            )}
            {pm.notes && (
              <div className="relative group/notes">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 cursor-help">
                  <FileText size={14} />
                </div>
                <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover/notes:opacity-100 pointer-events-none transition-opacity z-30 shadow-lg">
                  {pm.notes}
                  <div className="absolute -bottom-1 right-4 w-2 h-2 bg-slate-900 rotate-45" />
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <ExpandedRow pm={pm} onUpdateStage={onUpdateStage} onUpdateNotes={onUpdateNotes} />
      )}
    </>
  );
}

// --- Empty State ---

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <tr>
      <td colSpan={9}>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Inbox size={28} className="text-slate-300" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 mb-1">
            {hasFilters ? "No PMs match your filters" : "No property managers yet"}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            {hasFilters ? "Try adjusting your search or filter criteria" : "Add your first PM to get started"}
          </p>
          {hasFilters && (
            <button
              onClick={onClear}
              className="px-4 py-2 text-sm bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 font-medium transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// --- Main Page ---

export default function PMPipelinePage() {
  const [allPms, setAllPms] = useState<PMCompany[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, totalDoors: 0, totalPlacements: 0, stageCounts: {} });
  const [loading, setLoading] = useState(true);
  const [filterCity, setFilterCity] = useState<string>("All");
  const [filterStage, setFilterStage] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stageDropdownId, setStageDropdownId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const data = await sweetleaseApi.get<{ pms: PMCompany[]; stats: Stats }>("/api/admin/pm-pipeline", {
        city: filterCity,
        stage: filterStage,
      });
      setAllPms(data.pms);
      setStats(data.stats);
    } catch (err) {
      console.error("Failed to fetch PM pipeline:", err);
    } finally {
      setLoading(false);
    }
  }, [filterCity, filterStage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side search filtering
  const filteredPms = useMemo(() => {
    if (!searchQuery.trim()) return allPms;
    const q = searchQuery.toLowerCase();
    return allPms.filter(
      (pm) =>
        pm.company.toLowerCase().includes(q) ||
        pm.city.toLowerCase().includes(q) ||
        (pm.contactName && pm.contactName.toLowerCase().includes(q)) ||
        (pm.contactEmail && pm.contactEmail.toLowerCase().includes(q)) ||
        (pm.neighborhoods && pm.neighborhoods.toLowerCase().includes(q))
    );
  }, [allPms, searchQuery]);

  const withContactInfo = useMemo(
    () => allPms.filter((pm) => pm.contactEmail || pm.contactPhone).length,
    [allPms]
  );

  const activeConversations = useMemo(
    () => allPms.filter((pm) => pm.stage === "Responded").length,
    [allPms]
  );

  const updateStage = async (id: string, stage: Stage) => {
    setAllPms((prev) => prev.map((pm) => pm.id === id ? { ...pm, stage, lastAction: new Date().toISOString() } : pm));
    try {
      await sweetleaseApi.patch("/api/admin/pm-pipeline", { id, stage });
      fetchData();
    } catch (err) {
      console.error("Failed to update stage:", err);
      fetchData();
    }
  };

  const updateNotes = async (id: string, notes: string) => {
    setAllPms((prev) => prev.map((pm) => pm.id === id ? { ...pm, notes } : pm));
    try {
      await sweetleaseApi.patch("/api/admin/pm-pipeline", { id, notes });
    } catch (err) {
      console.error("Failed to update notes:", err);
      fetchData();
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

  const clearFilters = () => {
    setFilterCity("All");
    setFilterStage("All");
    setSearchQuery("");
  };

  const hasFilters = filterCity !== "All" || filterStage !== "All" || searchQuery.trim() !== "";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 size={32} className="animate-spin text-amber-500" />
        <span className="text-sm text-slate-500">Loading pipeline...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PM Pipeline</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tracking property manager acquisition across {CITIES.length} markets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 text-sm font-semibold shadow-sm hover:shadow transition-all"
          >
            <Plus size={16} /> Add PM
          </button>
        </div>
      </div>

      {/* Pipeline Funnel */}
      <PipelineFunnel
        stageCounts={stats.stageCounts}
        total={stats.total}
        activeStage={filterStage}
        onStageClick={setFilterStage}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total PMs"
          value={stats.total}
          icon={<Building2 size={22} className="text-amber-600" />}
          accent="bg-amber-50"
        />
        <StatCard
          label="With Contact Info"
          value={withContactInfo}
          icon={<Phone size={22} className="text-blue-600" />}
          accent="bg-blue-50"
        />
        <StatCard
          label="Active Conversations"
          value={activeConversations}
          icon={<MessageSquare size={22} className="text-green-600" />}
          accent="bg-green-50"
        />
        <StatCard
          label="Placements Made"
          value={stats.totalPlacements}
          icon={<CheckCircle2 size={22} className="text-purple-600" />}
          accent="bg-purple-50"
        />
      </div>

      {/* City Chips */}
      <CityChips pms={allPms} activeCity={filterCity} onCityClick={setFilterCity} />

      {/* Search Bar */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by company, city, contact name, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent shadow-sm placeholder:text-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filteredPms.length}</span> of {allPms.length} property managers
        </p>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-10" />
                <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Company</th>
                <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">City</th>
                <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-12">Web</th>
                <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Contact</th>
                <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-16">Doors</th>
                <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Stage</th>
                <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Last Action</th>
                <th className="text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPms.length > 0 ? (
                filteredPms.map((pm, index) => (
                  <PMRow
                    key={pm.id}
                    pm={pm}
                    index={index}
                    isExpanded={expandedId === pm.id}
                    showStageDropdown={stageDropdownId === pm.id}
                    onToggleExpand={() => setExpandedId(expandedId === pm.id ? null : pm.id)}
                    onToggleStageDropdown={() => setStageDropdownId(stageDropdownId === pm.id ? null : pm.id)}
                    onCloseStageDropdown={() => setStageDropdownId(null)}
                    onUpdateStage={(stage) => updateStage(pm.id, stage)}
                    onUpdateNotes={(notes) => updateNotes(pm.id, notes)}
                  />
                ))
              ) : (
                <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddPMModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSave={addPM} />
    </div>
  );
}
