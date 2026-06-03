import type { PlanTabId } from "@/lib/ui-preferences";
import type { UiPreferences } from "@/types";
import { isPlanTabVisible } from "@/lib/ui-preferences";
import type { LucideIcon } from "lucide-react";
import { PiggyBank, Target } from "lucide-react";

export type PlanNavShortcut = {
  href: string;
  label: string;
  icon: LucideIcon;
  tab: PlanTabId;
};

export const PLAN_NAV_SHORTCUTS: PlanNavShortcut[] = [
  { href: "/plan?tab=budget", label: "Budget", icon: PiggyBank, tab: "budget" },
  { href: "/plan?tab=goals", label: "Goals", icon: Target, tab: "goals" },
];

export function getVisiblePlanNavShortcuts(prefs: UiPreferences): PlanNavShortcut[] {
  if (!prefs.navPages.plan) return [];
  return PLAN_NAV_SHORTCUTS.filter((item) => isPlanTabVisible(prefs, item.tab));
}
