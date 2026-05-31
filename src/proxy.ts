import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthRequiredForTenant, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { isAppHostname, resolveWorkspaceTenant } from "@/lib/site";

const PUBLIC_PATHS = ["/login", "/terms", "/privacy", "/legal"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0];
  const pathname = request.nextUrl.pathname;

  if (!isAppHostname(hostname)) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  const tenant = resolveWorkspaceTenant(hostname);
  requestHeaders.set("x-tenant", tenant);

  if (isAuthRequiredForTenant(tenant)) {
    const session = request.cookies.get(SESSION_COOKIE)?.value;
    const authenticated = await verifySessionToken(session, tenant);

    if (!authenticated && !isPublicPath(pathname) && !pathname.startsWith("/api/auth")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (authenticated && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (pathname === "/analytics") {
    return NextResponse.redirect(new URL("/dashboard", request.url), {
      headers: requestHeaders,
    });
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url), {
      headers: requestHeaders,
    });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
