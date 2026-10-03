import { api } from "@/lib/api";

export interface AlnStatus {
  ready: boolean;
  source: { configured: boolean; kind?: "api" | "file"; missing: string[] };
  fieldMapMissing: string[];
  nightlySyncOn: boolean;
  metros: string[];
  listingsByStatus: Record<string, number>;
  lastRun: Record<string, { at: string; created: number; updated: number; unchanged: number; deactivated: number; invalid: number; errors: string[] }> | null;
}

export const alnService = {
  status: () => api.get<AlnStatus>("/api/admin/aln/status"),
  sync: (body: { metro?: string; commit?: boolean }) => api.post<{ results: any[] }>("/api/admin/aln/sync", body),
  retire: (body: { city: string; state: string; commit?: boolean; restore?: boolean }) => api.post<any>("/api/admin/aln/retire-scraped", body),
  saveSettings: (settings: Record<string, any>) => api.post<{ success: boolean }>("/api/admin/settings", { settings }),
};
