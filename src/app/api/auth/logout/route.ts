import { NextResponse } from "next/server";
import { clearAuthCookieHeaders } from "@/lib/auth";
import { proxyToHomeApi } from "@/lib/home-api";

export async function POST(request: Request) {
  const proxied = await proxyToHomeApi(request, "/api/auth/logout");
  if (proxied) return proxied;

  const response = NextResponse.json({ ok: true });
  for (const cookie of clearAuthCookieHeaders()) {
    response.headers.append("Set-Cookie", cookie);
  }
  return response;
}
