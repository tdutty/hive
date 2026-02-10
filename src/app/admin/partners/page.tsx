"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { partnersService } from "@/lib/services/partners";
import { FilterBar } from "@/components/ui/FilterBar";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface Partner {
  id: string;
  name: string;
  slug: string;
  discountPercentage: number;
  contactName: string;
  contactEmail: string;
  status: "active" | "suspended" | "expired";
  domains?: string[];
  agreementStartDate?: string;
  agreementEndDate?: string;
}

export default function PartnersPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    discountPercentage: number;
    contactName: string;
    contactEmail: string;
    status: "active" | "suspended" | "expired";
  }>({
    name: "",
    slug: "",
    discountPercentage: 0,
    contactName: "",
    contactEmail: "",
    status: "active",
  });

  const statusFilters = [
    { key: "all", label: "All Partners" },
    { key: "active", label: "Active" },
    { key: "suspended", label: "Suspended" },
    { key: "expired", label: "Expired" },
  ];

  const { data, loading, error, refetch } = useApi(
    () =>
      partnersService.getAll({
        status: statusFilter === "all" ? undefined : statusFilter,
        page: 1,
        limit: 50,
      }),
    [statusFilter]
  );

  const partners = data?.partners || [];

  const handleCreate = () => {
    setEditingPartner(null);
    setFormData({
      name: "",
      slug: "",
      discountPercentage: 0,
      contactName: "",
      contactEmail: "",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      slug: partner.slug,
      discountPercentage: partner.discountPercentage,
      contactName: partner.contactName,
      contactEmail: partner.contactEmail,
      status: partner.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await partnersService.delete(id);
      refetch();
    } catch (err) {
      console.error("Failed to delete partner:", err);
    }
  };

  const handleSave = async () => {
    try {
      if (editingPartner) {
        await partnersService.update(editingPartner.id, formData);
      } else {
        await partnersService.create(formData);
      }
      refetch();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save partner:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Corporate Partners</h1>
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
            <h1 className="text-2xl font-semibold text-slate-900">Corporate Partners</h1>
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
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Corporate Partners</h1>
          <p className="text-slate-500">Manage partner relationships and employee discounts</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-amber-600 text-white rounded-md px-6 py-3 font-medium flex items-center gap-2 hover:bg-amber-700 transition-colors"
        >
          <Plus size={20} />
          Add Partner
        </button>
      </div>

      {/* Status Filter */}
      <FilterBar
        filters={statusFilters}
        selected={statusFilter}
        onChange={setStatusFilter}
      />

      {/* Partners Grid */}
      <div className="grid grid-cols-2 gap-6">
        {partners.map((partner: any) => (
          <div
            key={partner.id}
            className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-1">
                  {partner.name}
                </h3>
                <p className="text-xs text-slate-500">{partner.slug}</p>
              </div>
              <StatusBadge status={partner.status} size="sm" />
            </div>

            {/* Discount Badge */}
            <div className="inline-block border border-amber-200 bg-amber-50 rounded-lg px-4 py-2">
              <span className="font-semibold text-amber-900">
                {partner.discountPercentage}% off
              </span>
            </div>

            {/* Contact Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-1">
                Contact
              </p>
              <p className="font-semibold text-slate-900 text-sm">
                {partner.contactName}
              </p>
              <p className="text-sm text-slate-600">{partner.contactEmail}</p>
            </div>

            {/* Agreement Dates */}
            {(partner.agreementStartDate || partner.agreementEndDate) && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">
                  Agreement Period
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {partner.agreementStartDate} to {partner.agreementEndDate}
                </p>
              </div>
            )}

            {/* Domains */}
            {partner.domains && partner.domains.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-2">
                  Domains
                </p>
                <div className="flex flex-wrap gap-1">
                  {partner.domains.map((domain: string) => (
                    <span
                      key={domain}
                      className="inline-block border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 bg-white"
                    >
                      {domain}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-slate-200">
              <button
                onClick={() => handleEdit(partner)}
                className="flex-1 border border-slate-200 bg-white text-slate-700 rounded-md px-4 py-2 font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(partner.id)}
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
        title={editingPartner ? "Edit Partner" : "Add Partner"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Partner Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Google"
              className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              placeholder="e.g., google-corp"
              className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Discount Percentage
            </label>
            <input
              type="number"
              value={formData.discountPercentage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discountPercentage: parseInt(e.target.value) || 0,
                })
              }
              placeholder="15"
              className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Contact Name
            </label>
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) =>
                setFormData({ ...formData, contactName: e.target.value })
              }
              placeholder="Sarah Bennett"
              className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) =>
                setFormData({ ...formData, contactEmail: e.target.value })
              }
              placeholder="name@company.com"
              className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "active" | "suspended" | "expired",
                })
              }
              className="w-full border border-slate-200 rounded-md px-4 py-2 text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
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
