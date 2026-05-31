/** Goal progress helpers only — portfolio rows live in `portfolio-data.ts` (gitignored). */
import { getMarketValue } from "@/lib/utils";
import type {
  Asset,
  CashAccount,
  Liability,
  PlanningItem,
  PortfolioSection,
} from "@/types";

import type { GoalTrackPage } from "@/types";

export type { GoalTrackPage };

export function isGoalLinkedToPortfolio(item: PlanningItem): boolean {
  return Boolean(item.trackPage && item.trackSectionId);
}

export function getSectionTotal(
  page: GoalTrackPage,
  sectionId: string,
  data: {
    assets: Asset[];
    cashAccounts: CashAccount[];
    liabilities: Liability[];
  }
): number {
  switch (page) {
    case "assets":
      return data.assets
        .filter((a) => a.sectionId === sectionId)
        .reduce((sum, a) => sum + getMarketValue(a), 0);
    case "cash":
      return data.cashAccounts
        .filter((c) => c.sectionId === sectionId)
        .reduce((sum, c) => sum + c.balance, 0);
    case "liabilities":
      return data.liabilities
        .filter((l) => l.sectionId === sectionId)
        .reduce((sum, l) => sum + l.balance, 0);
  }
}

/** Resolved current amount: linked section total or manual entry. */
export function resolveGoalCurrentAmount(
  item: PlanningItem,
  data: {
    assets: Asset[];
    cashAccounts: CashAccount[];
    liabilities: Liability[];
  }
): number | undefined {
  if (item.trackPage && item.trackSectionId) {
    return getSectionTotal(item.trackPage, item.trackSectionId, data);
  }
  return item.currentAmount;
}

export function getLinkedSectionLabel(
  sections: PortfolioSection[],
  item: { trackPage?: GoalTrackPage; trackSectionId?: string }
): string | null {
  if (!item.trackPage || !item.trackSectionId) return null;
  const section = sections.find(
    (s) => s.page === item.trackPage && s.id === item.trackSectionId
  );
  if (!section) return null;
  const pageLabel =
    item.trackPage === "assets"
      ? "Assets"
      : item.trackPage === "cash"
        ? "Cash"
        : "Liabilities";
  return `${pageLabel} · ${section.label}`;
}

export function goalProgressPercent(
  current: number | undefined,
  target: number | undefined
): number | undefined {
  if (target == null || target <= 0 || current == null) return undefined;
  return Math.min(100, (current / target) * 100);
}
