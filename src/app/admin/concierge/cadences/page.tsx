"use client";

import { useState, useEffect, useCallback } from "react";
import { sweetleaseApi } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import { Button, Card, CardHeader, CardBody, Badge, statusTone, StatTile, PageHeader, Field, Input, Select, Textarea } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import {
  GitBranch,
  Plus,
  ChevronDown,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Mail,
  MessageSquare,
  Users,
  Zap,
  Search,
  Clock,
  Target,
  TrendingUp,
  CheckSquare,
  Square,
} from "lucide-react";

// --- Types ---

interface CadenceStep {
  id?: string;
  stepNumber: number;
  delay: number;
  channel: "EMAIL" | "SMS";
  subject: string;
  body: string;
}

interface Cadence {
  id: string;
  name: string;
  active: boolean;
  audienceFilter: Record<string, unknown> | null;
  steps: CadenceStep[];
  _count?: { enrollments: number };
  createdAt: string;
  updatedAt: string;
}

interface Initiative {
  id: string;
  name: string;
  scope: Record<string, unknown> | null;
  windowStart: string;
  windowEnd: string;
  multiplier: number;
  targetMetric: string;
  active: boolean;
  createdAt: string;
}

interface CadencesResponse {
  cadences: Cadence[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    totalEnrollments: number;
    stepsExecutedToday: number;
  };
}

interface InitiativesResponse {
  initiatives: Initiative[];
}

interface ConciergeContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: string;
}

interface ContactsResponse {
  contacts: ConciergeContact[];
}

interface CadenceFormValues {
  name: string;
  audience: string;
  steps: CadenceStep[];
}

interface InitiativeFormValues {
  name: string;
  scope: string;
  windowStart: string;
  windowEnd: string;
  multiplier: number;
  targetMetric: string;
  active: boolean;
}

const EMPTY_STEP: CadenceStep = { stepNumber: 1, delay: 0, channel: "EMAIL", subject: "", body: "" };

// --- Helpers ---

/** Free text or JSON: parse JSON when it is valid, otherwise keep the text as a description. */
function parseFilter(text: string): Record<string, unknown> | null {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { description: text };
  }
}

function ChannelBadge({ channel }: { channel: CadenceStep["channel"] }) {
  return (
    <Badge tone="outline">
      {channel === "EMAIL" ? <Mail size={12} aria-hidden /> : <MessageSquare size={12} aria-hidden />}
      {channel}
    </Badge>
  );
}

function ActiveToggle({ active, onToggle, size = 22 }: { active: boolean; onToggle: () => void; size?: number }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      title={active ? "Deactivate" : "Activate"}
      aria-label={active ? "Deactivate" : "Activate"}
      aria-pressed={active}
    >
      {active ? <ToggleRight size={size} className="text-amber-600" aria-hidden /> : <ToggleLeft size={size} aria-hidden />}
    </Button>
  );
}

// --- Modals (local components; each owns its form state, the page owns the data calls) ---

