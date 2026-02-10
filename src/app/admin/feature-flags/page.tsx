"use client";

import { useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { featureFlagsService } from "@/lib/services/feature-flags";
import { SearchInput } from "@/components/ui/SearchInput";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Modal } from "@/components/ui/Modal";

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  environment: string;
  tags: string[];
}

export default function FeatureFlagsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [environmentFilter, setEnvironmentFilter] = useState("production");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    enabled: false,
    rolloutPercentage: 0,
    environment: "production",
  });

  const { data, loading, error, refetch } = useApi(
    () => featureFlagsService.getAll(environmentFilter),
    [environmentFilter]
  );

  const flags = data?.data || [];
  const filteredFlags = flags.filter((flag) =>
    (flag.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (flag.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setEditingFlag(null);
    setFormData({
      name: "",
      description: "",
      enabled: false,
      rolloutPercentage: 0,
      environment: "production",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setFormData({
      name: flag.name,
      description: flag.description,
      enabled: flag.enabled,
      rolloutPercentage: flag.rolloutPercentage,
      environment: flag.environment,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await featureFlagsService.delete(id);
      refetch();
    } catch (err) {
      console.error("Failed to delete flag:", err);
    }
  };

  const handleSave = async () => {
    try {
      if (editingFlag) {
        await featureFlagsService.update(editingFlag.id, formData);
      } else {
        await featureFlagsService.create(formData);
      }
      refetch();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save flag:", err);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const flag = flags.find((f) => f.id === id);
      if (flag) {
        await featureFlagsService.update(id, { enabled: !flag.enabled });
        refetch();
      }
    } catch (err) {
      console.error("Failed to toggle flag:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Feature Flags</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">Feature Flags</h1>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <p className="font-medium">Failed to load data</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={refetch}
            className="mt-3 bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Feature Flags</h1>
          <p className="text-slate-500">Manage feature rollout and experimentation</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-amber-600 text-white rounded-md px-6 py-3 font-medium flex items-center gap-2 hover:bg-amber-700 transition-colors"
        >
          <Plus size={20} />
          Create Flag
        </button>
      </div>

      {/* Environment Filter */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-700">Environment</p>
        <div className="flex gap-2">
          {["production", "staging", "development"].map((env) => (
            <button
              key={env}
              onClick={() => setEnvironmentFilter(env)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                environmentFilter === env
                  ? "bg-amber-600 text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {env.charAt(0).toUpperCase() + env.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search feature flags..."
      />

      {/* Feature Flags Grid */}
      <div className="grid gap-6">
        {filteredFlags.map((flag) => (
          <div
            key={flag.id}
            className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  {flag.name}
                </h3>
                <p className="text-sm text-slate-500">{flag.description}</p>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => handleToggle(flag.id)}
                className={`ml-4 w-12 h-6 rounded transition-colors ${
                  flag.enabled ? "bg-amber-600" : "bg-gray-300"
                }`}
              />
            </div>

            {/* Rollout Percentage */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Rollout: {flag.rolloutPercentage}%
              </label>
              <ProgressBar
                value={flag.rolloutPercentage}
                color={flag.enabled ? "bg-amber-600" : "bg-gray-400"}
              />
            </div>

            {/* Environment & Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block border border-slate-200 rounded-md px-3 py-1 text-xs font-semibold bg-slate-50 text-slate-900">
                {flag.environment.toUpperCase()}
              </span>
              {(flag.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-block border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 bg-slate-50"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-slate-200">
              <button
                onClick={() => handleEdit(flag)}
                className="flex-1 border border-slate-200 bg-white text-slate-700 rounded-md px-4 py-2 font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(flag.id)}
                className="flex-1 border border-red-200 bg-red-50 text-red-700 rounded-md px-4 py-2 font-medium flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFlag ? "Edit Feature Flag" : "Create Feature Flag"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Flag Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., new-search-feature"
              className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe what this feature flag does"
              rows={3}
              className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) =>
                  setFormData({ ...formData, enabled: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              <span className="text-sm font-semibold text-slate-700">
                Enabled
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Rollout Percentage: {formData.rolloutPercentage}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.rolloutPercentage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  rolloutPercentage: parseInt(e.target.value),
                })
              }
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Environment
            </label>
            <select
              value={formData.environment}
              onChange={(e) =>
                setFormData({ ...formData, environment: e.target.value })
              }
              className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 bg-amber-600 text-white rounded-md px-4 py-2 font-medium hover:bg-amber-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 border border-slate-200 bg-white text-slate-700 rounded-md px-4 py-2 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
