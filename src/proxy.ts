import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  isAuthRequiredForTenant,
  readTenantFromCookie,
  SESSION_COOKIE,
  verifyAdminSessionToken,
  verifySessionToken,
} from "@/lib/auth";
import { getHomeApiBaseUrl } from "@/lib/home-api";
import { isAppHostname } from "@/lib/site";

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
  const cookieHeader = request.headers.get("cookie");
  const tenantFromCookie = readTenantFromCookie(cookieHeader);
  const tenant =
    tenantFromCookie ??
    process.env.DEV_TENANT?.trim().toLowerCase() ??
    "workspace";

  if (tenantFromCookie) {
    requestHeaders.set("x-tenant", tenantFromCookie);
  }

  const adminSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAdmin = await verifyAdminSessionToken(adminSession);

  if (pathname.startsWith("/admin")) {
    if (!isAdmin && pathname !== "/admin/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (isAdmin && pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (pathname.startsWith("/api/admin")) {
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const authRequired = getHomeApiBaseUrl() ? true : isAuthRequiredForTenant(tenant);
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated =
    Boolean(tenantFromCookie) &&
    (await verifySessionToken(session, tenantFromCookie));

  if (authRequired) {
    if (
      !authenticated &&
      !isPublicPath(pathname) &&
      !pathname.startsWith("/api/auth") &&
      !pathname.startsWith("/api/admin")
    ) {
      const loginUrl = new URL("/login", request.url);
      if (pathname !== "/") {
        loginUrl.searchParams.set("from", pathname);
      }
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
    if (authRequired && !authenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url), {
      headers: requestHeaders,
    });
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
