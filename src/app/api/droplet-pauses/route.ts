import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { readFile } from "fs/promises";
import { requireAdmin } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
const run = promisify(execFile);

/**
 * Live status of the PM reply pipeline, which runs on this droplet next to Hive.
 * Read-only: reads the crontab, pm2's process list and the pending-approvals file.
 */
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  let cron: { line: string; paused: boolean }[] = [];
  let pm2Status: string | null = null;
  let pendingApprovals: number | null = null;
  const errors: string[] = [];

  try {
    const { stdout } = await run("crontab", ["-l"], { timeout: 5000 });
    cron = stdout.split("\n")
      .filter(l => /pipeline\.cjs|tgilbert_poller\.py/.test(l))
      .map(l => ({ line: l.replace(/^#\s*PAUSED[^*\d]*/, "").trim(), paused: l.trim().startsWith("#") }));
  } catch (e: any) { errors.push(`crontab: ${e.message}`); }

  try {
    const { stdout } = await run("pm2", ["jlist"], { timeout: 8000, maxBuffer: 10 * 1024 * 1024 });
    const procs = JSON.parse(stdout) as Array<{ name: string; pm2_env?: { status?: string } }>;
    pm2Status = procs.find(p => p.name === "reply-approvals")?.pm2_env?.status ?? "not found";
  } catch (e: any) { errors.push(`pm2: ${e.message}`); }

  try {
    const raw = JSON.parse(await readFile("/var/www/reply-pipeline/pending.json", "utf8"));
    pendingApprovals = Array.isArray(raw) ? raw.length : Object.keys(raw || {}).length;
  } catch (e: any) { errors.push(`pending.json: ${e.message}`); }

  const running = cron.some(c => !c.paused) || pm2Status === "online";
  const state = errors.length && !cron.length && !pm2Status ? "unknown" : running ? "on" : "off";
  return NextResponse.json({ state, cron, pm2Status, pendingApprovals, errors });
}
