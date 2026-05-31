import { NextResponse } from "next/server";
import { proxyToHomeApi } from "@/lib/home-api";

export async function GET(request: Request) {
  const proxied = await proxyToHomeApi(request, "/api/me");
  if (proxied) return proxied;
  return NextResponse.json(
    { error: "Home API not configured (set API_URL)." },
    { status: 503 }
  );
}
