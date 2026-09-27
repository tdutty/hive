"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useApi } from "@/lib/hooks";
import { partnersService } from "@/lib/services/partners";
import { Button, Card, CardHeader, CardBody, Badge, statusTone, PageHeader, FilterChips, type Chip, Field, Input, Select } from "@/components/kit";
import { ErrorBanner, Spinner, EmptyState } from "@/components/ui/AsyncState";
import { Modal } from "@/components/ui/Modal";

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

const STATUS_CHIPS: Chip<string>[] = [
  { key: "all", label: "All Partners" },
  { key: "active", label: "Active" },
  { key: "suspended", label: "Suspended" },
  { key: "expired", label: "Expired" },
];

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

  if (loading) return <div><PageHeader title="Corporate Partners" /><Spinner /></div>;
  if (error) return <div><PageHeader title="Corporate Partners" /><ErrorBanner message={error} onRetry={refetch} /></div>;

  return (
    <div className="max-w-7xl">
      <PageHeader
        title="Corporate Partners"
        description="Manage partner relationships and employee discounts"
        actions={
          <Button variant="primary" icon={<Plus size={14} />} onClick={handleCreate}>
            Add Partner
          </Button>
        }
      />

      <FilterChips items={STATUS_CHIPS} value={statusFilter} onChange={setStatusFilter} className="mb-4" />

      {partners.length === 0 ? (
        <Card>
          <EmptyState title="No partners found" hint="Add a partner or change the status filter" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {partners.map((partner: any) => (
            <Card key={partner.id}>
              <CardHeader
                title={partner.name}
                description={partner.slug}
                actions={<Badge tone={statusTone(partner.status)} dot>{partner.status}</Badge>}
              />
              <CardBody>
                <dl className="divide-y divide-slate-100">
                  <div className="flex justify-between items-center py-2 gap-4">
                    <dt className="text-sm text-slate-600">Discount</dt>
                    <dd><Badge tone="accent">{partner.discountPercentage}% off</Badge></dd>
                  </div>
                  <div className="flex justify-between items-start py-2 gap-4">
                    <dt className="text-sm text-slate-600">Contact</dt>
                    <dd className="text-right min-w-0">
                      <p className="text-sm font-medium text-slate-900">{partner.contactName}</p>
                      <p className="text-sm text-slate-500 break-all">{partner.contactEmail}</p>
                    </dd>
                  </div>
                  {(partner.agreementStartDate || partner.agreementEndDate) && (
                    <div className="flex justify-between items-center py-2 gap-4">
                      <dt className="text-sm text-slate-600">Agreement Period</dt>
                      <dd className="text-sm font-medium text-slate-900 tabular text-right">
                        {partner.agreementStartDate} to {partner.agreementEndDate}
                      </dd>
                    </div>
                  )}
                  {partner.domains && partner.domains.length > 0 && (
                    <div className="flex justify-between items-start py-2 gap-4">
                      <dt className="text-sm text-slate-600 shrink-0">Domains</dt>
                      <dd className="flex flex-wrap justify-end gap-1">
                        {partner.domains.map((domain: string) => (
                          <Badge key={domain} tone="outline">{domain}</Badge>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
                  <Button size="sm" icon={<Edit2 size={14} />} onClick={() => handleEdit(partner)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="dangerOutline" icon={<Trash2 size={14} />} onClick={() => handleDelete(partner.id)}>
                    Delete
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPartner ? "Edit Partner" : "Add Partner"}
      >
        <div className="space-y-4">
          <Field label="Partner Name">
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Google"
            />
          </Field>

          <Field label="Slug">
            <Input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="e.g., google-corp"
            />
          </Field>

          <Field label="Discount Percentage">
            <Input
              type="number"
              value={formData.discountPercentage}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discountPercentage: parseInt(e.target.value) || 0,
                })
              }
              placeholder="15"
              className="tabular"
            />
          </Field>

          <Field label="Contact Name">
            <Input
              type="text"
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              placeholder="Sarah Bennett"
            />
          </Field>

          <Field label="Contact Email">
            <Input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="name@company.com"
            />
          </Field>

          <Field label="Status">
            <Select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "active" | "suspended" | "expired",
                })
              }
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
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
