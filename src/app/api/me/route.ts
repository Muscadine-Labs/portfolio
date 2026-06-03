import { NextResponse } from "next/server";
import { getDemoAccount, getDemoPortfolioData } from "@/lib/demo-data";
import { isDemoSessionFromCookies } from "@/lib/demo";
import { proxyToHomeApi } from "@/lib/home-api";

export async function GET(request: Request) {
  if (await isDemoSessionFromCookies()) {
    return NextResponse.json({
      user: getDemoAccount(),
      portfolio: getDemoPortfolioData(),
    });
  }

  const proxied = await proxyToHomeApi(request, "/api/me");
  if (proxied) return proxied;
  return NextResponse.json(
    { error: "Home API not configured (set API_URL)." },
    { status: 503 }
  );
}
