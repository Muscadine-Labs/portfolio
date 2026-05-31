import { NextResponse } from "next/server";
import { proxyToHomeApi } from "@/lib/home-api";

/** POST — refresh asset prices from Finnhub via home API. */
export async function POST(request: Request) {
  const proxied = await proxyToHomeApi(request, "/api/market/quotes");
  if (proxied) return proxied;

  return NextResponse.json(
    { error: "Home API not configured (set API_URL)." },
    { status: 503 }
  );
}
