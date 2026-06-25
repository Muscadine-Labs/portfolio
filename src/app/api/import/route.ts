import { NextResponse } from "next/server";
import { validatePortfolioPayload } from "@/lib/portfolio-data";
import { proxyToHomeApi } from "@/lib/home-api";

/** POST — validate and replace portfolio via home API. */
export async function POST(request: Request) {
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

  const proxied = await proxyToHomeApi(
    new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(result.data),
    }),
    "/api/import"
  );
  if (proxied) return proxied;

  return NextResponse.json(
    { error: "Home API not configured (set API_URL)." },
    { status: 503 }
  );
}
