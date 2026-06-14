import { DEFAULT_OVERVIEW_CHART } from "@/lib/overview-chart";
import { DEFAULT_OVERVIEW_WIDGETS } from "@/lib/overview-widgets";
import type {
  AllocationNode,
  IncomePlanConfig,
  NetWorthSnapshot,
  PortfolioSection,
  SectionGroup,
  UiPreferences,
  WalletMapNode,
} from "@/types";
import type { Asset, CashAccount, Liability, PlanningItem, SpendingItem } from "@/types";

/** Empty defaults when API is unreachable (should not happen in normal dev). */
export const EMPTY_SECTIONS: PortfolioSection[] = [];

/** Default Plan page sections so goals/budget items can be saved on first use. */
export const DEFAULT_PLAN_SECTIONS: PortfolioSection[] = [
  { id: "sec-goals", page: "planning", label: "Goals", order: 0 },
  { id: "sec-budget", page: "spending", label: "Monthly Budget", order: 0 },
];

/** Ensure every portfolio has at least one planning and spending section. */
export function ensureDefaultPlanSections(sections: PortfolioSection[]): PortfolioSection[] {
  const hasPlanning = sections.some((s) => s.page === "planning");
  const hasSpending = sections.some((s) => s.page === "spending");
  if (hasPlanning && hasSpending) return sections;
  const next = [...sections];
  if (!hasPlanning) {
    next.push({
      ...DEFAULT_PLAN_SECTIONS[0],
      order: next.filter((s) => s.page === "planning").length,
    });
  }
  if (!hasSpending) {
    next.push({
      ...DEFAULT_PLAN_SECTIONS[1],
      order: next.filter((s) => s.page === "spending").length,
    });
  }
  return next;
}
export const EMPTY_SECTION_GROUPS: SectionGroup[] = [];
export const EMPTY_ASSETS: Asset[] = [];
export const EMPTY_CASH_ACCOUNTS: CashAccount[] = [];
export const EMPTY_LIABILITIES: Liability[] = [];
export const EMPTY_PLANNING_ITEMS: PlanningItem[] = [];
export const EMPTY_SPENDING_ITEMS: SpendingItem[] = [];
export const EMPTY_ALLOCATION_NODES: AllocationNode[] = [];
export const EMPTY_WALLET_MAP_NODES: WalletMapNode[] = [];
export const EMPTY_NET_WORTH_HISTORY: NetWorthSnapshot[] = [];

export const EMPTY_INCOME_PLAN: IncomePlanConfig = {
  description: "",
};

export const EMPTY_UI_PREFERENCES: UiPreferences = {
  theme: "system",
  navPages: {
    overview: true,
    assets: true,
    cash: true,
    liabilities: true,
    wallets: true,
    plan: true,
  },
  planTabs: {
    income: true,
    wallets: false,
    budget: true,
    goals: true,
  },
  overviewChart: DEFAULT_OVERVIEW_CHART,
  overviewWidgets: DEFAULT_OVERVIEW_WIDGETS,
  sidebarCompact: false,
  monthlyAutoSnapshot: false,
  netWorthSnapshotCadence: "month",
};
