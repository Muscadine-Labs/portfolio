import {
  getTenantCredentials,
  hasTenantCredentials,
} from "@/lib/account-credentials-store";
import { getHomeApiBaseUrl } from "@/lib/home-api";

const SESSION_PAYLOAD = "portfolio-api-session";
const ADMIN_SESSION_PAYLOAD = "portfolio-api-admin";

export const SESSION_COOKIE = "portfolio_session";
export const TENANT_COOKIE = "portfolio_tenant";
export const ADMIN_SESSION_COOKIE = "portfolio_admin";
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;

export function isEnvAuthEnabled(): boolean {
  const username = process.env.PORTFOLIO_USERNAME?.trim();
  const password = process.env.PORTFOLIO_PASSWORD;
  return Boolean(username && password);
}

function bytesToBase64Url(bytes: ArrayBuffer): string {
  const chars = Array.from(new Uint8Array(bytes), (b) => String.fromCharCode(b)).join("");
  return btoa(chars).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmacToken(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload)
  );
  return bytesToBase64Url(sig);
}

function sessionSecret(): string {
  return (
    process.env.API_SECRET?.trim() ||
    process.env.PORTFOLIO_AUTH_SECRET?.trim() ||
    process.env.PORTFOLIO_PASSWORD ||
    "portfolio-api-dev-secret"
  );
}

export async function createSessionToken(tenant: string): Promise<string> {
  return hmacToken(sessionSecret(), `${SESSION_PAYLOAD}:${tenant.toLowerCase()}`);
}

export async function createAdminSessionToken(): Promise<string> {
  return hmacToken(sessionSecret(), ADMIN_SESSION_PAYLOAD);
}

export function isAuthEnabled(): boolean {
  return isAuthRequiredForTenant(null);
}

export function isAuthRequiredForTenant(tenant: string | null): boolean {
  if (getHomeApiBaseUrl()) return true;
  if (isEnvAuthEnabled()) return true;
  if (!tenant) return false;
  return hasTenantCredentials(tenant);
}

export async function verifySessionToken(
  token: string | undefined | null,
  tenant: string | null
): Promise<boolean> {
  if (!tenant) return false;
  if (!isAuthRequiredForTenant(tenant) && !getHomeApiBaseUrl()) return true;
  if (!token) return false;
  try {
    const expected = await createSessionToken(tenant);
    if (token.length !== expected.length) return false;
    let mismatch = 0;
    for (let i = 0; i < token.length; i++) {
      mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  try {
    const expected = await createAdminSessionToken();
    if (token.length !== expected.length) return false;
    let mismatch = 0;
    for (let i = 0; i < token.length; i++) {
      mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

export function validateCredentials(
  username: string,
  password: string,
  tenant: string | null
): boolean {
  if (!isAuthRequiredForTenant(tenant)) return true;

  const trimmedUser = username.trim();

  if (tenant) {
    const stored = getTenantCredentials(tenant);
    if (stored?.username && stored?.password) {
      return trimmedUser === stored.username && password === stored.password;
    }
  }

  if (isEnvAuthEnabled()) {
    const expectedUser = process.env.PORTFOLIO_USERNAME?.trim() ?? "";
    const expectedPass = process.env.PORTFOLIO_PASSWORD ?? "";
    return trimmedUser === expectedUser && password === expectedPass;
  }

  return false;
}

export function readTenantFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)portfolio_tenant=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]).toLowerCase() : null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}

export function clearAuthCookieHeaders(): string[] {
  return [
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    `${TENANT_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  ];
}
