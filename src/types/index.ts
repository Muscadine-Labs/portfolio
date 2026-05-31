/** @deprecated Use dynamic section IDs — kept for seed data compatibility */
export enum AssetCategory {
  STOCKS = "stocks",
  ROTH_IRA = "roth_ira",
  REAL_ESTATE = "real_estate",
  PLAN_529 = "529_plan",
  COMMODITIES = "commodities",
  CRYPTO_BITCOIN = "crypto_bitcoin",
  CRYPTO_EXCHANGES = "crypto_exchanges",
  /** @deprecated Legacy import IDs — use wallet-linked asset sections instead */
  CRYPTO_DEFI_COLD = "crypto_defi_cold",
  /** @deprecated Legacy import IDs — use wallet-linked asset sections instead */
  CRYPTO_DEFI_STRATEGIES = "crypto_defi_strategies",
}

export type PageType =
  | "assets"
  | "cash"
  | "liabilities"
  | "planning"
  | "spending";

export type NavPageKey = "assets" | "cash" | "liabilities" | "plan";

export type OverviewChartLineType =
  | "monotone"
  | "linear"
  | "natural"
  | "step"
  | "stepBefore"
  | "stepAfter";

export interface OverviewChartPreferences {
  showBar: boolean;
  showLine: boolean;
  barColor: string;
  lineColor: string;
  lineType: OverviewChartLineType;
  showCostBasisLine: boolean;
  costBasisLineColor: string;
}

export type WalletChain = "ethereum" | "base" | "bitcoin" | "solana" | "other";

import type { ThemePreference } from "@/lib/theme-preference";

export type { ThemePreference };

/** Sidebar & overview visibility (mock now; per-tenant API later). */
export interface UiPreferences {
  /** `system` = Auto (match OS). Stored in seed / import; synced to next-themes in the app. */
  theme: ThemePreference;
  navPages: {
    assets: boolean;
    cash: boolean;
    liabilities: boolean;
    plan: boolean;
  };
  planTabs: {
    income: boolean;
    wallets: boolean;
    budget: boolean;
    goals: boolean;
  };
  overviewChart: OverviewChartPreferences;
  /** Icon-only sidebar on desktop — persisted per user. */
  sidebarCompact: boolean;
  /** When enabled, the home API records net worth on the 1st of each month. */
  monthlyAutoSnapshot: boolean;
}

export type SectionGroupPage = "assets" | "cash" | "liabilities";

/** Named roll-up bucket (Overview + grouped Assets/Cash/Liabilities pages). */
export interface SectionGroup {
  id: string;
  page: SectionGroupPage;
  name: string;
  order: number;
}

export interface SectionMetadata {
  /** Show DeFi collateral / LTV columns for liability sections */
  isDefi?: boolean;
  /** Show network / exchange columns for crypto asset sections */
  isCrypto?: boolean;
  /**
   * @deprecated Wallet linking removed — ignored on save
   */
  walletId?: string;
  /** Custodian or provider, e.g. Fidelity, Coinbase */
  account?: string;
  /** @deprecated Migrated to sectionGroups + groupId */
  overviewGroup?: string;
}

export interface PortfolioSection {
  id: string;
  page: PageType;
  label: string;
  order: number;
  /** SectionGroup.id on the same page */
  groupId?: string;
  metadata?: SectionMetadata;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  sectionId: string;
  price: number;
  quantity: number;
  costBasis?: number;
  /** Chain for this position when the section is wallet-based (e.g. Base, Ethereum). */
  network?: string;
  protocol?: string;
  walletId?: string;
}

export interface CashAccount {
  id: string;
  name: string;
  sectionId: string;
  balance: number;
  originalAmount?: number;
  interest?: number;
  protocol?: string;
  address?: string;
  walletId?: string;
}

export interface Liability {
  id: string;
  name: string;
  sectionId: string;
  /** Current total debt (balance owed now). */
  balance: number;
  initialBalance?: number;
  interestAccrued?: number;
  /** Annual percentage yield (e.g. 6.5 for 6.5%). */
  apy?: number;
  collateral?: number;
  lltv?: number;
  ltv?: number;
  liquidationPrice?: number;
  address?: string;
  walletId?: string;
}

export type GoalTrackPage = "assets" | "cash" | "liabilities";

export interface PlanningItem {
  id: string;
  sectionId: string;
  title: string;
  targetAmount?: number;
  /** Used when not linked to a portfolio section; ignored when `trackPage` is set. */
  currentAmount?: number;
  targetDate?: string;
  notes?: string;
  status: "not_started" | "in_progress" | "completed";
  /** Auto-update current from this assets / cash / liabilities section total. */
  trackPage?: GoalTrackPage;
  trackSectionId?: string;
}

export interface SpendingItem {
  id: string;
  sectionId: string;
  name: string;
  budget: number;
  spent: number;
  frequency: "monthly" | "weekly" | "yearly" | "one_time";
  notes?: string;
}

/** Plan → Income tab intro (mock/API-backed, user-editable). */
export interface IncomePlanConfig {
  description: string;
}

/** Nested income / investing allocation target (percent is of parent node). */
export interface AllocationNode {
  id: string;
  parentId: string | null;
  label: string;
  percentOfParent: number;
  order: number;
  notes?: string;
  /** Percent of parent/income (default) or fixed monthly dollar amount. */
  targetMode?: "percent" | "amount";
  /** Fixed $/mo when targetMode is "amount". */
  monthlyAmount?: number;
  /** Compare plan $/mo to live total in this portfolio section. */
  trackPage?: GoalTrackPage;
  trackSectionId?: string;
}

export type WalletType =
  | "family_master"
  | "person_master"
  | "bitcoin_cold"
  | "crypto_cold"
  | "defi_cold"
  | "defi_onchain"
  | "hot"
  | "dev"
  | "other";

/** BIP-85 / Start9 wallet hierarchy plus on-chain addresses (no secrets stored here). */
export interface WalletMapNode {
  id: string;
  parentId: string | null;
  label: string;
  order: number;
  /** Optional role label for imports (deprecated in UI — avoid real names). */
  owner?: string;
  walletType?: WalletType;
  /** On-chain address for sync and portfolio linking. */
  address?: string;
  /** @deprecated Migrated to `address` on load. */
  identifier?: string;
  /** Chains this address is used on (e.g. Ethereum + Base for the same EVM address). */
  networks?: WalletChain[];
  /** Target sections when running Morpho sync. */
  links?: {
    assetsSectionId?: string;
    cashSectionId?: string;
    liabilitiesSectionId?: string;
  };
  /** active = in use; planned = reserved slot not yet created */
  status: "active" | "planned";
  notes?: string;
}

export interface NetWorthSnapshot {
  period: string;
  netWorth: number;
  totalAssets?: number;
  totalLiabilities?: number;
  /** Sum of asset cost basis at snapshot time (investments only). */
  totalCostBasis?: number;
}

export interface AssetAllocation {
  category: string;
  value: number;
  color: string;
}

export interface User {
  id: string;
  /** Internal workspace slug for data scoping (not a DNS subdomain). */
  tenant: string;
  displayName: string;
  email: string;
  username?: string;
  /** Session-only; persisted server-side via /api/account when saved */
  password?: string;
}

export interface PortfolioKpis {
  totalNetWorth: number;
  totalAssets: number;
  totalCash: number;
  totalLiabilities: number;
  netGain: number;
  netGainPercent: number;
}

export interface AnalyticsCategoryRow {
  category: string;
  value: number;
  percentOfTotal: number;
}

export interface BitcoinBreakdown {
  walletType: string;
  value: number;
  percent: number;
}
