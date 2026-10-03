import { api } from "@/lib/api";

export type LiveState = "off" | "on" | "archived" | "unknown";
export interface PausedItem {
  id: string;
  group: "Hive switches" | "Outreach tools" | "Turned off in code" | "Archived or removed";
  name: string;
  whatItDid: string;
  howStopped: string;
  stoppedOn: string;
  howToResume: string;
  state: LiveState;
  detail?: string;
  warning?: string;
}

export const pausedService = {
  list() {
    return api.get<{ items: PausedItem[]; checkedAt: string }>("/api/admin/paused-services");
  },
  async droplet() {
    const r = await fetch("/api/droplet-pauses", { cache: "no-store" });
    if (!r.ok) throw new Error(`droplet status ${r.status}`);
    return r.json() as Promise<{ state: LiveState; cron: { line: string; paused: boolean }[]; pm2Status: string | null; pendingApprovals: number | null; errors: string[] }>;
  },
};
