"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getSectionsForPage, createSectionId } from "@/lib/sections";
import {
  EMPTY_ALLOCATION_NODES,
  EMPTY_ASSETS,
  EMPTY_CASH_ACCOUNTS,
  EMPTY_CONNECTED_WALLETS,
  EMPTY_INCOME_PLAN,
  EMPTY_LIABILITIES,
  EMPTY_NET_WORTH_HISTORY,
  EMPTY_PLANNING_ITEMS,
  EMPTY_SECTIONS,
  EMPTY_SPENDING_ITEMS,
  EMPTY_UI_PREFERENCES,
  EMPTY_WALLET_MAP_NODES,
} from "@/lib/portfolio-empty";
import type { MorphoSyncResult } from "@/lib/morpho";
import { isMorphoManagedId } from "@/lib/morpho";
import { normalizeOverviewChart } from "@/lib/overview-chart";
import { normalizeThemePreference } from "@/lib/theme-preference";
import type { PortfolioDataPayload, PortfolioImportResult } from "@/lib/portfolio-data";
import { normalizePortfolioEntityIds } from "@/lib/portfolio-data";
import { isFinnhubEligible } from "@/lib/finnhub";
import type {
  AllocationNode,
  Asset,
  CashAccount,
  ConnectedWallet,
  IncomePlanConfig,
  Liability,
  NetWorthSnapshot,
  OverviewChartPreferences,
  PageType,
  PlanningItem,
  PortfolioSection,
  SpendingItem,
  ThemePreference,
  UiPreferences,
  User,
  WalletMapNode,
} from "@/types";
import type { PlanTabId } from "@/lib/ui-preferences";
import type { NavPageKey } from "@/types";

