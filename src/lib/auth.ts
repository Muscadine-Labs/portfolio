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
  const secret =
    process.env.API_SECRET?.trim() ||
    process.env.PORTFOLIO_AUTH_SECRET?.trim() ||
    process.env.PORTFOLIO_PASSWORD;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "API_SECRET or PORTFOLIO_AUTH_SECRET must be set when NODE_ENV=production"
    );
  }
  return "portfolio-api-dev-secret";
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function sessionExpiryUnix(): number {
  return Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC;
}

/** Token format: `{exp}.{hmac}` — must match api-portfolio. */
export async function createSessionToken(tenant: string): Promise<string> {
  const exp = sessionExpiryUnix();
  const sig = await hmacToken(
    sessionSecret(),
    `${SESSION_PAYLOAD}:${tenant.toLowerCase()}:${exp}`
  );
  return `${exp}.${sig}`;
}

export async function createAdminSessionToken(): Promise<string> {
  const exp = sessionExpiryUnix();
  const sig = await hmacToken(sessionSecret(), `${ADMIN_SESSION_PAYLOAD}:${exp}`);
  return `${exp}.${sig}`;
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
    const dot = token.indexOf(".");
    if (dot <= 0) return false;
    const expStr = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
    const expected = await hmacToken(
      sessionSecret(),
      `${SESSION_PAYLOAD}:${tenant.toLowerCase()}:${exp}`
    );
    return timingSafeEqualString(sig, expected);
  } catch {
    return false;
  }
}

export async function verifyAdminSessionToken(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  try {
    const dot = token.indexOf(".");
    if (dot <= 0) return false;
    const expStr = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const exp = Number(expStr);
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
    const expected = await hmacToken(
      sessionSecret(),
      `${ADMIN_SESSION_PAYLOAD}:${exp}`
    );
    return timingSafeEqualString(sig, expected);
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
      return (
        trimmedUser.toLowerCase() === stored.username.toLowerCase() &&
        password === stored.password
      );
    }
  }

  if (isEnvAuthEnabled()) {
    const expectedUser = process.env.PORTFOLIO_USERNAME?.trim() ?? "";
    const expectedPass = process.env.PORTFOLIO_PASSWORD ?? "";
    return (
      trimmedUser.toLowerCase() === expectedUser.toLowerCase() &&
      password === expectedPass
    );
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
    `portfolio_demo=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  ];
}
