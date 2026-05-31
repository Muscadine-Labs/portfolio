import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import {
  changeTenantPassword,
  getCredentialSource,
  getTenantCredentials,
  setInitialTenantPassword,
  updateTenantUsername,
} from "@/lib/account-credentials-store";
import { isEnvAuthEnabled, isAuthRequiredForTenant, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";
import { proxyToHomeApi } from "@/lib/home-api";

async function resolveTenant(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-tenant")?.toLowerCase() ??
    process.env.DEV_TENANT?.toLowerCase() ??
    "workspace"
  );
}

async function requireSession(tenant: string): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(session, tenant);
}

export async function GET(request: Request) {
  const proxied = await proxyToHomeApi(request, "/api/account/password");
  if (proxied) return proxied;

  const tenant = await resolveTenant();
  const source = getCredentialSource(tenant, isEnvAuthEnabled());
  const stored = getTenantCredentials(tenant);
  const envUsername = process.env.PORTFOLIO_USERNAME?.trim() ?? "";

  const username = stored?.username ?? envUsername;
  const hasPassword = Boolean(
    stored?.password || (source === "env" && process.env.PORTFOLIO_PASSWORD)
  );
  const canViewPassword = source === "app" && Boolean(stored?.password);
  const canEditUsername = source !== "env";

  if (canViewPassword && isAuthRequiredForTenant(tenant)) {
    const authed = await requireSession(tenant);
    if (!authed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.json({
    username,
    hasPassword,
    source,
    canViewPassword,
    canEditUsername,
    password: canViewPassword ? stored!.password : undefined,
  });
}

export async function PATCH(request: Request) {
  const proxied = await proxyToHomeApi(request, "/api/account/password");
  if (proxied) return proxied;

  const tenant = await resolveTenant();
  const source = getCredentialSource(tenant, isEnvAuthEnabled());

  if (source === "env") {
    return NextResponse.json(
      {
        error:
          "Sign-in is managed via server environment variables and cannot be changed here.",
      },
      { status: 403 }
    );
  }

  let body: {
    username?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const username = body.username?.trim() ?? "";
  const newPassword = body.newPassword?.trim() ?? "";
  const confirmPassword = body.confirmPassword?.trim() ?? "";
  const currentPassword = body.currentPassword ?? "";
  const updatingPassword = newPassword.length > 0 || confirmPassword.length > 0;

  if (!username) {
    return NextResponse.json({ error: "Username is required." }, { status: 400 });
  }

  const stored = getTenantCredentials(tenant);
  const existingUsername = stored?.username ?? "";
  const usernameChanged = username !== existingUsername;

  if (!usernameChanged && !updatingPassword) {
    return NextResponse.json({ ok: true, username: existingUsername || username });
  }

  if (stored?.password) {
    if (!currentPassword || currentPassword !== stored.password) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
  }

  if (usernameChanged) {
    const usernameResult = updateTenantUsername(tenant, username);
    if (!usernameResult.ok) {
      return NextResponse.json({ error: usernameResult.error }, { status: 400 });
    }
  }

  if (!updatingPassword) {
    return NextResponse.json({ ok: true, username });
  }

  if (!newPassword) {
    return NextResponse.json({ error: "New password is required." }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "New passwords do not match." }, { status: 400 });
  }

  const passwordResult = stored?.password
    ? changeTenantPassword(tenant, currentPassword, newPassword)
    : setInitialTenantPassword(tenant, newPassword);

  if (!passwordResult.ok) {
    return NextResponse.json({ error: passwordResult.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, username });
}
