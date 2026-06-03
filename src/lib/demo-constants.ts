export const DEMO_COOKIE = "portfolio_demo";
export const DEMO_TENANT = "demo";

export function isDemoTenant(tenant: string | undefined | null): boolean {
  return tenant?.toLowerCase() === DEMO_TENANT;
}
