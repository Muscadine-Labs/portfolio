import type { UiPreferences } from "@/types";

/** Wallets sidebar: off by default for wyatt; on for other tenants. */
export function resolveWalletsNavVisible(
  prefs: Partial<UiPreferences> | undefined,
  tenant: string
): boolean {
  if (typeof prefs?.navPages?.wallets === "boolean") {
    return prefs.navPages.wallets;
  }
  const slug = tenant.trim().toLowerCase();
  if (slug === "wyatt") return false;
  if (prefs?.planTabs?.wallets === true) return true;
  return true;
}
