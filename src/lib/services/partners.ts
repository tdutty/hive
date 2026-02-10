import { api } from "@/lib/api";

export interface Partner {
  id: string;
  name: string;
  slug: string;
  discountPercentage: number;
  contactEmail: string;
  contactName: string;
  status: string;
  agreementStartDate: string;
  agreementEndDate: string;
  domains: string[];
  stripeCouponId: string;
  createdAt: string;
  updatedAt: string;
}

export const partnersService = {
  getAll(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    return api.get<{ partners: Partner[]; pagination: any }>("/api/admin/corporate-partners", params);
  },

  getById(id: string) {
    return api.get<Partner>(`/api/admin/corporate-partners/${id}`);
  },

  create(data: Partial<Partner>) {
    return api.post<Partner>("/api/admin/corporate-partners", data);
  },

  update(id: string, data: Partial<Partner>) {
    return api.put<Partner>(`/api/admin/corporate-partners/${id}`, data);
  },

  delete(id: string) {
    return api.delete<{ success: boolean }>(`/api/admin/corporate-partners/${id}`);
  },

  getDomains(id: string) {
    return api.get<any>(`/api/admin/corporate-partners/${id}/domains`);
  },

  addDomain(id: string, domain: string) {
    return api.post<any>(`/api/admin/corporate-partners/${id}/domains`, { domain });
  },

  getEmployees(id: string) {
    return api.get<any>(`/api/admin/corporate-partners/${id}/employees`);
  },
};
