import { NextResponse } from "next/server";
import { clearAuthCookieHeaders } from "@/lib/auth";
import { demoCookieOptions, DEMO_COOKIE } from "@/lib/demo";

export async function POST() {
  const response = NextResponse.json({ ok: true, role: "demo", tenant: "demo" });
  for (const cookie of clearAuthCookieHeaders()) {
    response.headers.append("Set-Cookie", cookie);
  }
  response.cookies.set(DEMO_COOKIE, "1", demoCookieOptions());
  return response;
}
