import {
  getTenantCredentials,
  hasTenantCredentials,
} from "@/lib/account-credentials-store";

const SESSION_PAYLOAD = "portfolio-session";

export const SESSION_COOKIE = "portfolio_session";
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

async function hmacToken(secret: string): Promise<string> {
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
    new TextEncoder().encode(SESSION_PAYLOAD)
  );
  return bytesToBase64Url(sig);
}

async function getSessionSecretForTenant(tenant: string | null): Promise<string> {
  const explicit = process.env.PORTFOLIO_AUTH_SECRET?.trim();
  if (explicit) return explicit;
  if (isEnvAuthEnabled()) return process.env.PORTFOLIO_PASSWORD ?? "";
  if (tenant) {
    const stored = getTenantCredentials(tenant);
    if (stored?.password) return stored.password;
  }
  return "";
}

export async function createSessionToken(tenant: string | null): Promise<string> {
  const secret = await getSessionSecretForTenant(tenant);
  return hmacToken(secret || "portfolio-fallback");
}

/** @deprecated Use isAuthRequiredForTenant */
export function isAuthEnabled(): boolean {
  return isEnvAuthEnabled();
}

export function isAuthRequiredForTenant(tenant: string | null): boolean {
  if (isEnvAuthEnabled()) return true;
  if (!tenant) return false;
  return hasTenantCredentials(tenant);
}

export async function verifySessionToken(
  token: string | undefined | null,
  tenant: string | null
): Promise<boolean> {
  if (!isAuthRequiredForTenant(tenant)) return true;
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

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SEC,
  };
}
