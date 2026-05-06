"use client";

import { useState, useEffect, useCallback } from "react";
import { sweetleaseApi } from "@/lib/api";
import {
  GitBranch,
  Plus,
  Loader2,
  ChevronDown,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Mail,
  MessageSquare,
  Users,
  Zap,
  Search,
  X,
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

// --- Helpers ---

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  const [initiativesLoading, setInitiativesLoading] = useState(true);

  // UI state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewCadenceModal, setShowNewCadenceModal] = useState(false);
  const [showNewInitiativeModal, setShowNewInitiativeModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState<string | null>(null);
  const [editingCadence, setEditingCadence] = useState<Cadence | null>(null);
  const [saving, setSaving] = useState(false);

  // New cadence form
  const [newCadenceName, setNewCadenceName] = useState("");
  const [newCadenceAudience, setNewCadenceAudience] = useState("");
  const [newCadenceSteps, setNewCadenceSteps] = useState<CadenceStep[]>([
    { stepNumber: 1, delay: 0, channel: "EMAIL", subject: "", body: "" },
  ]);

  // New initiative form
  const [newInitName, setNewInitName] = useState("");
  const [newInitScope, setNewInitScope] = useState("");
  const [newInitWindowStart, setNewInitWindowStart] = useState("");
  const [newInitWindowEnd, setNewInitWindowEnd] = useState("");
  const [newInitMultiplier, setNewInitMultiplier] = useState(1);
  const [newInitTargetMetric, setNewInitTargetMetric] = useState("");
  const [newInitActive, setNewInitActive] = useState(true);

  // Enroll contacts state
  const [enrollContacts, setEnrollContacts] = useState<ConciergeContact[]>([]);
  const [enrollSearch, setEnrollSearch] = useState("");
  const [enrollSelected, setEnrollSelected] = useState<Set<string>>(new Set());
  const [enrollLoading, setEnrollLoading] = useState(false);
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
    } catch (err) {
      console.error("Failed to fetch cadences:", err);
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
    } catch (err) {
      console.error("Failed to fetch initiatives:", err);
    } finally {
      setInitiativesLoading(false);
    }
  }, []);

  const fetchEnrollContacts = useCallback(async () => {
    setEnrollLoading(true);
    try {
      const params: Record<string, string> = {};
      if (enrollSearch) params.search = enrollSearch;
      const data = await sweetleaseApi.get<ContactsResponse>(
        "/api/admin/concierge/contacts",
        params
      );
      setEnrollContacts(data.contacts);
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    } finally {
      setEnrollLoading(false);
    }
  }, [enrollSearch]);

  useEffect(() => {
    fetchCadences();
    fetchInitiatives();
  }, [fetchCadences, fetchInitiatives]);

  useEffect(() => {
    if (showEnrollModal) {
      fetchEnrollContacts();
    }
  }, [showEnrollModal, fetchEnrollContacts]);

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
    } catch (err) {
      console.error("Failed to toggle cadence:", err);
    }
  };

  const toggleInitiativeActive = async (initiative: Initiative) => {
    try {
      await sweetleaseApi.patch("/api/admin/concierge/initiatives", {
        id: initiative.id,
        active: !initiative.active,
      });
      await fetchInitiatives();
    } catch (err) {
      console.error("Failed to toggle initiative:", err);
    }
  };

  const handleCreateCadence = async () => {
    if (!newCadenceName.trim()) return;
    setSaving(true);
    try {
      let audienceFilter = null;
      if (newCadenceAudience.trim()) {
        try {
          audienceFilter = JSON.parse(newCadenceAudience);
        } catch {
          audienceFilter = { description: newCadenceAudience };
        }
      }
      await sweetleaseApi.post("/api/admin/concierge/cadences", {
        name: newCadenceName,
        audienceFilter,
        steps: newCadenceSteps,
      });
      setShowNewCadenceModal(false);
      resetCadenceForm();
      await fetchCadences();
    } catch (err) {
      console.error("Failed to create cadence:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCadence = async () => {
    if (!editingCadence) return;
    setSaving(true);
    try {
      let audienceFilter = null;
      if (newCadenceAudience.trim()) {
        try {
          audienceFilter = JSON.parse(newCadenceAudience);
        } catch {
          audienceFilter = { description: newCadenceAudience };
        }
      }
      await sweetleaseApi.patch("/api/admin/concierge/cadences", {
        id: editingCadence.id,
        name: newCadenceName,
        audienceFilter,
        steps: newCadenceSteps,
      });
      setEditingCadence(null);
      setShowNewCadenceModal(false);
      resetCadenceForm();
      await fetchCadences();
    } catch (err) {
      console.error("Failed to update cadence:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInitiative = async () => {
    if (!newInitName.trim()) return;
    setSaving(true);
    try {
      let scope = null;
      if (newInitScope.trim()) {
        try {
          scope = JSON.parse(newInitScope);
        } catch {
          scope = { description: newInitScope };
        }
      }
      await sweetleaseApi.post("/api/admin/concierge/initiatives", {
        name: newInitName,
        scope,
        windowStart: newInitWindowStart || null,
        windowEnd: newInitWindowEnd || null,
        multiplier: newInitMultiplier,
        targetMetric: newInitTargetMetric,
        active: newInitActive,
      });
      setShowNewInitiativeModal(false);
      resetInitiativeForm();
      await fetchInitiatives();
    } catch (err) {
      console.error("Failed to create initiative:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleEnroll = async () => {
    if (!showEnrollModal || enrollSelected.size === 0) return;
    setEnrolling(true);
    try {
      await sweetleaseApi.post("/api/admin/concierge/cadences/enroll", {
        cadenceId: showEnrollModal,
        contactIds: Array.from(enrollSelected),
      });
      setShowEnrollModal(null);
      setEnrollSelected(new Set());
      setEnrollSearch("");
      await fetchCadences();
    } catch (err) {
      console.error("Failed to enroll contacts:", err);
    } finally {
      setEnrolling(false);
    }
  };

  const openEditCadence = (cadence: Cadence) => {
    setEditingCadence(cadence);
    setNewCadenceName(cadence.name);
    setNewCadenceAudience(
      cadence.audienceFilter ? JSON.stringify(cadence.audienceFilter, null, 2) : ""
    );
    setNewCadenceSteps(
      cadence.steps.length > 0
        ? cadence.steps.map((s, i) => ({ ...s, stepNumber: i + 1 }))
        : [{ stepNumber: 1, delay: 0, channel: "EMAIL", subject: "", body: "" }]
    );
    setShowNewCadenceModal(true);
  };

  const resetCadenceForm = () => {
    setNewCadenceName("");
    setNewCadenceAudience("");
    setNewCadenceSteps([
      { stepNumber: 1, delay: 0, channel: "EMAIL", subject: "", body: "" },
    ]);
    setEditingCadence(null);
  };

  const resetInitiativeForm = () => {
    setNewInitName("");
    setNewInitScope("");
    setNewInitWindowStart("");
    setNewInitWindowEnd("");
    setNewInitMultiplier(1);
    setNewInitTargetMetric("");
    setNewInitActive(true);
  };

  const addStep = () => {
    setNewCadenceSteps((prev) => [
      ...prev,
      {
        stepNumber: prev.length + 1,
        delay: 1,
        channel: "EMAIL",
        subject: "",
        body: "",
      },
    ]);
  };

  const removeStep = (index: number) => {
    setNewCadenceSteps((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 }))
    );
  };

  const updateStep = (index: number, field: keyof CadenceStep, value: string | number) => {
    setNewCadenceSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const toggleEnrollContact = (id: string) => {
    setEnrollSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // --- Stats ---

  const statCards = [
    {
      label: "Total Cadences",
      value: `${stats.active} active / ${stats.inactive} inactive`,
      icon: <GitBranch size={20} className="text-amber-600" />,
    },
    {
      label: "Active Enrollments",
      value: stats.totalEnrollments,
      icon: <Users size={20} className="text-blue-600" />,
    },
    {
      label: "Steps Executed Today",
      value: stats.stepsExecutedToday,
      icon: <Zap size={20} className="text-green-600" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cadences</h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated outreach sequences for concierge contacts
          </p>
        </div>
        <button
          onClick={() => {
            resetCadenceForm();
            setShowNewCadenceModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Cadence
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
              {card.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
              </p>
              <p className="text-xs text-slate-500">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Initiatives */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Target size={20} className="text-amber-600" />
            Active Initiatives
          </h2>
          <button
            onClick={() => {
              resetInitiativeForm();
              setShowNewInitiativeModal(true);
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <Plus size={14} />
            Add Initiative
          </button>
        </div>

        {initiativesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-slate-400" />
          </div>
        ) : initiatives.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            No initiatives yet. Create one to boost cadence performance.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initiatives.map((init) => (
              <div
                key={init.id}
                className={`border rounded-lg p-4 ${
                  init.active
                    ? "border-amber-200 bg-amber-50/30"
                    : "border-slate-200 bg-slate-50/50 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-900">{init.name}</h3>
                  <button
                    onClick={() => toggleInitiativeActive(init)}
                    className="text-slate-500 hover:text-amber-600 transition-colors"
                    title={init.active ? "Deactivate" : "Activate"}
                  >
                    {init.active ? (
                      <ToggleRight size={20} className="text-amber-600" />
                    ) : (
                      <ToggleLeft size={20} />
                    )}
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-amber-600" />
                    <span className="text-sm font-bold text-amber-700">
                      {init.multiplier}x
                    </span>
                    <span className="text-xs text-slate-500">multiplier</span>
                  </div>
                  {(init.windowStart || init.windowEnd) && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      <span className="text-xs text-slate-500">
                        {init.windowStart ? formatDate(init.windowStart) : "..."} -{" "}
                        {init.windowEnd ? formatDate(init.windowEnd) : "..."}
                      </span>
                    </div>
                  )}
                  {init.targetMetric && (
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-slate-400" />
                      <span className="text-xs text-slate-500">{init.targetMetric}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cadences List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">All Cadences</h2>

        {loading ? (
          <div className="bg-white rounded-xl border border-slate-200 flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-slate-400" />
            <span className="ml-2 text-sm text-slate-500">Loading cadences...</span>
          </div>
        ) : cadences.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center py-20 text-slate-400">
            <GitBranch size={40} className="mb-3" />
            <p className="text-sm">No cadences yet. Create your first one.</p>
          </div>
        ) : (
          cadences.map((cadence) => {
            const isExpanded = expandedId === cadence.id;
            const enrollCount = cadence._count?.enrollments || 0;

            return (
              <div
                key={cadence.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpand(cadence.id)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {isExpanded ? (
                          <ChevronDown size={18} />
                        ) : (
                          <ChevronRight size={18} />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {cadence.name}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              cadence.active
                                ? "bg-green-50 text-green-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {cadence.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-slate-500">
                            {cadence.steps.length} step{cadence.steps.length !== 1 ? "s" : ""}
                          </span>
                          <span className="text-xs text-slate-500">
                            {enrollCount} contact{enrollCount !== 1 ? "s" : ""} enrolled
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowEnrollModal(cadence.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        <Users size={14} />
                        Enroll Contacts
                      </button>
                      <button
                        onClick={() => openEditCadence(cadence)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleCadenceActive(cadence)}
                        className="text-slate-500 hover:text-amber-600 transition-colors"
                        title={cadence.active ? "Deactivate" : "Activate"}
                      >
                        {cadence.active ? (
                          <ToggleRight size={22} className="text-amber-600" />
                        ) : (
                          <ToggleLeft size={22} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Steps Preview (collapsed) */}
                  {!isExpanded && cadence.steps.length > 0 && (
                    <div className="mt-3 ml-8 space-y-1">
                      {cadence.steps.slice(0, 3).map((step) => (
                        <div
                          key={step.stepNumber}
                          className="flex items-center gap-2 text-xs text-slate-500"
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                            {step.stepNumber}
                          </span>
                          <span className="text-slate-400">
                            {step.delay > 0 ? `+${step.delay}d` : "Immediate"}
                          </span>
                          {step.channel === "EMAIL" ? (
                            <Mail size={12} className="text-blue-400" />
                          ) : (
                            <MessageSquare size={12} className="text-green-400" />
                          )}
                          <span className="truncate max-w-xs">
                            {step.subject || "(no subject)"}
                          </span>
                        </div>
                      ))}
                      {cadence.steps.length > 3 && (
                        <span className="text-xs text-slate-400 ml-7">
                          +{cadence.steps.length - 3} more step{cadence.steps.length - 3 !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Steps Detail */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">
                      Steps
                    </h4>
                    {cadence.steps.length === 0 ? (
                      <p className="text-xs text-slate-400">No steps defined</p>
                    ) : (
                      <div className="space-y-3">
                        {cadence.steps.map((step) => (
                          <div
                            key={step.stepNumber}
                            className="bg-white rounded-lg border border-slate-200 p-3"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                                {step.stepNumber}
                              </span>
                              <span className="text-xs text-slate-500">
                                {step.delay > 0
                                  ? `Wait ${step.delay} day${step.delay !== 1 ? "s" : ""}`
                                  : "Send immediately"}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  step.channel === "EMAIL"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-green-50 text-green-700"
                                }`}
                              >
                                {step.channel === "EMAIL" ? (
                                  <Mail size={12} />
                                ) : (
                                  <MessageSquare size={12} />
                                )}
                                {step.channel}
                              </span>
                            </div>
                            {step.subject && (
                              <p className="text-sm font-medium text-slate-800 mb-1">
                                {step.subject}
                              </p>
                            )}
                            <p className="text-xs text-slate-500 whitespace-pre-wrap">
                              {step.body || "(no body)"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {cadence.audienceFilter && (
                      <div className="mt-4">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">
                          Audience Filter
                        </h4>
                        <pre className="text-xs text-slate-600 bg-white rounded-lg border border-slate-200 p-3 overflow-x-auto">
                          {JSON.stringify(cadence.audienceFilter, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New / Edit Cadence Modal */}
      {showNewCadenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingCadence ? "Edit Cadence" : "New Cadence"}
              </h2>
              <button
                onClick={() => {
                  setShowNewCadenceModal(false);
                  resetCadenceForm();
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newCadenceName}
                  onChange={(e) => setNewCadenceName(e.target.value)}
                  placeholder="e.g. Welcome Sequence"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Audience Filter */}
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
                  Audience Filter (JSON or description)
                </label>
                <textarea
                  value={newCadenceAudience}
                  onChange={(e) => setNewCadenceAudience(e.target.value)}
                  placeholder='{"type": "RESIDENT", "market": "Houston"}'
                  rows={3}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              {/* Steps */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-500 uppercase">
                    Steps
                  </label>
                  <button
                    onClick={addStep}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded hover:bg-amber-100 transition-colors"
                  >
                    <Plus size={12} />
                    Add Step
                  </button>
                </div>

                <div className="space-y-3">
                  {newCadenceSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-lg p-3 bg-slate-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-600">
                          Step {step.stepNumber}
                        </span>
                        {newCadenceSteps.length > 1 && (
                          <button
                            onClick={() => removeStep(idx)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-0.5">
                            Delay (days)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={step.delay}
                            onChange={(e) =>
                              updateStep(idx, "delay", parseInt(e.target.value) || 0)
                            }
                            className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-0.5">
                            Channel
                          </label>
                          <select
                            value={step.channel}
                            onChange={(e) =>
                              updateStep(idx, "channel", e.target.value)
                            }
                            className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="EMAIL">Email</option>
                            <option value="SMS">SMS</option>
                          </select>
                        </div>
                      </div>

                      <div className="mb-2">
                        <label className="block text-[11px] text-slate-400 mb-0.5">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={step.subject}
                          onChange={(e) => updateStep(idx, "subject", e.target.value)}
                          placeholder="Email subject line"
                          className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-0.5">
                          Body
                        </label>
                        <textarea
                          value={step.body}
                          onChange={(e) => updateStep(idx, "body", e.target.value)}
                          placeholder="Message body..."
                          rows={3}
                          className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowNewCadenceModal(false);
                  resetCadenceForm();
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingCadence ? handleUpdateCadence : handleCreateCadence}
                disabled={saving || !newCadenceName.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editingCadence ? "Save Changes" : "Create Cadence"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Initiative Modal */}
      {showNewInitiativeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Add Initiative</h2>
              <button
                onClick={() => {
                  setShowNewInitiativeModal(false);
                  resetInitiativeForm();
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newInitName}
                  onChange={(e) => setNewInitName(e.target.value)}
                  placeholder="e.g. Q2 Push"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
                  Scope (JSON or description)
                </label>
                <textarea
                  value={newInitScope}
                  onChange={(e) => setNewInitScope(e.target.value)}
                  placeholder='{"markets": ["Houston", "Dallas"]}'
                  rows={3}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
                    Window Start
                  </label>
                  <input
                    type="date"
                    value={newInitWindowStart}
                    onChange={(e) => setNewInitWindowStart(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
                    Window End
                  </label>
                  <input
                    type="date"
                    value={newInitWindowEnd}
                    onChange={(e) => setNewInitWindowEnd(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
                    Multiplier
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    min={0.1}
                    value={newInitMultiplier}
                    onChange={(e) =>
                      setNewInitMultiplier(parseFloat(e.target.value) || 1)
                    }
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 uppercase mb-1">
                    Target Metric
                  </label>
                  <input
                    type="text"
                    value={newInitTargetMetric}
                    onChange={(e) => setNewInitTargetMetric(e.target.value)}
                    placeholder="e.g. signups"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNewInitActive(!newInitActive)}
                  className="text-slate-500"
                >
                  {newInitActive ? (
                    <ToggleRight size={24} className="text-amber-600" />
                  ) : (
                    <ToggleLeft size={24} />
                  )}
                </button>
                <span className="text-sm text-slate-700">
                  {newInitActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowNewInitiativeModal(false);
                  resetInitiativeForm();
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInitiative}
                disabled={saving || !newInitName.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Create Initiative
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Contacts Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Enroll Contacts</h2>
              <button
                onClick={() => {
                  setShowEnrollModal(null);
                  setEnrollSelected(new Set());
                  setEnrollSearch("");
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={enrollSearch}
                  onChange={(e) => setEnrollSearch(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg pl-9 pr-3 py-2 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              {enrollSelected.size > 0 && (
                <p className="text-xs text-amber-700 mt-2 font-medium">
                  {enrollSelected.size} contact{enrollSelected.size !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {enrollLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-slate-400" />
                </div>
              ) : enrollContacts.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-400">
                  No contacts found
                </div>
              ) : (
                enrollContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => toggleEnrollContact(contact.id)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                      enrollSelected.has(contact.id) ? "bg-amber-50/50" : ""
                    }`}
                  >
                    {enrollSelected.has(contact.id) ? (
                      <CheckSquare size={18} className="text-amber-600 flex-shrink-0" />
                    ) : (
                      <Square size={18} className="text-slate-300 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {contact.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {contact.email || contact.phone || "No contact info"}
                      </p>
                    </div>
                    <span className="ml-auto text-[10px] font-medium text-slate-400 uppercase flex-shrink-0">
                      {contact.type}
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowEnrollModal(null);
                  setEnrollSelected(new Set());
                  setEnrollSearch("");
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={enrolling || enrollSelected.size === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {enrolling && <Loader2 size={14} className="animate-spin" />}
                Enroll Selected ({enrollSelected.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
