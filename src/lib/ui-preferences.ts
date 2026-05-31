import type { NavPageKey, UiPreferences } from "@/types";

export const PLAN_TAB_IDS = ["income", "budget", "goals", "wallets"] as const;
export type PlanTabId = (typeof PLAN_TAB_IDS)[number];

export const NAV_PAGE_LABELS: Record<NavPageKey, string> = {
  assets: "Assets",
  cash: "Cash",
  liabilities: "Liabilities",
  plan: "Plan",
};

export const PLAN_TAB_LABELS: Record<PlanTabId, string> = {
  income: "Income",
  wallets: "Wallets",
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
  return PLAN_TAB_IDS.filter((id) => prefs.planTabs[id]);
}

export function getDefaultPlanTab(prefs: UiPreferences): PlanTabId | null {
  const visible = getVisiblePlanTabs(prefs);
  return visible[0] ?? null;
}

export function resolvePlanTabFromUrl(tabParam: string | null): PlanTabId | null {
  if (tabParam === "guide") return "income";
  if (tabParam && PLAN_TAB_IDS.includes(tabParam as PlanTabId)) {
    return tabParam as PlanTabId;
  }
  return tabParam ? null : "income";
}

/** One-line label for Settings navigation summary. */
export function formatNavSummary(prefs: UiPreferences): string {
  const pages = (Object.keys(NAV_PAGE_LABELS) as NavPageKey[])
    .filter((p) => prefs.navPages[p])
    .map((p) => NAV_PAGE_LABELS[p]);
  if (pages.length === 0) return "All pages hidden";
  if (!prefs.navPages.plan) return pages.join(", ");
  const tabs = getVisiblePlanTabs(prefs).map((id) => PLAN_TAB_LABELS[id]);
  const planPart =
    tabs.length > 0 ? `Plan (${tabs.join(", ")})` : "Plan (no tabs)";
  const rest = pages.filter((p) => p !== "Plan");
  return rest.length > 0 ? `${rest.join(", ")} · ${planPart}` : planPart;
}
