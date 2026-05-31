/** In-memory credentials per tenant (mock until API persistence). */
const credentialsByTenant = new Map<string, { username: string; password: string }>();

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
  if (!nextPassword) {
    credentialsByTenant.delete(slug);
    return;
  }
  credentialsByTenant.set(slug, { username: trimmedUser, password: nextPassword });
}

export function getTenantCredentials(tenant: string) {
  return credentialsByTenant.get(tenant.toLowerCase());
}

export function hasTenantCredentials(tenant: string): boolean {
  const creds = getTenantCredentials(tenant);
  return Boolean(creds?.username && creds?.password);
}
