import { EMPTY_UI_PREFERENCES } from "@/lib/portfolio-empty";
import { normalizeOverviewChart } from "@/lib/overview-chart";
import { normalizeOverviewWidgets } from "@/lib/overview-widgets";
import { normalizeThemePreference } from "@/lib/theme-preference";
import type { UiPreferences } from "@/types";

const STORAGE_PREFIX = "portfolio.sidebarCompact.";

function storageKey(tenant: string): string {
  return `${STORAGE_PREFIX}${tenant.trim().toLowerCase() || "default"}`;
}

export function readSidebarCompactFromStorage(tenant: string): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(tenant));
    if (raw === "1") return true;
    if (raw === "0") return false;
    return null;
  } catch {
    return null;
  }
}

export function writeSidebarCompactToStorage(tenant: string, compact: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(tenant), compact ? "1" : "0");
  } catch {
    /* private browsing / quota */
  }
}

/** Prefer saved API value; fall back to this browser's last choice. */
export function resolveSidebarCompact(
  fromApi: boolean | undefined,
  tenant: string
): boolean {
  if (typeof fromApi === "boolean") return fromApi;
  return readSidebarCompactFromStorage(tenant) ?? false;
}

export function normalizeUiPreferences(
  prefs: UiPreferences | undefined,
  tenant: string
): UiPreferences {
  const base = prefs ?? EMPTY_UI_PREFERENCES;
  return {
    ...EMPTY_UI_PREFERENCES,
    ...base,
    theme: normalizeThemePreference(base.theme),
    overviewChart: normalizeOverviewChart(base.overviewChart),
    overviewWidgets: normalizeOverviewWidgets(base.overviewWidgets),
    sidebarCompact: resolveSidebarCompact(base.sidebarCompact, tenant),
    monthlyAutoSnapshot:
      typeof base.monthlyAutoSnapshot === "boolean" ? base.monthlyAutoSnapshot : false,
  };
}
