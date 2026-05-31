import { NextResponse } from "next/server";
import { validatePortfolioPayload } from "@/lib/portfolio-data";
import { proxyToHomeApi } from "@/lib/home-api";

/** POST — validate and replace portfolio via home API. */
export async function POST(request: Request) {
  const proxied = await proxyToHomeApi(request, "/api/import");
  if (proxied) return proxied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validatePortfolioPayload(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(
    { error: "Home API not configured (set API_URL)." },
    { status: 503 }
  );
}
