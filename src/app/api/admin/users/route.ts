import { proxyToHomeApi } from "@/lib/home-api";

export async function GET(request: Request) {
  const proxied = await proxyToHomeApi(request, "/api/admin/users");
  if (proxied) return proxied;
  return Response.json({ error: "Home API not configured" }, { status: 503 });
}

export async function POST(request: Request) {
  const proxied = await proxyToHomeApi(request, "/api/admin/users");
  if (proxied) return proxied;
  return Response.json({ error: "Home API not configured" }, { status: 503 });
}

export async function PATCH(request: Request) {
  const proxied = await proxyToHomeApi(request, "/api/admin/users");
  if (proxied) return proxied;
  return Response.json({ error: "Home API not configured" }, { status: 503 });
}

export async function DELETE(request: Request) {
  const proxied = await proxyToHomeApi(request, "/api/admin/users");
  if (proxied) return proxied;
  return Response.json({ error: "Home API not configured" }, { status: 503 });
}
