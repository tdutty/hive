"use client";

import { useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { featureFlagsService } from "@/lib/services/feature-flags";
import { Button, Card, CardHeader, CardBody, Badge, PageHeader, FilterChips, type Chip, Field, Input, Select, Textarea } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
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

type Environment = "production" | "staging" | "development";
const ENV_CHIPS: Chip<Environment>[] = [
  { key: "production", label: "Production" },
  { key: "staging", label: "Staging" },
  { key: "development", label: "Development" },
];

export default function FeatureFlagsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [environmentFilter, setEnvironmentFilter] = useState<Environment>("production");
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
    return <div className="max-w-7xl"><PageHeader title="Feature Flags" /><Spinner label="Loading feature flags" /></div>;
  }

  if (error) {
    return <div className="max-w-7xl"><PageHeader title="Feature Flags" /><ErrorBanner message={error} onRetry={refetch} /></div>;
  }

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Feature Flags"
        description="Manage feature rollout and experimentation"
        actions={<Button variant="primary" icon={<Plus size={14} />} onClick={handleCreate}>Create flag</Button>}
      />

      {/* Environment filter + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <Input
          type="search"
          aria-label="Search feature flags"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search feature flags..."
          className="sm:max-w-xs"
        />
        <FilterChips items={ENV_CHIPS} value={environmentFilter} onChange={setEnvironmentFilter} />
      </div>

      {/* Feature Flags Grid */}
      {filteredFlags.length === 0 ? (
        <Card>
          <EmptyState
            title={flags.length === 0 ? `No flags in ${environmentFilter}` : "No flags match your search"}
            hint={flags.length === 0 ? "Create a flag to start a rollout in this environment." : undefined}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filteredFlags.map((flag) => (
            <Card key={flag.id}>
              <CardHeader
                title={flag.name}
                description={flag.description}
                actions={
                  <button
                    type="button"
                    role="switch"
                    aria-checked={flag.enabled}
                    aria-label={`${flag.enabled ? "Disable" : "Enable"} ${flag.name}`}
                    onClick={() => handleToggle(flag.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 ${flag.enabled ? "bg-amber-600" : "bg-slate-300"}`}
                  >
                    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${flag.enabled ? "translate-x-4" : "translate-x-0.5"}`} aria-hidden />
                  </button>
                }
              />
              <CardBody className="space-y-4">
                {/* Rollout Percentage */}
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1.5 tabular">Rollout: {flag.rolloutPercentage}%</p>
                  <ProgressBar
                    value={flag.rolloutPercentage}
                    color={flag.enabled ? "bg-amber-600" : "bg-slate-400"}
                  />
                </div>

                {/* Environment & Tags */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge tone="outline">{flag.environment.toUpperCase()}</Badge>
                  {(flag.tags || []).map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-200">
                  <Button size="sm" icon={<Edit2 size={14} />} onClick={() => handleEdit(flag)}>Edit</Button>
                  <Button size="sm" variant="dangerOutline" icon={<Trash2 size={14} />} onClick={() => handleDelete(flag.id)}>Delete</Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFlag ? "Edit feature flag" : "Create feature flag"}
      >
        <div className="space-y-4">
          <Field label="Flag name">
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., new-search-feature"
            />
          </Field>

          <Field label="Description">
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this feature flag does"
              rows={3}
            />
          </Field>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-slate-700">Enabled</span>
          </label>

          <Field label={`Rollout percentage: ${formData.rolloutPercentage}%`}>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.rolloutPercentage}
              onChange={(e) => setFormData({ ...formData, rolloutPercentage: parseInt(e.target.value) })}
              className="w-full accent-amber-600"
            />
          </Field>

          <Field label="Environment">
            <Select
              value={formData.environment}
              onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </Select>
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
