import { NextResponse } from "next/server";
import { proxyToHomeApi } from "@/lib/home-api";

/** POST — sync one wallet. PUT — sync all enabled wallets. */
export async function POST(request: Request) {
  const proxied = await proxyToHomeApi(request, "/api/wallets/sync");
  if (proxied) return proxied;

  return NextResponse.json(
    { error: "Home API not configured (set API_URL)." },
    { status: 503 }
  );
}

export async function PUT(request: Request) {
  const proxied = await proxyToHomeApi(request, "/api/wallets/sync");
  if (proxied) return proxied;

  return NextResponse.json(
    { error: "Home API not configured (set API_URL)." },
    { status: 503 }
  );
}
