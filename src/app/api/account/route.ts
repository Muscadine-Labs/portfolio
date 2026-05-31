import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { setTenantCredentials } from "@/lib/account-credentials-store";

export async function POST(request: Request) {
  const headersList = await headers();
  const tenant =
    headersList.get("x-tenant")?.toLowerCase() ??
    process.env.DEV_TENANT?.toLowerCase() ??
    "nick";

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
