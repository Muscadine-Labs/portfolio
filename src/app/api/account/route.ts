import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import {
  readTenantFromCookie,
  SESSION_COOKIE,
  verifySessionToken,
  isAuthRequiredForTenant,
} from "@/lib/auth";
import { setTenantCredentials } from "@/lib/account-credentials-store";
import { getHomeApiBaseUrl } from "@/lib/home-api";

export async function POST(request: Request) {
  if (getHomeApiBaseUrl()) {
    return NextResponse.json(
      { error: "Account credentials are managed by the home API." },
      { status: 404 }
    );
  }

  const headersList = await headers();
  const cookieHeader = headersList.get("cookie");
  const tenant =
    readTenantFromCookie(cookieHeader) ??
    headersList.get("x-tenant")?.toLowerCase() ??
    process.env.DEV_TENANT?.toLowerCase() ??
    "workspace";

  if (isAuthRequiredForTenant(tenant)) {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE)?.value;
    if (!(await verifySessionToken(session, tenant))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: {
    username?: string;
    password?: string;
  };
  try {
    body = (await request.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  setTenantCredentials(
    tenant,
    body.username ?? "",
    body.password?.length ? body.password : undefined
  );

  return NextResponse.json({ ok: true, tenant });
}
