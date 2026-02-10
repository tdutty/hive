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

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
