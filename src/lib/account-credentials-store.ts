/** In-memory credentials per tenant (mock until API persistence). */
const credentialsByTenant = new Map<string, { username: string; password: string }>();

export type CredentialSource = "app" | "env" | "none";

export function setTenantCredentials(
  tenant: string,
  username: string,
  password: string | undefined
): void {
  const slug = tenant.toLowerCase();
  const trimmedUser = username.trim();
  if (!trimmedUser) {
    credentialsByTenant.delete(slug);
    return;
  }
  const existing = credentialsByTenant.get(slug);
  const nextPassword = password?.length ? password : existing?.password ?? "";
  credentialsByTenant.set(slug, { username: trimmedUser, password: nextPassword });
}

export function getTenantCredentials(tenant: string) {
  return credentialsByTenant.get(tenant.toLowerCase());
}

export function hasTenantCredentials(tenant: string): boolean {
  const creds = getTenantCredentials(tenant);
  return Boolean(creds?.username && creds?.password);
}

export function getCredentialSource(
  tenant: string,
  envAuthEnabled: boolean
): CredentialSource {
  if (getTenantCredentials(tenant)) return "app";
  if (envAuthEnabled) return "env";
  return "none";
}

export function updateTenantUsername(
  tenant: string,
  username: string
): { ok: true } | { ok: false; error: string } {
  const trimmed = username.trim();
  if (!trimmed) {
    return { ok: false, error: "Username is required." };
  }
  const existing = getTenantCredentials(tenant);
  credentialsByTenant.set(tenant.toLowerCase(), {
    username: trimmed,
    password: existing?.password ?? "",
  });
  return { ok: true };
}

export function changeTenantPassword(
  tenant: string,
  currentPassword: string | undefined,
  newPassword: string
): { ok: true } | { ok: false; error: string } {
  const slug = tenant.toLowerCase();
  const creds = credentialsByTenant.get(slug);
  if (!creds?.username || !creds.password) {
    return { ok: false, error: "Enter a username first." };
  }

  if (currentPassword !== creds.password) {
    return { ok: false, error: "Current password is incorrect." };
  }

  const trimmed = newPassword.trim();
  if (trimmed.length < 8) {
    return { ok: false, error: "New password must be at least 8 characters." };
  }

  credentialsByTenant.set(slug, { ...creds, password: trimmed });
  return { ok: true };
}

export function setInitialTenantPassword(
  tenant: string,
  newPassword: string
): { ok: true } | { ok: false; error: string } {
  const slug = tenant.toLowerCase();
  const creds = credentialsByTenant.get(slug);
  if (!creds?.username) {
    return { ok: false, error: "Enter a username first." };
  }
  if (creds.password) {
    return { ok: false, error: "A password is already set. Enter your current password to change it." };
  }

  const trimmed = newPassword.trim();
  if (trimmed.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  credentialsByTenant.set(slug, { ...creds, password: trimmed });
  return { ok: true };
}
