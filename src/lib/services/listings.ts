import { api } from "@/lib/api";

export interface ListingsParams {
  search?: string;
  status?: string;
  propertyType?: string;
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  isSponsored?: boolean;
  isFeatured?: boolean;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

export interface ListingsResponse {
  listings: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const listingsService = {
  async getAll(params?: ListingsParams) {
    const raw = await api.get<any>("/api/admin/listings", params as any);
    // Normalize field names from SweetLease API to what the UI expects
    const listings = (raw.listings || []).map((l: any) => ({
      ...l,
      views: l.viewCount ?? l.views ?? 0,
      saves: l.saveCount ?? l.saves ?? 0,
      city: l.city || l.user?.city || "",
    }));
    const pagination = raw.pagination
      ? {
          page: raw.pagination.page,
          limit: raw.pagination.limit,
          total: raw.pagination.totalCount ?? raw.pagination.total ?? 0,
          totalPages: raw.pagination.totalPages ?? 1,
        }
      : { page: 1, limit: 20, total: 0, totalPages: 1 };
    return { listings, pagination } as ListingsResponse;
  },

  getById(id: string) {
    return api.get<any>(`/api/admin/listings/${id}`);
  },

  create(data: any) {
    return api.post<any>("/api/admin/listings", data);
  },

  update(id: string, data: any) {
    return api.put<any>(`/api/admin/listings/${id}`, data);
  },

  delete(id: string) {
    return api.delete<void>(`/api/admin/listings/${id}`);
  },

  getSchema() {
    return api.get<any>("/api/admin/listings/schema");
  },
};
