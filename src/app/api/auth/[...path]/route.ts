import { NextRequest, NextResponse } from "next/server";

const SWEETLEASE_URL =
  process.env.SWEETLEASE_API_URL || "http://localhost:3000";

/**
 * Auth proxy — forwards all /api/auth/* requests to SweetLease
 * so Hive can authenticate against the same user database.
 */
async function proxyAuth(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/");
  const url = new URL(`/api/auth/${path}`, SWEETLEASE_URL);

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

  // Forward cookies (session token, CSRF, etc.)
  const cookie = req.headers.get("cookie");
  const sitePassword = process.env.SWEETLEASE_SITE_PASSWORD;
  const siteAccessCookie = sitePassword
    ? `site_access=${Buffer.from(sitePassword).toString("base64")}`
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

    // Forward Set-Cookie headers so session persists on the browser
    const setCookies = response.headers.getSetCookie?.();
    if (setCookies) {
      setCookies.forEach((c) => {
        proxyResponse.headers.append("set-cookie", c);
      });
    }

    return proxyResponse;
  } catch (error) {
    console.error("[Hive Auth Proxy] Failed to reach SweetLease:", error);
    return NextResponse.json(
      {
        error: "Cannot reach SweetLease",
        details: `Failed to connect to ${SWEETLEASE_URL}. Is SweetLease running?`,
      },
      { status: 502 }
    );
  }
}

export const GET = proxyAuth;
export const POST = proxyAuth;
