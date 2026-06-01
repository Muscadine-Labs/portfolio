import { proxyToHomeApi, getHomeApiBaseUrl } from "@/lib/home-api";

export async function POST(request: Request) {
  if (getHomeApiBaseUrl()) {
    const proxied = await proxyToHomeApi(request, "/api/auth/login");
    return proxied ?? Response.json({ error: "Home API unreachable" }, { status: 502 });
  }

  return Response.json(
    { error: "Sign in unavailable — use Demo on the login page or contact support." },
    { status: 401 }
  );
}
