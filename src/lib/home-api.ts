/**
 * Forward selected routes to the mini PC home API when API_URL is set.
 * Next.js rewrites do not override existing app/api route handlers.
 */
export function getHomeApiBaseUrl(): string | null {
  const base = process.env.API_URL?.trim().replace(/\/$/, "");
  return base || null;
}

export async function proxyToHomeApi(
  request: Request,
  path: string
): Promise<Response | null> {
  const base = getHomeApiBaseUrl();
  if (!base) return null;

  const incoming = new URL(request.url);
  const target = new URL(path, `${base}/`);
  target.search = incoming.search;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }

  return fetch(target, init);
}
