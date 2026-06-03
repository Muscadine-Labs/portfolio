import type { NavPageKey, UiPreferences } from "@/types";

export const PLAN_TAB_IDS = ["income", "budget", "goals"] as const;
export type PlanTabId = (typeof PLAN_TAB_IDS)[number];

export const NAV_PAGE_LABELS: Record<NavPageKey, string> = {
  overview: "Overview",
  assets: "Assets",
  cash: "Cash",
  liabilities: "Liabilities",
  plan: "Plan",
  wallets: "Wallets",
};

export const NAV_PAGE_HREFS: Record<NavPageKey, string> = {
  overview: "/dashboard",
  assets: "/assets",
  cash: "/cash",
  liabilities: "/liabilities",
  plan: "/plan",
  wallets: "/wallets",
};

/** Sidebar page toggles (same order as the sidebar). */
export const SIDEBAR_NAV_PAGE_KEYS: NavPageKey[] = [
  "overview",
  "assets",
  "cash",
  "liabilities",
  "plan",
  "wallets",
];

export function getFirstVisibleNavHref(prefs: UiPreferences): string {
  for (const key of SIDEBAR_NAV_PAGE_KEYS) {
    if (isNavPageVisible(prefs, key)) return NAV_PAGE_HREFS[key];
  }
  return "/settings";
}

/** Plan page tabs controlled in Settings (not listed in the sidebar). */
export const PLAN_SETTINGS_TAB_IDS = ["income"] as const;
export type PlanSettingsTabId = (typeof PLAN_SETTINGS_TAB_IDS)[number];

export const PLAN_TAB_LABELS: Record<PlanTabId, string> = {
  income: "Income",
  budget: "Budget",
  goals: "Goals",
};

export function isNavPageVisible(prefs: UiPreferences, page: NavPageKey): boolean {
  return prefs.navPages[page];
}

export function isPlanTabVisible(prefs: UiPreferences, tab: PlanTabId): boolean {
  return prefs.navPages.plan && prefs.planTabs[tab];
}

export function getVisiblePlanTabs(prefs: UiPreferences): PlanTabId[] {
  if (!prefs.navPages.plan) return [];
  return PLAN_TAB_IDS.filter((id) => {
    if (id === "income") return prefs.planTabs.income;
    return true;
  });
}

export function getDefaultPlanTab(prefs: UiPreferences): PlanTabId | null {
  const visible = getVisiblePlanTabs(prefs);
  return visible[0] ?? null;
}

export function resolvePlanTabFromUrl(tabParam: string | null): PlanTabId | null {
  if (tabParam === "guide") return "income";
  if (tabParam === "wallets") return null;
  if (tabParam && PLAN_TAB_IDS.includes(tabParam as PlanTabId)) {
    return tabParam as PlanTabId;
  }
  return tabParam ? null : "income";
}

/** One-line label for Settings navigation summary. */
export function formatNavSummary(prefs: UiPreferences): string {
  const pages = SIDEBAR_NAV_PAGE_KEYS.filter((p) => prefs.navPages[p]).map(
    (p) => NAV_PAGE_LABELS[p]
  );
  if (pages.length === 0) return "All pages hidden";
  const parts = [...pages];
  if (prefs.navPages.plan && !prefs.planTabs.income) {
    parts.push("Plan (Income hidden)");
  }
  return parts.join(", ");
}
