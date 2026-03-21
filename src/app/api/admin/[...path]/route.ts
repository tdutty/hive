import { NextRequest, NextResponse } from "next/server";

const SWEETLEASE_URL =
  process.env.SWEETLEASE_API_URL || "http://localhost:3000";

/**
 * Admin API proxy — forwards all /api/admin/* requests to SweetLease
 * so the browser never makes cross-origin requests.
 */
async function proxyAdmin(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const url = new URL(`/api/admin/${path}`, SWEETLEASE_URL);

  // Forward query params
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  // Build headers
  const headers: Record<string, string> = {};

  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers["content-type"] = contentType;
  }

  // Forward cookies (session token, etc.)
  const cookie = req.headers.get("cookie");
  const sitePassword = process.env.SWEETLEASE_SITE_PASSWORD;
  const siteAccessCookie = sitePassword
    ? `site_access=${Buffer.from(`${Date.now()}:${sitePassword}`).toString("base64")}`
    : "";
  headers["cookie"] = [cookie, siteAccessCookie].filter(Boolean).join("; ");

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
    redirect: "manual",
  };

  // Forward body for non-GET/HEAD requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      const body = await req.text();
      if (body) {
        fetchOptions.body = body;
      }
    } catch {
      // No body
    }
  }

  try {
    const response = await fetch(url.toString(), fetchOptions);

    // SweetLease redirects to /auth/signin when the session is invalid.
    // Detect this and return a 401 so the Hive client can handle it.
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location") || "";
      if (location.includes("/auth/signin") || location.includes("/login") || location.includes("/site-access")) {
        return NextResponse.json(
          { error: "Unauthorized", details: "SweetLease session is invalid or expired. Please sign in again." },
          { status: 401 }
        );
      }
    }

    const responseBody = await response.text();

    const proxyResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
    });

    // Forward response headers
    response.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower !== "transfer-encoding" && lower !== "content-encoding") {
        proxyResponse.headers.set(key, value);
      }
    });

    return proxyResponse;
  } catch (error) {
    console.error("[Hive Admin Proxy] Failed to reach SweetLease:", error);
    return NextResponse.json(
      {
        error: "Cannot reach SweetLease",
        details: `Failed to connect to ${SWEETLEASE_URL}. Is SweetLease running?`,
      },
      { status: 502 }
    );
  }
}

export const GET = proxyAdmin;
export const POST = proxyAdmin;
export const PUT = proxyAdmin;
export const PATCH = proxyAdmin;
export const DELETE = proxyAdmin;