function CadenceFormModal({ editing, saving, onClose, onSubmit }: {
  editing: Cadence | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: CadenceFormValues) => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [audience, setAudience] = useState(
    editing?.audienceFilter ? JSON.stringify(editing.audienceFilter, null, 2) : ""
  );
  const [steps, setSteps] = useState<CadenceStep[]>(
    editing && editing.steps.length > 0
      ? editing.steps.map((s, i) => ({ ...s, stepNumber: i + 1 }))
      : [{ ...EMPTY_STEP }]
  );

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { stepNumber: prev.length + 1, delay: 1, channel: "EMAIL", subject: "", body: "" },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 }))
    );
  };

  const updateStep = (index: number, field: keyof CadenceStep, value: string | number) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  return (
    <Modal isOpen onClose={onClose} title={editing ? "Edit Cadence" : "New Cadence"} size="lg">
      <div className="space-y-4">
        <Field label="Name">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Welcome Sequence"
          />
        </Field>

        <Field label="Audience Filter (JSON or description)">
          <Textarea
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder='{"type": "RESIDENT", "market": "Houston"}'
            rows={3}
            className="font-mono"
          />
        </Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">Steps</span>
            <Button variant="secondary" size="sm" onClick={addStep} icon={<Plus size={12} aria-hidden />}>
              Add Step
            </Button>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600">Step {step.stepNumber}</span>
                  {steps.length > 1 && (
                    <Button variant="dangerOutline" size="sm" onClick={() => removeStep(idx)}>
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  <Field label="Delay (days)">
                    <Input
                      type="number"
                      min={0}
                      value={step.delay}
                      onChange={(e) => updateStep(idx, "delay", parseInt(e.target.value) || 0)}
                    />
                  </Field>
                  <Field label="Channel">
                    <Select value={step.channel} onChange={(e) => updateStep(idx, "channel", e.target.value)}>
                      <option value="EMAIL">Email</option>
                      <option value="SMS">SMS</option>
                    </Select>
                  </Field>
                </div>

                <Field label="Subject" className="mb-2">
                  <Input
                    type="text"
                    value={step.subject}
                    onChange={(e) => updateStep(idx, "subject", e.target.value)}
                    placeholder="Email subject line"
                  />
                </Field>

                <Field label="Body">
                  <Textarea
                    value={step.body}
                    onChange={(e) => updateStep(idx, "body", e.target.value)}
                    placeholder="Message body..."
                    rows={3}
                  />
                </Field>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => onSubmit({ name, audience, steps })}
            disabled={saving || !name.trim()}
            loading={saving}
          >
            {editing ? "Save Changes" : "Create Cadence"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function InitiativeFormModal({ saving, onClose, onSubmit }: {
  saving: boolean;
  onClose: () => void;
  onSubmit: (values: InitiativeFormValues) => void;
}) {
  const [name, setName] = useState("");
  const [scope, setScope] = useState("");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [multiplier, setMultiplier] = useState(1);
  const [targetMetric, setTargetMetric] = useState("");
  const [active, setActive] = useState(true);

  return (
    <Modal isOpen onClose={onClose} title="Add Initiative" size="lg">
      <div className="space-y-4">
        <Field label="Name">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q2 Push"
          />
        </Field>

        <Field label="Scope (JSON or description)">
          <Textarea
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder='{"markets": ["Houston", "Dallas"]}'
            rows={3}
            className="font-mono"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Window Start">
            <Input type="date" value={windowStart} onChange={(e) => setWindowStart(e.target.value)} />
          </Field>
          <Field label="Window End">
            <Input type="date" value={windowEnd} onChange={(e) => setWindowEnd(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Multiplier">
            <Input
              type="number"
              step={0.1}
              min={0.1}
              value={multiplier}
              onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1)}
            />
          </Field>
          <Field label="Target Metric">
            <Input
              type="text"
              value={targetMetric}
              onChange={(e) => setTargetMetric(e.target.value)}
              placeholder="e.g. signups"
            />
          </Field>
        </div>

        <div className="flex items-center gap-2">
          <ActiveToggle active={active} onToggle={() => setActive(!active)} size={24} />
          <span className="text-sm text-slate-700">{active ? "Active" : "Inactive"}</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => onSubmit({ name, scope, windowStart, windowEnd, multiplier, targetMetric, active })}
            disabled={saving || !name.trim()}
            loading={saving}
          >
            Create Initiative
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function EnrollContactsModal({ enrolling, onClose, onEnroll }: {
  enrolling: boolean;
  onClose: () => void;
  onEnroll: (contactIds: string[]) => void;
}) {
  const [contacts, setContacts] = useState<ConciergeContact[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const data = await sweetleaseApi.get<ContactsResponse>(
        "/api/admin/concierge/contacts",
        params
      );
      setContacts(data.contacts);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const toggleContact = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Modal isOpen onClose={onClose} title="Enroll Contacts">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
        <Input
          type="text"
          placeholder="Search contacts..."
          aria-label="Search contacts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      {selected.size > 0 && (
        <p className="text-xs text-amber-700 mt-2 font-medium">
          {selected.size} contact{selected.size !== 1 ? "s" : ""} selected
        </p>
      )}

      <div className="mt-4 border border-slate-200 rounded-lg max-h-[400px] overflow-y-auto divide-y divide-slate-100">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="p-4">
            <ErrorBanner message={error} onRetry={fetchContacts} />
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState title="No contacts found" icon={<Users size={28} className="mx-auto" aria-hidden />} />
        ) : (
          contacts.map((contact) => {
            const isSelected = selected.has(contact.id);
            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => toggleContact(contact.id)}
                aria-pressed={isSelected}
                className={cn(
                  "w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors",
                  isSelected && "bg-amber-50"
                )}
              >
                {isSelected ? (
                  <CheckSquare size={18} className="text-amber-600 flex-shrink-0" aria-hidden />
                ) : (
                  <Square size={18} className="text-slate-300 flex-shrink-0" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{contact.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {contact.email || contact.phone || "No contact info"}
                  </p>
                </div>
                <span className="ml-auto text-xs font-medium text-slate-500 uppercase flex-shrink-0">
                  {contact.type}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          variant="primary"
          onClick={() => onEnroll(Array.from(selected))}
          disabled={enrolling || selected.size === 0}
          loading={enrolling}
        >
          Enroll Selected ({selected.size})
        </Button>
      </div>
    </Modal>
  );
}

// --- Page Component ---

export default function CadencesPage() {
  // Data state
  const [cadences, setCadences] = useState<Cadence[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalEnrollments: 0,
    stepsExecutedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initiativesLoading, setInitiativesLoading] = useState(true);
  const [initiativesError, setInitiativesError] = useState<string | null>(null);

  // UI state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewCadenceModal, setShowNewCadenceModal] = useState(false);
  const [showNewInitiativeModal, setShowNewInitiativeModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState<string | null>(null);
  const [editingCadence, setEditingCadence] = useState<Cadence | null>(null);
  const [saving, setSaving] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // --- Fetch ---

  const fetchCadences = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sweetleaseApi.get<CadencesResponse>(
        "/api/admin/concierge/cadences"
      );
      setCadences(data.cadences);
      setStats(data.stats);
      setError(null);
    } catch (err: any) {
      setError(err?.message || "Failed to load cadences");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInitiatives = useCallback(async () => {
    setInitiativesLoading(true);
    try {
      const data = await sweetleaseApi.get<InitiativesResponse>(
        "/api/admin/concierge/initiatives"
      );
      setInitiatives(data.initiatives);
      setInitiativesError(null);
    } catch (err: any) {
      setInitiativesError(err?.message || "Failed to load initiatives");
    } finally {
      setInitiativesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCadences();
    fetchInitiatives();
  }, [fetchCadences, fetchInitiatives]);

  // --- Handlers ---

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleCadenceActive = async (cadence: Cadence) => {
    try {
      await sweetleaseApi.patch("/api/admin/concierge/cadences", {
        id: cadence.id,
        active: !cadence.active,
      });
      await fetchCadences();
    } catch (err: any) {
      toast.error("Failed to toggle cadence", { description: err?.message });
    }
  };

  const toggleInitiativeActive = async (initiative: Initiative) => {
    try {
      await sweetleaseApi.patch("/api/admin/concierge/initiatives", {
        id: initiative.id,
        active: !initiative.active,
      });
      await fetchInitiatives();
    } catch (err: any) {
      toast.error("Failed to toggle initiative", { description: err?.message });
    }
  };

  const closeCadenceModal = () => {
    setShowNewCadenceModal(false);
    setEditingCadence(null);
  };

  const handleSaveCadence = async ({ name, audience, steps }: CadenceFormValues) => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const audienceFilter = parseFilter(audience);
      if (editingCadence) {
        await sweetleaseApi.patch("/api/admin/concierge/cadences", {
          id: editingCadence.id,
          name,
          audienceFilter,
          steps,
        });
      } else {
        await sweetleaseApi.post("/api/admin/concierge/cadences", {
          name,
          audienceFilter,
          steps,
        });
      }
      closeCadenceModal();
      await fetchCadences();
    } catch (err: any) {
      toast.error(editingCadence ? "Failed to update cadence" : "Failed to create cadence", { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInitiative = async (values: InitiativeFormValues) => {
    if (!values.name.trim()) return;
    setSaving(true);
    try {
      await sweetleaseApi.post("/api/admin/concierge/initiatives", {
        name: values.name,
        scope: parseFilter(values.scope),
        windowStart: values.windowStart || null,
        windowEnd: values.windowEnd || null,
        multiplier: values.multiplier,
        targetMetric: values.targetMetric,
        active: values.active,
      });
      setShowNewInitiativeModal(false);
      await fetchInitiatives();
    } catch (err: any) {
      toast.error("Failed to create initiative", { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEnroll = async (contactIds: string[]) => {
    if (!showEnrollModal || contactIds.length === 0) return;
    setEnrolling(true);
    try {
      await sweetleaseApi.post("/api/admin/concierge/cadences/enroll", {
        cadenceId: showEnrollModal,
        contactIds,
      });
      setShowEnrollModal(null);
      await fetchCadences();
    } catch (err: any) {
      toast.error("Failed to enroll contacts", { description: err?.message });
    } finally {
      setEnrolling(false);
    }
  };

  const openEditCadence = (cadence: Cadence) => {
    setEditingCadence(cadence);
    setShowNewCadenceModal(true);
  };

  const openNewCadence = () => {
    setEditingCadence(null);
    setShowNewCadenceModal(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cadences"
        description="Automated outreach sequences for concierge contacts"
        actions={
          <Button variant="primary" onClick={openNewCadence} icon={<Plus size={16} aria-hidden />}>
            New Cadence
          </Button>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatTile
          label="Total Cadences"
          value={stats.total.toLocaleString()}
          hint={`${stats.active} active, ${stats.inactive} inactive`}
          icon={<GitBranch size={16} aria-hidden />}
        />
        <StatTile
          label="Active Enrollments"
          value={stats.totalEnrollments.toLocaleString()}
          icon={<Users size={16} aria-hidden />}
        />
        <StatTile
          label="Steps Executed Today"
          value={stats.stepsExecutedToday.toLocaleString()}
          icon={<Zap size={16} aria-hidden />}
        />
      </div>

      {/* Active Initiatives */}
      <Card>
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Target size={18} className="text-amber-600" aria-hidden />
              Active Initiatives
            </span>
          }
          actions={
            <Button variant="secondary" size="sm" onClick={() => setShowNewInitiativeModal(true)} icon={<Plus size={14} aria-hidden />}>
              Add Initiative
            </Button>
          }
        />
        <CardBody>
          {initiativesLoading ? (
            <Spinner />
          ) : initiativesError ? (
            <ErrorBanner message={initiativesError} onRetry={fetchInitiatives} />
          ) : initiatives.length === 0 ? (
            <EmptyState
              title="No initiatives yet"
              hint="Create one to boost cadence performance."
              icon={<Target size={28} className="mx-auto" aria-hidden />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {initiatives.map((init) => (
                <div
                  key={init.id}
                  className={cn("border border-slate-200 rounded-lg p-4", !init.active && "bg-slate-50 opacity-60")}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0 flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{init.name}</h3>
                      <Badge tone={statusTone(init.active ? "Active" : "Inactive")} dot>
                        {init.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <ActiveToggle active={init.active} onToggle={() => toggleInitiativeActive(init)} size={20} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-slate-400" aria-hidden />
                      <span className="text-sm font-semibold text-slate-900 tabular">{init.multiplier}x</span>
                      <span className="text-xs text-slate-500">multiplier</span>
                    </div>
                    {(init.windowStart || init.windowEnd) && (
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" aria-hidden />
                        <span className="text-xs text-slate-500">
                          {init.windowStart ? formatDate(init.windowStart) : "..."} -{" "}
                          {init.windowEnd ? formatDate(init.windowEnd) : "..."}
                        </span>
                      </div>
                    )}
                    {init.targetMetric && (
                      <div className="flex items-center gap-2">
                        <Target size={14} className="text-slate-400" aria-hidden />
                        <span className="text-xs text-slate-500">{init.targetMetric}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Cadences List */}
      <div className="space-y-4">
        <h2 className="text-md font-semibold text-slate-900">All Cadences</h2>

        {loading ? (
          <Card>
            <Spinner label="Loading cadences" />
          </Card>
        ) : error ? (
          <ErrorBanner message={error} onRetry={fetchCadences} />
        ) : cadences.length === 0 ? (
          <Card>
            <EmptyState
              title="No cadences yet"
              hint="Create your first one."
              icon={<GitBranch size={28} className="mx-auto" aria-hidden />}
            />
          </Card>
        ) : (
          cadences.map((cadence) => {
            const isExpanded = expandedId === cadence.id;
            const enrollCount = cadence._count?.enrollments || 0;

            return (
              <Card key={cadence.id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-2 min-w-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleExpand(cadence.id)}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? "Collapse steps" : "Expand steps"}
                      >
                        {isExpanded ? <ChevronDown size={18} aria-hidden /> : <ChevronRight size={18} aria-hidden />}
                      </Button>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900 truncate">{cadence.name}</h3>
                          <Badge tone={statusTone(cadence.active ? "Active" : "Inactive")} dot>
                            {cadence.active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-slate-500 tabular">
                            {cadence.steps.length} step{cadence.steps.length !== 1 ? "s" : ""}
                          </span>
                          <span className="text-xs text-slate-500 tabular">
                            {enrollCount} contact{enrollCount !== 1 ? "s" : ""} enrolled
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="secondary" size="sm" onClick={() => setShowEnrollModal(cadence.id)} icon={<Users size={14} aria-hidden />}>
                        Enroll Contacts
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditCadence(cadence)}>
                        Edit
                      </Button>
                      <ActiveToggle active={cadence.active} onToggle={() => toggleCadenceActive(cadence)} />
                    </div>
                  </div>

                  {/* Steps Preview (collapsed) */}
                  {!isExpanded && cadence.steps.length > 0 && (
                    <div className="mt-3 sm:ml-11 space-y-1">
                      {cadence.steps.slice(0, 3).map((step) => (
                        <div key={step.stepNumber} className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600 tabular">
                            {step.stepNumber}
                          </span>
                          <span className="text-slate-500 tabular">
                            {step.delay > 0 ? `+${step.delay}d` : "Immediate"}
                          </span>
                          {step.channel === "EMAIL" ? (
                            <Mail size={12} className="text-slate-400" aria-hidden />
                          ) : (
                            <MessageSquare size={12} className="text-slate-400" aria-hidden />
                          )}
                          <span className="truncate max-w-xs">{step.subject || "(no subject)"}</span>
                        </div>
                      ))}
                      {cadence.steps.length > 3 && (
                        <span className="text-xs text-slate-500 ml-7">
                          +{cadence.steps.length - 3} more step{cadence.steps.length - 3 !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Steps Detail */}
                {isExpanded && (
                  <div className="border-t border-slate-200 p-4 bg-slate-50">
                    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Steps</h4>
                    {cadence.steps.length === 0 ? (
                      <p className="text-xs text-slate-500">No steps defined</p>
                    ) : (
                      <div className="space-y-3">
                        {cadence.steps.map((step) => (
                          <Card key={step.stepNumber} className="p-3">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-700 tabular">
                                {step.stepNumber}
                              </span>
                              <span className="text-xs text-slate-500">
                                {step.delay > 0
                                  ? `Wait ${step.delay} day${step.delay !== 1 ? "s" : ""}`
                                  : "Send immediately"}
                              </span>
                              <ChannelBadge channel={step.channel} />
                            </div>
                            {step.subject && (
                              <p className="text-sm font-medium text-slate-800 mb-1">{step.subject}</p>
                            )}
                            <p className="text-xs text-slate-500 whitespace-pre-wrap">{step.body || "(no body)"}</p>
                          </Card>
                        ))}
                      </div>
                    )}

                    {cadence.audienceFilter && (
                      <div className="mt-4">
                        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Audience Filter</h4>
                        <pre className="text-xs text-slate-600 bg-white rounded-lg border border-slate-200 p-3 overflow-x-auto">
                          {JSON.stringify(cadence.audienceFilter, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Modals: each mounts fresh when opened, so its form resets on close */}
      {showNewCadenceModal && (
        <CadenceFormModal
          key={editingCadence?.id ?? "new"}
          editing={editingCadence}
          saving={saving}
          onClose={closeCadenceModal}
          onSubmit={handleSaveCadence}
        />
      )}

      {showNewInitiativeModal && (
        <InitiativeFormModal
          saving={saving}
          onClose={() => setShowNewInitiativeModal(false)}
          onSubmit={handleCreateInitiative}
        />
      )}

      {showEnrollModal && (
        <EnrollContactsModal
          key={showEnrollModal}
          enrolling={enrolling}
          onClose={() => setShowEnrollModal(null)}
          onEnroll={handleEnroll}
        />
      )}
    </div>
  );
}
