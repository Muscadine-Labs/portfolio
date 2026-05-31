import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { proxyToHomeApi } from "@/lib/home-api";

export async function POST(request: Request) {
  const proxied = await proxyToHomeApi(request, "/api/auth/logout");
  if (proxied) return proxied;

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
