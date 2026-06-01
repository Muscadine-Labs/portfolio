/**
 * Forward selected routes to the mini PC home API when API_URL is set.
 * Next.js rewrites do not override existing app/api route handlers.
 */
export function getHomeApiBaseUrl(): string | null {
  const base = process.env.API_URL?.trim().replace(/\/$/, "");
  return base || null;
}

/** Rebuild response so Set-Cookie and status pass through Next.js route handlers. */
async function toProxyResponse(upstream: Response): Promise<Response> {
  const body = await upstream.arrayBuffer();
  const headers = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "set-cookie" || lower === "content-length") return;
    headers.set(key, value);
  });

  const setCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : [];
  for (const cookie of setCookies) {
    headers.append("set-cookie", cookie);
  }

  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export async function proxyToHomeApi(
  request: Request,
  path: string
): Promise<Response | null> {
  const base = getHomeApiBaseUrl();
  if (!base) return null;

  try {
    const incoming = new URL(request.url);
    const target = new URL(path, `${base}/`);
    target.search = incoming.search;

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");
    headers.delete("content-length");

    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: "manual",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = await request.arrayBuffer();
    }

    const upstream = await fetch(target, init);
    return await toProxyResponse(upstream);
  } catch (error) {
    console.error("proxyToHomeApi failed", path, error);
    return Response.json({ error: "Home API unreachable" }, { status: 502 });
  }
}
