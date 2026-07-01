/** Canonical app hostname (no per-user subdomains). */
export const APP_HOST =
  process.env.NEXT_PUBLIC_APP_HOST?.trim() || "portfolio.muscadine.xyz";

export const APP_ORIGIN = `https://${APP_HOST}`;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

/** Hostnames that serve the portfolio app (login + dashboard on one URL). */
export function isAppHostname(hostname: string): boolean {
  const host = hostname.split(":")[0].toLowerCase();
  if (LOCAL_HOSTS.has(host)) return true;
  if (host === APP_HOST.toLowerCase()) return true;
  return false;
}

/** Internal workspace slug for data scoping (not derived from DNS). */
export function resolveWorkspaceTenant(hostname: string): string {
  const fromEnv = process.env.DEV_TENANT?.trim();
  if (fromEnv) return fromEnv.toLowerCase();
  const host = hostname.split(":")[0].toLowerCase();
  if (LOCAL_HOSTS.has(host)) return "workspace";
  return "workspace";
}
