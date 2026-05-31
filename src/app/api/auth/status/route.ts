import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { isAuthRequiredForTenant, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { proxyToHomeApi } from "@/lib/home-api";

export async function GET(request: Request) {
  const proxied = await proxyToHomeApi(request, "/api/auth/status");
  if (proxied) return proxied;

  const headersList = await headers();
  const tenant =
    headersList.get("x-tenant")?.toLowerCase() ??
    process.env.DEV_TENANT?.toLowerCase() ??
    null;

  const enabled = isAuthRequiredForTenant(tenant);
  if (!enabled) {
    return NextResponse.json({ enabled: false, authenticated: true });
  }
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return NextResponse.json({
    enabled: true,
    authenticated: await verifySessionToken(token, tenant),
  });
}
