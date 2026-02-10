import { NextRequest, NextResponse } from "next/server";

const SENTRY_API = "https://sentry.io/api/0";
const SENTRY_TOKEN = process.env.SENTRY_AUTH_TOKEN || "";
const SENTRY_ORG = process.env.SENTRY_ORG || "sweetlease";
const SENTRY_PROJECT = process.env.SENTRY_PROJECT || "sweetlease";

/**
 * Sentry API proxy — keeps the auth token server-side.
 *
 * Supported paths:
 *   /api/sentry/issues            → project issues
 *   /api/sentry/issues/{id}       → single issue detail
 *   /api/sentry/issues/{id}/events → events for an issue
 *   /api/sentry/stats             → org stats
 */
async function proxySentry(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  if (!SENTRY_TOKEN) {
    return NextResponse.json(
      { error: "SENTRY_AUTH_TOKEN not configured" },
      { status: 500 }
    );
  }

  const segments = params.path;
  let sentryUrl: string;

  if (segments[0] === "stats") {
    sentryUrl = `${SENTRY_API}/organizations/${SENTRY_ORG}/stats_v2/`;
  } else if (segments[0] === "issues" && segments.length === 1) {
    sentryUrl = `${SENTRY_API}/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/issues/`;
  } else if (segments[0] === "issues" && segments.length >= 2) {
    const rest = segments.slice(1).join("/");
    sentryUrl = `${SENTRY_API}/issues/${rest}/`;
  } else {
    sentryUrl = `${SENTRY_API}/projects/${SENTRY_ORG}/${SENTRY_PROJECT}/${segments.join("/")}/`;
  }

  const url = new URL(sentryUrl);
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      method: req.method,
      headers: {
        Authorization: `Bearer ${SENTRY_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.text();

    const proxyResponse = new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
      },
    });

    const linkHeader = response.headers.get("link");
    if (linkHeader) {
      proxyResponse.headers.set("x-sentry-link", linkHeader);
    }

    return proxyResponse;
  } catch (error) {
    console.error("[Sentry Proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to reach Sentry API" },
      { status: 502 }
    );
  }
}

export const GET = proxySentry;
