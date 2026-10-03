import { NextRequest, NextResponse } from "next/server";

/**
 * Hive middleware — protects /admin routes.
 *
 * Checks for a NextAuth session cookie and redirects to /login if missing.
 * The real auth validation happens when the proxy forwards the cookie to
 * SweetLease, which verifies the JWT, role, email whitelist, and IP allowlist.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hive has no Server Actions. Scanners POST fake `Next-Action` ids at the app
  // (thousands so far); Next 14.1's action handler logs each one and, on
  // malformed bodies, crashes its own error logger ("Cannot read properties of
  // null (reading 'message')"). Refuse them before the action handler runs.
  if (request.headers.get("next-action") !== null) {
    return new NextResponse("Server actions are not supported", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    // Behind nginx, request.url is the internal address (https://localhost:3003), so build the
    // redirect from the public host nginx forwards; a relative-to-internal URL sent people to localhost.
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "https";
    const loginUrl = host && !/^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? new URL("/login", `${proto}://${host}`) : new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // run everywhere except static assets so the Server Action guard covers every route;
  // the /admin session check below still applies only to /admin paths
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
