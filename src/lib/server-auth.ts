import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const SWEETLEASE_URL = process.env.SWEETLEASE_API_URL || "http://localhost:3000";

/**
 * Server-side admin check for Hive's own API routes and the admin proxy.
 * Hive has no user database: the session cookie is issued by SweetLease's
 * next-auth, so we ask SweetLease whether it is a live ADMIN session. Results
 * are cached briefly per cookie so a page full of requests costs one lookup.
 */
const cache = new Map<string, { ok: boolean; until: number }>();
const TTL_MS = 30_000;

export async function isAdminSession(req: NextRequest): Promise<boolean> {
  const cookie = req.headers.get("cookie") || "";
  if (!/(__Secure-)?next-auth\.session-token=/.test(cookie)) return false;
  const hit = cache.get(cookie);
  if (hit && hit.until > Date.now()) return hit.ok;
  let ok = false;
  try {
    // SweetLease sits behind its site password; pass the same site cookie the auth proxy uses
    const sitePassword = process.env.SWEETLEASE_SITE_PASSWORD;
    const siteCookie = sitePassword ? `site_access=${Buffer.from(`${Date.now()}:${sitePassword}`).toString("base64")}` : "";
    const r = await fetch(`${SWEETLEASE_URL}/api/auth/session`, { headers: { cookie: [cookie, siteCookie].filter(Boolean).join("; ") }, signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (r.ok) {
      const j: any = await r.json().catch(() => ({}));
      ok = Boolean(j?.user) && (j.user.role === "ADMIN" || j.user.role === "admin");
    }
  } catch { ok = false; }
  cache.set(cookie, { ok, until: Date.now() + TTL_MS });
  if (cache.size > 500) { const oldest = cache.keys().next().value; if (oldest) cache.delete(oldest); }
  return ok;
}

/** Use at the top of a route: `const denied = await requireAdmin(req); if (denied) return denied;` */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  return (await isAdminSession(req)) ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
