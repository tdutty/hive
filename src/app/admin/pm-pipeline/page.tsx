"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { sweetleaseApi } from "@/lib/api";
import { Button, buttonVariants, Card, CardBody, Badge, statusTone, StatTile, PageHeader, FilterChips, type Chip, Table, THead, TH, TBody, TR, TD, Field, Input, Select, Textarea } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Globe,
  Phone,
  Mail,
  Users,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
  Send,
  FileText,
  X,
} from "lucide-react";

// --- Types ---

type Stage = "Lead Drop" | "Responded" | "Placement" | "Repeat" | "Partnership";
type StageFilter = "All" | Stage;
type CityFilter = string;

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

/** Funnel depth, not status: each stage further down the pipeline is a darker slate. */
const FUNNEL_FILL: Record<Stage, string> = {
  "Lead Drop": "bg-slate-300",
  Responded: "bg-slate-400",
  Placement: "bg-slate-500",
  Repeat: "bg-slate-700",
  Partnership: "bg-slate-900",
};

const EMPTY_FORM = { company: "", city: CITIES[0], website: "", contactName: "", contactEmail: "", contactPhone: "", neighborhoods: "", estDoors: "", notes: "", pmSoftware: "" };

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

const externalUrl = (site: string) => (site.startsWith("http") ? site : `https://${site}`);

// --- Stage picker ---

function StageDropdown({ current, onSelect, onClose }: { current: Stage; onSelect: (s: Stage) => void; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
      <div role="menu" className="absolute z-50 mt-1 left-3 bg-white border border-slate-200 rounded-lg shadow-md py-1 min-w-[180px]">
        <div className="px-3 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">Update stage</div>
        {STAGES.map((s) => (
          <button
            key={s}
            role="menuitem"
            onClick={() => { onSelect(s); onClose(); }}
            className={cn("w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 flex items-center gap-2", s === current && "bg-slate-50")}
          >
            <Badge tone={statusTone(s)} dot>{s}</Badge>
            {s === current && <span className="text-slate-400 text-xs ml-auto">Current</span>}
          </button>
        ))}
      </div>
    </>
  );
}

// --- Pipeline Funnel ---

function PipelineFunnel({ stageCounts, total, activeStage, onStageClick }: {
  stageCounts: Record<string, number>;
  total: number;
  activeStage: StageFilter;
  onStageClick: (stage: StageFilter) => void;
}) {
  const chips: Chip<StageFilter>[] = [
    { key: "All", label: "All stages", count: total },
    ...STAGES.map((s) => ({ key: s as StageFilter, label: s, count: stageCounts[s] || 0 })),
  ];

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pipeline funnel</p>
          <p className="text-xs text-slate-500 tabular">{total} PMs</p>
        </div>
        <div className="flex rounded-sm overflow-hidden h-8 bg-slate-100" role="img" aria-label="Pipeline stage distribution">
          {STAGES.map((s) => {
            const count = stageCounts[s] || 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            if (pct === 0) return null;
            const isActive = activeStage === "All" || activeStage === s;
            return (
              <button
                key={s}
                onClick={() => onStageClick(activeStage === s ? "All" : s)}
                className={cn("relative flex items-center justify-center transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500", FUNNEL_FILL[s], isActive ? "opacity-100" : "opacity-40")}
                style={{ width: `${Math.max(pct, 8)}%` }}
                title={`${s}: ${count}`}
              >
                <span className="text-white text-xs font-medium tabular">{count}</span>
              </button>
            );
          })}
        </div>
        <FilterChips items={chips} value={activeStage} onChange={onStageClick} />
      </CardBody>
    </Card>
  );
}

// --- City Chips ---

function CityChips({ pms, activeCity, onCityClick }: {
  pms: PMCompany[];
  activeCity: CityFilter;
  onCityClick: (city: CityFilter) => void;
}) {
  const cityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    pms.forEach((pm) => {
      counts[pm.city] = (counts[pm.city] || 0) + 1;
    });
    return counts;
  }, [pms]);

  const chips: Chip<CityFilter>[] = [
    { key: "All", label: "All cities", count: pms.length },
    ...CITIES.map((city) => ({ key: city, label: city, count: cityCounts[city] || 0 })),
  ];

  return <FilterChips items={chips} value={activeCity} onChange={onCityClick} />;
}

// --- Add PM Modal ---

function AddPMModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (data: Record<string, unknown>) => void }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    setForm(EMPTY_FORM);
    setErrors({});
    setSaving(false);
    onClose();
  };

  const errClass = (field: string) => (errors[field] ? "border-red-300 focus:border-red-400 focus:ring-red-500/20" : undefined);
  const ErrorText = ({ field }: { field: string }) => (errors[field] ? <p className="text-xs text-red-700 mt-1">{errors[field]}</p> : null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add property manager" size="lg">
      <p className="text-sm text-slate-500 mb-4">Fill in the details to add a new PM to the pipeline.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Field label="Company name *">
              <Input
                value={form.company}
                onChange={(e) => { setForm({ ...form, company: e.target.value }); setErrors({ ...errors, company: "" }); }}
                className={errClass("company")}
                placeholder="Acme Properties"
                aria-invalid={!!errors.company}
              />
            </Field>
            <ErrorText field="company" />
          </div>
          <Field label="City">
            <Select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
        </div>

        <Field label="Website">
          <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="www.example.com" />
        </Field>

        <fieldset className="border border-slate-200 rounded-lg p-4 space-y-3">
          <legend className="px-1 text-xs font-medium text-slate-500 uppercase tracking-wide">Contact</legend>
          <Field label="Name">
            <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="John Smith" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Field label="Email">
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => { setForm({ ...form, contactEmail: e.target.value }); setErrors({ ...errors, contactEmail: "" }); }}
                  className={errClass("contactEmail")}
                  placeholder="john@company.com"
                  aria-invalid={!!errors.contactEmail}
                />
              </Field>
              <ErrorText field="contactEmail" />
            </div>
            <Field label="Phone">
              <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="555-123-4567" />
            </Field>
          </div>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Neighborhoods">
            <Input value={form.neighborhoods} onChange={(e) => setForm({ ...form, neighborhoods: e.target.value })} placeholder="Midtown, Heights" />
          </Field>
          <Field label="Est. doors">
            <Input type="number" min="0" value={form.estDoors} onChange={(e) => setForm({ ...form, estDoors: e.target.value })} placeholder="0" className="tabular" />
          </Field>
        </div>

        <Field label="PM software">
          <Input value={form.pmSoftware} onChange={(e) => setForm({ ...form, pmSoftware: e.target.value })} placeholder="AppFolio, Buildium, etc." />
        </Field>

        <Field label="Notes">
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Any relevant notes" className="resize-none" />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" icon={<Plus size={14} />} loading={saving}>{saving ? "Adding" : "Add PM"}</Button>
        </div>
      </form>
    </Modal>
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
    <Modal isOpen onClose={onClose} title="Update notes">
      <p className="text-sm text-slate-500 mb-4">{pm.company}</p>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={5}
        placeholder="Add notes"
        aria-label="Notes"
        className="resize-none"
      />
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>{saving ? "Saving" : "Save"}</Button>
      </div>
    </Modal>
  );
}

// --- Expanded Row ---

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">{title}</p>
        {children}
      </CardBody>
    </Card>
  );
}

