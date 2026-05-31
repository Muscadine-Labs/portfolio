import { DEFAULT_OVERVIEW_CHART } from "@/lib/overview-chart";
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
    assets: true,
    cash: true,
    liabilities: true,
    plan: true,
  },
  planTabs: {
    income: true,
    wallets: true,
    budget: true,
    goals: true,
  },
  overviewChart: DEFAULT_OVERVIEW_CHART,
  sidebarCompact: false,
  monthlyAutoSnapshot: false,
};
