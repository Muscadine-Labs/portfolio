import { NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  createSessionToken,
  isAuthRequiredForTenant,
  SESSION_COOKIE,
  sessionCookieOptions,
  validateCredentials,
} from "@/lib/auth";
import { proxyToHomeApi } from "@/lib/home-api";

export async function POST(request: Request) {
  const proxied = await proxyToHomeApi(request, "/api/auth/login");
  if (proxied) return proxied;

  const headersList = await headers();
  const tenant =
    headersList.get("x-tenant")?.toLowerCase() ??
    process.env.DEV_TENANT?.toLowerCase() ??
    null;

  if (!isAuthRequiredForTenant(tenant)) {
    return NextResponse.json({ ok: true, authRequired: false });
  }

  let body: { username?: string; password?: string };
  try {
    body = (await request.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";

  if (!validateCredentials(username, password, tenant)) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  if (!tenant) {
    return NextResponse.json({ error: "Missing workspace" }, { status: 400 });
  }

  const token = await createSessionToken(tenant);
  const response = NextResponse.json({ ok: true, authRequired: true });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
