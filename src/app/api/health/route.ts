import { NextResponse } from "next/server";
import { getHomeApiBaseUrl } from "@/lib/home-api";

export const dynamic = "force-dynamic";

type ApiHealth = {
  service?: string;
  version?: string;
  status?: string;
};

/** GET — home API health (JSON via NextResponse; raw proxy Response was empty on Vercel). */
export async function GET() {
  const base = getHomeApiBaseUrl();
  if (!base) {
    return NextResponse.json(
      { error: "Home API not configured (set API_URL)." },
      { status: 503 }
    );
  }

  try {
    const upstream = await fetch(`${base}/api/health`, { cache: "no-store" });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Home API unreachable", status: upstream.status },
        { status: 502 }
      );
    }
    const data = (await upstream.json()) as ApiHealth;
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/health proxy failed", error);
    return NextResponse.json({ error: "Home API unreachable" }, { status: 502 });
  }
}