function ExpandedRow({ pm, onUpdateStage, onUpdateNotes }: {
  pm: PMCompany;
  onUpdateStage: (stage: Stage) => void;
  onUpdateNotes: (notes: string) => void;
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const linkBtn = buttonVariants({ variant: "secondary", size: "sm" });

  return (
    <tr>
      <td colSpan={9} className="p-0">
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DetailCard title="Online presence">
              {pm.website ? (
                <a href={externalUrl(pm.website)} target="_blank" rel="noopener noreferrer" className={cn(linkBtn, "w-full")}>
                  <Globe size={14} aria-hidden /> Visit website <ExternalLink size={12} aria-hidden />
                </a>
              ) : (
                <p className="text-sm text-slate-500">No website on file</p>
              )}
              {pm.pmSoftware && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <span className="text-xs text-slate-500">PM software</span>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{pm.pmSoftware}</p>
                </div>
              )}
            </DetailCard>

            <DetailCard title="Contact">
              <div className="space-y-2">
                {pm.contactName && (
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Users size={14} className="text-slate-400 shrink-0" aria-hidden />{pm.contactName}
                  </div>
                )}
                {pm.contactEmail && (
                  <a href={`mailto:${pm.contactEmail}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 hover:underline break-all">
                    <Mail size={14} className="text-slate-400 shrink-0" aria-hidden />{pm.contactEmail}
                  </a>
                )}
                {pm.contactPhone && (
                  <a href={`tel:${pm.contactPhone}`} className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 hover:underline tabular">
                    <Phone size={14} className="text-slate-400 shrink-0" aria-hidden />{pm.contactPhone}
                  </a>
                )}
                {!pm.contactName && !pm.contactEmail && !pm.contactPhone && (
                  <p className="text-sm text-slate-500">No contact info on file</p>
                )}
              </div>
            </DetailCard>

            <DetailCard title="Activity">
              <div className="grid grid-cols-3 gap-3">
                {[["Matched", pm.tenantsMatched], ["Placed", pm.placementsMade], ["Vacancies", pm.currentVacancies]].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xl font-semibold text-slate-900 tabular">{value}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {pm.neighborhoods && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <span className="text-xs text-slate-500">Neighborhoods</span>
                  <p className="text-sm text-slate-800 mt-0.5">{pm.neighborhoods}</p>
                </div>
              )}
            </DetailCard>
          </div>

          {pm.notes && (
            <DetailCard title="Notes">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{pm.notes}</p>
            </DetailCard>
          )}

          <div className="flex flex-wrap gap-2">
            {pm.contactEmail && pm.stage === "Lead Drop" && (
              <a href={`mailto:${pm.contactEmail}?subject=SweetLease Partnership - ${pm.city} Market`} className={linkBtn}>
                <Send size={12} aria-hidden /> Send lead drop
              </a>
            )}
            {pm.contactEmail && (
              <a href={`mailto:${pm.contactEmail}`} className={linkBtn}>
                <Mail size={12} aria-hidden /> Send email
              </a>
            )}
            <Button size="sm" icon={<FileText size={12} />} onClick={() => setEditingNotes(true)}>Update notes</Button>
            {pm.stage !== "Responded" && (
              <Button size="sm" icon={<CheckCircle2 size={12} />} onClick={() => onUpdateStage("Responded")}>Mark responded</Button>
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

function PMRow({ pm, isExpanded, showStageDropdown, onToggleExpand, onToggleStageDropdown, onCloseStageDropdown, onUpdateStage, onUpdateNotes }: {
  pm: PMCompany;
  isExpanded: boolean;
  showStageDropdown: boolean;
  onToggleExpand: () => void;
  onToggleStageDropdown: () => void;
  onCloseStageDropdown: () => void;
  onUpdateStage: (stage: Stage) => void;
  onUpdateNotes: (notes: string) => void;
}) {
  const hasContact = pm.contactName || pm.contactEmail || pm.contactPhone;

  return (
    <>
      <TR selected={isExpanded} className="hover:bg-slate-50">
        <TD className="w-10 pr-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={isExpanded ? "Collapse" : "Expand"} aria-expanded={isExpanded} onClick={onToggleExpand}>
            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </Button>
        </TD>
        <TD className="font-medium text-slate-900">{pm.company}</TD>
        <TD muted>{pm.city}</TD>
        <TD>
          {pm.website ? (
            <a href={externalUrl(pm.website)} target="_blank" rel="noopener noreferrer" title={pm.website} aria-label={`Open ${pm.website}`} className="inline-flex items-center justify-center h-7 w-7 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900">
              <Globe size={14} aria-hidden />
            </a>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </TD>
        <TD>
          {hasContact ? (
            <div className="leading-tight">
              {pm.contactName && <p className="font-medium text-slate-900">{pm.contactName}</p>}
              {pm.contactEmail && <p className="text-xs text-slate-500">{pm.contactEmail}</p>}
              {pm.contactPhone && <p className="text-xs text-slate-500 tabular">{pm.contactPhone}</p>}
            </div>
          ) : (
            <span className="text-slate-400">-</span>
          )}
        </TD>
        <TD numeric className="font-medium">{pm.estDoors || <span className="text-slate-400 font-normal">-</span>}</TD>
        <TD className="relative">
          <button
            onClick={onToggleStageDropdown}
            aria-haspopup="menu"
            aria-expanded={showStageDropdown}
            className="inline-flex items-center gap-1 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            title="Update stage"
          >
            <Badge tone={statusTone(pm.stage)} dot>{pm.stage}</Badge>
            <ChevronDown size={12} className="text-slate-400" aria-hidden />
          </button>
          {showStageDropdown && (
            <StageDropdown current={pm.stage} onSelect={onUpdateStage} onClose={onCloseStageDropdown} />
          )}
        </TD>
        <TD muted className="whitespace-nowrap tabular" title={pm.lastAction || ""}>{relativeTime(pm.lastAction)}</TD>
        <TD>
          <div className="flex items-center gap-0.5">
            {pm.contactEmail && (
              <a href={`mailto:${pm.contactEmail}`} title={`Email ${pm.contactName || pm.contactEmail}`} aria-label={`Email ${pm.contactName || pm.contactEmail}`} className="inline-flex items-center justify-center h-7 w-7 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                <Mail size={14} aria-hidden />
              </a>
            )}
            {pm.notes && (
              <div className="relative group/notes">
                <div className="inline-flex items-center justify-center h-7 w-7 rounded text-slate-500 hover:bg-slate-100 cursor-help" aria-label="Has notes">
                  <FileText size={14} aria-hidden />
                </div>
                <div role="tooltip" className="absolute right-0 bottom-full mb-1.5 w-64 bg-slate-900 text-white text-xs rounded px-3 py-2 opacity-0 group-hover/notes:opacity-100 pointer-events-none transition-opacity z-30 whitespace-pre-wrap">
                  {pm.notes}
                </div>
              </div>
            )}
          </div>
        </TD>
      </TR>
      {isExpanded && (
        <ExpandedRow pm={pm} onUpdateStage={onUpdateStage} onUpdateNotes={onUpdateNotes} />
      )}
    </>
  );
}

// --- Main Page ---

export default function PMPipelinePage() {
  const [allPms, setAllPms] = useState<PMCompany[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, totalDoors: 0, totalPlacements: 0, stageCounts: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState<CityFilter>("All");
  const [filterStage, setFilterStage] = useState<StageFilter>("All");
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
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load PM pipeline");
    } finally {
      setLoading(false);
    }
  }, [filterCity, filterStage]);

  const reload = () => { setLoading(true); fetchData(); };

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
    } catch (err: any) {
      toast.error("Failed to update stage", { description: err?.message });
      fetchData();
    }
  };

  const updateNotes = async (id: string, notes: string) => {
    setAllPms((prev) => prev.map((pm) => pm.id === id ? { ...pm, notes } : pm));
    try {
      await sweetleaseApi.patch("/api/admin/pm-pipeline", { id, notes });
    } catch (err: any) {
      toast.error("Failed to update notes", { description: err?.message });
      fetchData();
    }
  };

  const addPM = async (data: Record<string, unknown>) => {
    try {
      await sweetleaseApi.post("/api/admin/pm-pipeline", data);
      toast.success("Property manager added");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to add PM", { description: err?.message });
    }
  };

  const clearFilters = () => {
    setFilterCity("All");
    setFilterStage("All");
    setSearchQuery("");
  };

  const hasFilters = filterCity !== "All" || filterStage !== "All" || searchQuery.trim() !== "";
  const closeAddModal = useCallback(() => setShowAddModal(false), []);

  if (loading) {
    return <div className="max-w-7xl"><PageHeader title="PM Pipeline" /><Spinner label="Loading pipeline" /></div>;
  }

  if (error && allPms.length === 0) {
    return <div className="max-w-7xl"><PageHeader title="PM Pipeline" /><ErrorBanner message={error} onRetry={reload} /></div>;
  }

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="PM Pipeline"
        meta="Outreach · property managers"
        description={`Tracking property manager acquisition across ${CITIES.length} markets.`}
        actions={<>
          <Button variant="ghost" size="icon" aria-label="Refresh" onClick={reload}><RefreshCw size={15} /></Button>
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowAddModal(true)}>Add PM</Button>
        </>}
      />

      {error && <ErrorBanner className="mb-4" message={error} onRetry={reload} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile label="Total PMs" value={stats.total} hint={`${stats.totalDoors.toLocaleString()} est. doors`} />
        <StatTile label="With contact info" value={withContactInfo} hint="email or phone on file" />
        <StatTile label="Active conversations" value={activeConversations} hint="in Responded" />
        <StatTile label="Placements made" value={stats.totalPlacements} />
      </div>

      <div className="mb-5">
        <PipelineFunnel
          stageCounts={stats.stageCounts}
          total={stats.total}
          activeStage={filterStage}
          onStageClick={setFilterStage}
        />
      </div>

      <div className="mb-4">
        <CityChips pms={allPms} activeCity={filterCity} onCityClick={setFilterCity} />
      </div>

      <Card>
        <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden />
            <Input
              type="search"
              aria-label="Search property managers"
              placeholder="Search by company, city, contact name, or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                <X size={14} aria-hidden />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <p className="text-xs text-slate-500 tabular">
              Showing <span className="font-medium text-slate-700">{filteredPms.length}</span> of {allPms.length}
            </p>
            {hasFilters && (
              <Button size="sm" variant="ghost" icon={<X size={12} />} onClick={clearFilters}>Clear filters</Button>
            )}
          </div>
        </div>

        <Table>
          <THead>
            <tr>
              <TH className="w-10" aria-label="Expand" />
              <TH>Company</TH>
              <TH>City</TH>
              <TH className="w-12">Web</TH>
              <TH>Contact</TH>
              <TH numeric className="w-20">Doors</TH>
              <TH>Stage</TH>
              <TH>Last action</TH>
              <TH className="w-20">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {filteredPms.length > 0 ? (
              filteredPms.map((pm) => (
                <PMRow
                  key={pm.id}
                  pm={pm}
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
              <tr>
                <td colSpan={9}>
                  <EmptyState
                    title={hasFilters ? "No PMs match your filters" : "No property managers yet"}
                    hint={hasFilters ? "Try adjusting your search or filter criteria." : "Add your first PM to get started."}
                  />
                  {hasFilters && (
                    <div className="flex justify-center pb-8 -mt-4">
                      <Button size="sm" onClick={clearFilters}>Clear all filters</Button>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </TBody>
        </Table>
      </Card>

      <AddPMModal isOpen={showAddModal} onClose={closeAddModal} onSave={addPM} />
    </div>
  );
}