interface PortfolioContextValue {
  sections: PortfolioSection[];
  assets: Asset[];
  cashAccounts: CashAccount[];
  liabilities: Liability[];
  planningItems: PlanningItem[];
  spendingItems: SpendingItem[];
  allocationNodes: AllocationNode[];
  incomePlan: IncomePlanConfig;
  setIncomePlanDescription: (description: string) => void;
  walletMapNodes: WalletMapNode[];
  netWorthHistory: NetWorthSnapshot[];
  monthlyIncome?: number;
  setMonthlyIncome: (value: number | undefined) => void;
  getSections: (page: PageType) => PortfolioSection[];
  upsertSection: (section: PortfolioSection) => void;
  deleteSection: (sectionId: string, page: PageType) => void;
  addSection: (page: PageType, label: string, metadata?: PortfolioSection["metadata"]) => PortfolioSection;
  upsertAsset: (asset: Asset) => void;
  deleteAsset: (id: string) => void;
  upsertCashAccount: (account: CashAccount) => void;
  deleteCashAccount: (id: string) => void;
  upsertLiability: (liability: Liability) => void;
  deleteLiability: (id: string) => void;
  upsertPlanningItem: (item: PlanningItem) => void;
  deletePlanningItem: (id: string) => void;
  upsertSpendingItem: (item: SpendingItem) => void;
  deleteSpendingItem: (id: string) => void;
  upsertAllocationNode: (node: AllocationNode) => void;
  deleteAllocationNode: (id: string) => void;
  upsertWalletMapNode: (node: WalletMapNode) => void;
  deleteWalletMapNode: (id: string) => void;
  uiPreferences: UiPreferences;
  setNavPageVisible: (page: NavPageKey, visible: boolean) => void;
  setPlanTabVisible: (tab: PlanTabId, visible: boolean) => void;
  setOverviewChartPreferences: (patch: Partial<OverviewChartPreferences>) => void;
  setThemePreference: (theme: UiPreferences["theme"]) => void;
  connectedWallets: ConnectedWallet[];
  upsertConnectedWallet: (wallet: ConnectedWallet) => void;
  deleteConnectedWallet: (id: string) => void;
  applyMorphoSync: (walletId: string, result: MorphoSyncResult) => void;
  applyAssetPrices: (pricesBySymbol: Record<string, number>) => number;
  replacePortfolioData: (data: PortfolioImportResult) => void;
  account: User;
  updateAccount: (patch: Partial<User>) => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

function buildPortfolioPayload(state: {
  sections: PortfolioSection[];
  assets: Asset[];
  cashAccounts: CashAccount[];
  liabilities: Liability[];
  planningItems: PlanningItem[];
  spendingItems: SpendingItem[];
  allocationNodes: AllocationNode[];
  incomePlan: IncomePlanConfig;
  walletMapNodes: WalletMapNode[];
  uiPreferences: UiPreferences;
  connectedWallets: ConnectedWallet[];
  monthlyIncome?: number;
  netWorthHistory: NetWorthSnapshot[];
}): PortfolioDataPayload {
  return {
    sections: state.sections,
    assets: state.assets,
    cashAccounts: state.cashAccounts,
    liabilities: state.liabilities,
    planningItems: state.planningItems,
    spendingItems: state.spendingItems,
    allocationNodes: state.allocationNodes,
    incomePlan: state.incomePlan,
    walletMapNodes: state.walletMapNodes,
    uiPreferences: state.uiPreferences,
    connectedWallets: state.connectedWallets,
    monthlyIncome: state.monthlyIncome,
    netWorthHistory: state.netWorthHistory,
  };
}

function toNormalizedPortfolio(data: PortfolioImportResult): PortfolioDataPayload {
  return normalizePortfolioEntityIds({
    sections: data.sections ?? EMPTY_SECTIONS,
    assets: data.assets ?? EMPTY_ASSETS,
    cashAccounts: data.cashAccounts ?? EMPTY_CASH_ACCOUNTS,
    liabilities: data.liabilities ?? EMPTY_LIABILITIES,
    planningItems: data.planningItems ?? EMPTY_PLANNING_ITEMS,
    spendingItems: data.spendingItems ?? EMPTY_SPENDING_ITEMS,
    allocationNodes: data.allocationNodes ?? EMPTY_ALLOCATION_NODES,
    incomePlan: data.incomePlan ?? EMPTY_INCOME_PLAN,
    walletMapNodes: data.walletMapNodes ?? EMPTY_WALLET_MAP_NODES,
    uiPreferences: data.uiPreferences ?? EMPTY_UI_PREFERENCES,
    connectedWallets: data.connectedWallets ?? EMPTY_CONNECTED_WALLETS,
    monthlyIncome: data.monthlyIncome,
    netWorthHistory: data.netWorthHistory ?? EMPTY_NET_WORTH_HISTORY,
  });
}

function hydrateFromPayload(
  data: PortfolioImportResult,
  setters: {
    setSections: (v: PortfolioSection[]) => void;
    setAssets: (v: Asset[]) => void;
    setCashAccounts: (v: CashAccount[]) => void;
    setLiabilities: (v: Liability[]) => void;
    setPlanningItems: (v: PlanningItem[]) => void;
    setSpendingItems: (v: SpendingItem[]) => void;
    setAllocationNodes: (v: AllocationNode[]) => void;
    setIncomePlan: (v: IncomePlanConfig) => void;
    setWalletMapNodes: (v: WalletMapNode[]) => void;
    setUiPreferences: (v: UiPreferences) => void;
    setConnectedWallets: (v: ConnectedWallet[]) => void;
    setMonthlyIncome: (v: number | undefined) => void;
    setNetWorthHistory: (v: NetWorthSnapshot[]) => void;
  }
) {
  const normalized = toNormalizedPortfolio(data);
  setters.setSections(normalized.sections);
  setters.setAssets(normalized.assets);
  setters.setCashAccounts(normalized.cashAccounts);
  setters.setLiabilities(normalized.liabilities);
  setters.setPlanningItems(normalized.planningItems);
  setters.setSpendingItems(normalized.spendingItems);
  if (normalized.allocationNodes) setters.setAllocationNodes(normalized.allocationNodes);
  if (normalized.incomePlan) setters.setIncomePlan(normalized.incomePlan);
  if (normalized.walletMapNodes) setters.setWalletMapNodes(normalized.walletMapNodes);
  if (normalized.uiPreferences) {
    setters.setUiPreferences({
      ...normalized.uiPreferences,
      theme: normalizeThemePreference(normalized.uiPreferences.theme),
    });
  }
  if (normalized.connectedWallets) setters.setConnectedWallets(normalized.connectedWallets);
  if (normalized.monthlyIncome !== undefined) setters.setMonthlyIncome(normalized.monthlyIncome);
  if (normalized.netWorthHistory) setters.setNetWorthHistory(normalized.netWorthHistory);
}

/**
 * Client portfolio state — hydrated from home API on the server; persists via POST /api/export.
 */
export function PortfolioProvider({
  children,
  initialAccount,
  initialPortfolio,
}: {
  children: ReactNode;
  initialAccount: User;
  initialPortfolio: PortfolioImportResult;
}) {
  const [boot] = useState(() => toNormalizedPortfolio(initialPortfolio));
  const [sections, setSections] = useState<PortfolioSection[]>(boot.sections);
  const [assets, setAssets] = useState<Asset[]>(boot.assets);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>(boot.cashAccounts);
  const [liabilities, setLiabilities] = useState<Liability[]>(boot.liabilities);
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>(boot.planningItems);
  const [spendingItems, setSpendingItems] = useState<SpendingItem[]>(boot.spendingItems);
  const [allocationNodes, setAllocationNodes] = useState<AllocationNode[]>(
    boot.allocationNodes ?? EMPTY_ALLOCATION_NODES
  );
  const [incomePlan, setIncomePlan] = useState<IncomePlanConfig>(
    boot.incomePlan ?? EMPTY_INCOME_PLAN
  );
  const [walletMapNodes, setWalletMapNodes] = useState<WalletMapNode[]>(
    boot.walletMapNodes ?? EMPTY_WALLET_MAP_NODES
  );
  const [monthlyIncome, setMonthlyIncome] = useState<number | undefined>(boot.monthlyIncome);
  const [netWorthHistory, setNetWorthHistory] = useState<NetWorthSnapshot[]>(
    boot.netWorthHistory ?? EMPTY_NET_WORTH_HISTORY
  );
  const [uiPreferences, setUiPreferences] = useState<UiPreferences>(() => ({
    ...(boot.uiPreferences ?? EMPTY_UI_PREFERENCES),
    theme: normalizeThemePreference(boot.uiPreferences?.theme),
  }));
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>(
    boot.connectedWallets ?? EMPTY_CONNECTED_WALLETS
  );
  const [account, setAccount] = useState<User>(initialAccount);

  const skipPersistRef = useRef(true);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateAccount = useCallback((patch: Partial<User>) => {
    setAccount((prev) => ({ ...prev, ...patch }));
  }, []);

  const setNavPageVisible = useCallback((page: NavPageKey, visible: boolean) => {
    setUiPreferences((prev) => ({
      ...prev,
      navPages: { ...prev.navPages, [page]: visible },
    }));
  }, []);

  const setPlanTabVisible = useCallback((tab: PlanTabId, visible: boolean) => {
    setUiPreferences((prev) => ({
      ...prev,
      planTabs: { ...prev.planTabs, [tab]: visible },
    }));
  }, []);

  const setOverviewChartPreferences = useCallback(
    (patch: Partial<OverviewChartPreferences>) => {
      setUiPreferences((prev) => ({
        ...prev,
        overviewChart: normalizeOverviewChart({ ...prev.overviewChart, ...patch }),
      }));
    },
    []
  );

  const setThemePreference = useCallback((theme: ThemePreference) => {
    setUiPreferences((prev) => ({
      ...prev,
      theme: normalizeThemePreference(theme),
    }));
  }, []);

  const upsertConnectedWallet = useCallback((wallet: ConnectedWallet) => {
    setConnectedWallets((prev) => {
      const idx = prev.findIndex((w) => w.id === wallet.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = wallet;
        return next;
      }
      return [...prev, wallet];
    });
  }, []);

  const deleteConnectedWallet = useCallback((id: string) => {
    setConnectedWallets((prev) => prev.filter((w) => w.id !== id));
    setSections((prev) =>
      prev.map((s) =>
        s.metadata?.walletId === id
          ? { ...s, metadata: { ...s.metadata, walletId: undefined } }
          : s
      )
    );
  }, []);

  const applyMorphoSync = useCallback((walletId: string, result: MorphoSyncResult) => {
    setAssets((prev) => [
      ...prev.filter((a) => !(a.walletId === walletId || isMorphoManagedId(a.id))),
      ...result.assets,
    ]);
    setLiabilities((prev) => [
      ...prev.filter((l) => !(l.walletId === walletId || isMorphoManagedId(l.id))),
      ...result.liabilities,
    ]);
    setCashAccounts((prev) => [
      ...prev.filter((c) => !(c.walletId === walletId || isMorphoManagedId(c.id))),
      ...result.cashAccounts,
    ]);
  }, []);

  const applyAssetPrices = useCallback((pricesBySymbol: Record<string, number>) => {
    let updated = 0;
    setAssets((prev) =>
      prev.map((asset) => {
        if (!isFinnhubEligible(asset)) return asset;
        const price = pricesBySymbol[asset.symbol.toUpperCase()];
        if (price == null || price <= 0 || price === asset.price) return asset;
        updated += 1;
        return { ...asset, price };
      })
    );
    return updated;
  }, []);

  const setIncomePlanDescription = useCallback((description: string) => {
    setIncomePlan((prev) => ({ ...prev, description }));
  }, []);

  const getSections = useCallback(
    (page: PageType) => getSectionsForPage(sections, page),
    [sections]
  );

  const upsertSection = useCallback((section: PortfolioSection) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === section.id && s.page === section.page);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = section;
        return next;
      }
      return [...prev, section];
    });
  }, []);

  const deleteSection = useCallback((sectionId: string, page: PageType) => {
    setSections((prev) => prev.filter((s) => !(s.id === sectionId && s.page === page)));
    switch (page) {
      case "assets":
        setAssets((prev) => prev.filter((a) => a.sectionId !== sectionId));
        break;
      case "cash":
        setCashAccounts((prev) => prev.filter((a) => a.sectionId !== sectionId));
        break;
      case "liabilities":
        setLiabilities((prev) => prev.filter((l) => l.sectionId !== sectionId));
        break;
      case "planning":
        setPlanningItems((prev) => prev.filter((i) => i.sectionId !== sectionId));
        break;
      case "spending":
        setSpendingItems((prev) => prev.filter((i) => i.sectionId !== sectionId));
        break;
    }
  }, []);

  const addSection = useCallback(
    (page: PageType, label: string, metadata?: PortfolioSection["metadata"]) => {
      const pageSections = getSectionsForPage(sections, page);
      const section: PortfolioSection = {
        id: createSectionId(page),
        page,
        label,
        order: pageSections.length,
        metadata,
      };
      setSections((prev) => [...prev, section]);
      return section;
    },
    [sections]
  );

  const upsertAsset = useCallback((asset: Asset) => {
    setAssets((prev) => {
      const idx = prev.findIndex((a) => a.id === asset.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = asset;
        return next;
      }
      return [...prev, asset];
    });
  }, []);

  const deleteAsset = useCallback((id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const upsertCashAccount = useCallback((account: CashAccount) => {
    setCashAccounts((prev) => {
      const idx = prev.findIndex((a) => a.id === account.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = account;
        return next;
      }
      return [...prev, account];
    });
  }, []);

  const deleteCashAccount = useCallback((id: string) => {
    setCashAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const upsertLiability = useCallback((liability: Liability) => {
    setLiabilities((prev) => {
      const idx = prev.findIndex((l) => l.id === liability.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = liability;
        return next;
      }
      return [...prev, liability];
    });
  }, []);

  const deleteLiability = useCallback((id: string) => {
    setLiabilities((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const upsertPlanningItem = useCallback((item: PlanningItem) => {
    setPlanningItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [...prev, item];
    });
  }, []);

  const deletePlanningItem = useCallback((id: string) => {
    setPlanningItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const upsertSpendingItem = useCallback((item: SpendingItem) => {
    setSpendingItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [...prev, item];
    });
  }, []);

  const deleteSpendingItem = useCallback((id: string) => {
    setSpendingItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const upsertAllocationNode = useCallback((node: AllocationNode) => {
    setAllocationNodes((prev) => {
      const idx = prev.findIndex((n) => n.id === node.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = node;
        return next;
      }
      return [...prev, node];
    });
  }, []);

  const deleteAllocationNode = useCallback((id: string) => {
    setAllocationNodes((prev) => {
      const remove = new Set<string>();
      const collect = (nodeId: string) => {
        remove.add(nodeId);
        prev.filter((n) => n.parentId === nodeId).forEach((n) => collect(n.id));
      };
      collect(id);
      return prev.filter((n) => !remove.has(n.id));
    });
  }, []);

  const upsertWalletMapNode = useCallback((node: WalletMapNode) => {
    setWalletMapNodes((prev) => {
      const idx = prev.findIndex((n) => n.id === node.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = node;
        return next;
      }
      return [...prev, node];
    });
  }, []);

  const deleteWalletMapNode = useCallback((id: string) => {
    setWalletMapNodes((prev) => {
      const remove = new Set<string>();
      const collect = (nodeId: string) => {
        remove.add(nodeId);
        prev.filter((n) => n.parentId === nodeId).forEach((n) => collect(n.id));
      };
      collect(id);
      return prev.filter((n) => !remove.has(n.id));
    });
  }, []);

  const replacePortfolioData = useCallback((data: PortfolioImportResult) => {
    hydrateFromPayload(data, {
      setSections,
      setAssets,
      setCashAccounts,
      setLiabilities,
      setPlanningItems,
      setSpendingItems,
      setAllocationNodes,
      setIncomePlan,
      setWalletMapNodes,
      setUiPreferences,
      setConnectedWallets,
      setMonthlyIncome,
      setNetWorthHistory,
    });
  }, []);

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }

    const payload = buildPortfolioPayload({
      sections,
      assets,
      cashAccounts,
      liabilities,
      planningItems,
      spendingItems,
      allocationNodes,
      incomePlan,
      walletMapNodes,
      uiPreferences,
      connectedWallets,
      monthlyIncome,
      netWorthHistory,
    });

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {
        /* silent — user can re-export manually */
      });
    }, 800);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [
    sections,
    assets,
    cashAccounts,
    liabilities,
    planningItems,
    spendingItems,
    allocationNodes,
    incomePlan,
    walletMapNodes,
    uiPreferences,
    connectedWallets,
    monthlyIncome,
    netWorthHistory,
  ]);

  const value = useMemo(
    () => ({
      sections,
      assets,
      cashAccounts,
      liabilities,
      planningItems,
      spendingItems,
      allocationNodes,
      incomePlan,
      setIncomePlanDescription,
      walletMapNodes,
      netWorthHistory,
      monthlyIncome,
      setMonthlyIncome,
      getSections,
      upsertSection,
      deleteSection,
      addSection,
      upsertAsset,
      deleteAsset,
      upsertCashAccount,
      deleteCashAccount,
      upsertLiability,
      deleteLiability,
      upsertPlanningItem,
      deletePlanningItem,
      upsertSpendingItem,
      deleteSpendingItem,
      upsertAllocationNode,
      deleteAllocationNode,
      upsertWalletMapNode,
      deleteWalletMapNode,
      uiPreferences,
      setNavPageVisible,
      setPlanTabVisible,
      setOverviewChartPreferences,
      setThemePreference,
      connectedWallets,
      upsertConnectedWallet,
      deleteConnectedWallet,
      applyMorphoSync,
      applyAssetPrices,
      replacePortfolioData,
      account,
      updateAccount,
    }),
    [
      sections,
      assets,
      cashAccounts,
      liabilities,
      planningItems,
      spendingItems,
      allocationNodes,
      incomePlan,
      setIncomePlanDescription,
      walletMapNodes,
      netWorthHistory,
      monthlyIncome,
      getSections,
      upsertSection,
      deleteSection,
      addSection,
      upsertAsset,
      deleteAsset,
      upsertCashAccount,
      deleteCashAccount,
      upsertLiability,
      deleteLiability,
      upsertPlanningItem,
      deletePlanningItem,
      upsertSpendingItem,
      deleteSpendingItem,
      upsertAllocationNode,
      deleteAllocationNode,
      upsertWalletMapNode,
      deleteWalletMapNode,
      uiPreferences,
      setNavPageVisible,
      setPlanTabVisible,
      setOverviewChartPreferences,
      setThemePreference,
      connectedWallets,
      upsertConnectedWallet,
      deleteConnectedWallet,
      applyMorphoSync,
      applyAssetPrices,
      replacePortfolioData,
      account,
      updateAccount,
    ]
  );

  return (
    <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}

export { buildPortfolioPayload };
