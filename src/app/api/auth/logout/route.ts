import { NextResponse } from "next/server";
import { clearAuthCookieHeaders } from "@/lib/auth";
import { getHomeApiBaseUrl, proxyToHomeApi } from "@/lib/home-api";

export async function POST(request: Request) {
  if (getHomeApiBaseUrl()) {
    try {
      await proxyToHomeApi(request, "/api/auth/logout");
    } catch {
      // Home API offline — still clear local cookies below.
    }
  }

  const response = NextResponse.json({ ok: true });
  for (const cookie of clearAuthCookieHeaders()) {
    response.headers.append("Set-Cookie", cookie);
  }
  return response;
}
