import { NextResponse } from "next/server";
import { proxyToHomeApi } from "@/lib/home-api";

/** GET — home API health via same-origin proxy (avoids browser CORS). */
export async function GET(request: Request) {
  const proxied = await proxyToHomeApi(request, "/api/health");
  if (proxied) return proxied;
  return NextResponse.json(
    { error: "Home API not configured (set API_URL)." },
    { status: 503 }
  );
}
