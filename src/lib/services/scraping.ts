import { api } from "@/lib/api";

export interface ScrapingJob {
  jobId: string;
  status: string;
  startTime: string;
  endTime: string | null;
  progress: {
    marketData: any;
    competitors: any;
    indicators: any;
  };
  errors: any[];
  summary: any;
}

export const scrapingService = {
  getJobs(params?: { limit?: number; offset?: number }) {
    return api.get<{ jobs: ScrapingJob[]; total: number; hasMore: boolean }>("/api/admin/scraping/jobs", params);
  },

  getJob(jobId: string) {
    return api.get<ScrapingJob>(`/api/admin/scraping/jobs/${jobId}`);
  },

  stopJob(jobId: string) {
    return api.post<{ success: boolean }>(`/api/admin/scraping/jobs/${jobId}/stop`);
  },

  getConfig() {
    return api.get<{
      realScrapingEnabled: boolean;
      scrapingDelay: number;
      scrapingTimeout: number;
      maxRetries: number;
      headlessMode: boolean;
      useProxy: boolean;
      proxyUrl: string;
      maxConcurrentJobs: number;
      allowedStates: string[];
      environment: string;
      features: any;
    }>("/api/admin/scraping/config");
  },

  updateConfig(data: any) {
    return api.put<{ success: boolean; config: any; warnings: string[] }>("/api/admin/scraping/config", data);
  },

  getSites() {
    return api.get<{ sites: any[]; totalSites: number; activeSites: number; globalSettings: any }>("/api/admin/scraping/sites");
  },

  getStats() {
    return api.get<any>("/api/admin/scraping/stats");
  },
};
