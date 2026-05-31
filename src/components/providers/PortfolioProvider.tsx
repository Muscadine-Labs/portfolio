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
import { createSectionGroupId, getSectionGroupsForPage } from "@/lib/section-groups";
import {
  EMPTY_ALLOCATION_NODES,
  EMPTY_ASSETS,
  EMPTY_CASH_ACCOUNTS,
  EMPTY_INCOME_PLAN,
  EMPTY_LIABILITIES,
  EMPTY_NET_WORTH_HISTORY,
  EMPTY_PLANNING_ITEMS,
  EMPTY_SECTION_GROUPS,
  EMPTY_SECTIONS,
  EMPTY_SPENDING_ITEMS,
  EMPTY_UI_PREFERENCES,
  EMPTY_WALLET_MAP_NODES,
} from "@/lib/portfolio-empty";
import type { MorphoSyncResult } from "@/lib/morpho";
import { isMorphoManagedId } from "@/lib/morpho";
import { normalizeOverviewChart } from "@/lib/overview-chart";
import { sortNetWorthHistory } from "@/lib/net-worth-history";
import { normalizeUiPreferences, writeSidebarCompactToStorage } from "@/lib/sidebar-preference";
import { normalizeThemePreference } from "@/lib/theme-preference";
import type { PortfolioDataPayload, PortfolioImportResult } from "@/lib/portfolio-data";
import { normalizePortfolioEntityIds } from "@/lib/portfolio-data";
import { isFinnhubEligible } from "@/lib/finnhub";
import type {
  AllocationNode,
  Asset,
  CashAccount,
  IncomePlanConfig,
  Liability,
  NetWorthSnapshot,
  OverviewChartPreferences,
  PageType,
  PlanningItem,
  PortfolioSection,
  SectionGroup,
  SectionGroupPage,
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
  sectionGroups: SectionGroup[];
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
  setNetWorthHistory: (history: NetWorthSnapshot[]) => void;
  upsertNetWorthSnapshotAt: (index: number, patch: Partial<NetWorthSnapshot>) => void;
  addNetWorthSnapshot: (snapshot?: Partial<NetWorthSnapshot>) => void;
  deleteNetWorthSnapshot: (index: number) => void;
  monthlyIncome?: number;
  setMonthlyIncome: (value: number | undefined) => void;
  getSections: (page: PageType) => PortfolioSection[];
  getSectionGroups: (page: SectionGroupPage) => SectionGroup[];
  upsertSectionGroup: (group: SectionGroup) => void;
  deleteSectionGroup: (groupId: string, mode: "ungroup" | "deleteAll") => void;
  addSectionGroup: (page: SectionGroupPage, name: string) => SectionGroup;
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
  setMonthlyAutoSnapshot: (enabled: boolean) => void;
  setThemePreference: (theme: UiPreferences["theme"]) => void;
  setSidebarCompact: (compact: boolean) => void;
  applyMorphoSync: (walletId: string, result: MorphoSyncResult) => void;
  applyAssetPrices: (pricesBySymbol: Record<string, number>) => number;
  replacePortfolioData: (data: PortfolioImportResult) => void;
  account: User;
  updateAccount: (patch: Partial<User>) => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

function buildPortfolioPayload(state: {
  sections: PortfolioSection[];
  sectionGroups: SectionGroup[];
  assets: Asset[];
  cashAccounts: CashAccount[];
  liabilities: Liability[];
  planningItems: PlanningItem[];
  spendingItems: SpendingItem[];
  allocationNodes: AllocationNode[];
  incomePlan: IncomePlanConfig;
  walletMapNodes: WalletMapNode[];
  uiPreferences: UiPreferences;
  monthlyIncome?: number;
  netWorthHistory: NetWorthSnapshot[];
}): PortfolioDataPayload {
  return {
    sections: state.sections,
    sectionGroups: state.sectionGroups,
    assets: state.assets,
    cashAccounts: state.cashAccounts,
    liabilities: state.liabilities,
    planningItems: state.planningItems,
    spendingItems: state.spendingItems,
    allocationNodes: state.allocationNodes,
    incomePlan: state.incomePlan,
    walletMapNodes: state.walletMapNodes,
    uiPreferences: state.uiPreferences,
    monthlyIncome: state.monthlyIncome,
    netWorthHistory: state.netWorthHistory,
  };
}

function toNormalizedPortfolio(data: PortfolioImportResult): PortfolioDataPayload {
  return normalizePortfolioEntityIds({
    sections: data.sections ?? EMPTY_SECTIONS,
    sectionGroups: data.sectionGroups ?? EMPTY_SECTION_GROUPS,
    assets: data.assets ?? EMPTY_ASSETS,
    cashAccounts: data.cashAccounts ?? EMPTY_CASH_ACCOUNTS,
    liabilities: data.liabilities ?? EMPTY_LIABILITIES,
    planningItems: data.planningItems ?? EMPTY_PLANNING_ITEMS,
    spendingItems: data.spendingItems ?? EMPTY_SPENDING_ITEMS,
    allocationNodes: data.allocationNodes ?? EMPTY_ALLOCATION_NODES,
    incomePlan: data.incomePlan ?? EMPTY_INCOME_PLAN,
    walletMapNodes: data.walletMapNodes ?? EMPTY_WALLET_MAP_NODES,
    uiPreferences: data.uiPreferences ?? EMPTY_UI_PREFERENCES,
    connectedWallets: (data as PortfolioImportResult & { connectedWallets?: unknown }).connectedWallets as
      | Parameters<typeof normalizePortfolioEntityIds>[0]["connectedWallets"]
      | undefined,
    monthlyIncome: data.monthlyIncome,
    netWorthHistory: data.netWorthHistory ?? EMPTY_NET_WORTH_HISTORY,
  });
}

function hydrateFromPayload(
  data: PortfolioImportResult,
  tenant: string,
  setters: {
    setSections: (v: PortfolioSection[]) => void;
    setSectionGroups: (v: SectionGroup[]) => void;
    setAssets: (v: Asset[]) => void;
    setCashAccounts: (v: CashAccount[]) => void;
    setLiabilities: (v: Liability[]) => void;
    setPlanningItems: (v: PlanningItem[]) => void;
    setSpendingItems: (v: SpendingItem[]) => void;
    setAllocationNodes: (v: AllocationNode[]) => void;
    setIncomePlan: (v: IncomePlanConfig) => void;
    setWalletMapNodes: (v: WalletMapNode[]) => void;
    setUiPreferences: (v: UiPreferences) => void;
    setMonthlyIncome: (v: number | undefined) => void;
    setNetWorthHistory: (v: NetWorthSnapshot[]) => void;
  }
) {
  const normalized = toNormalizedPortfolio(data);
  setters.setSections(normalized.sections);
  setters.setSectionGroups(normalized.sectionGroups ?? EMPTY_SECTION_GROUPS);
  setters.setAssets(normalized.assets);
  setters.setCashAccounts(normalized.cashAccounts);
  setters.setLiabilities(normalized.liabilities);
  setters.setPlanningItems(normalized.planningItems);
  setters.setSpendingItems(normalized.spendingItems);
  if (normalized.allocationNodes) setters.setAllocationNodes(normalized.allocationNodes);
  if (normalized.incomePlan) setters.setIncomePlan(normalized.incomePlan);
  if (normalized.walletMapNodes) setters.setWalletMapNodes(normalized.walletMapNodes);
  if (normalized.uiPreferences) {
    setters.setUiPreferences(normalizeUiPreferences(normalized.uiPreferences, tenant));
  }
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
  const [sectionGroups, setSectionGroups] = useState<SectionGroup[]>(
    boot.sectionGroups ?? EMPTY_SECTION_GROUPS
  );
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
  const [uiPreferences, setUiPreferences] = useState<UiPreferences>(() =>
    normalizeUiPreferences(boot.uiPreferences, initialAccount.tenant)
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

  const setMonthlyAutoSnapshot = useCallback((enabled: boolean) => {
    setUiPreferences((prev) => ({ ...prev, monthlyAutoSnapshot: enabled }));
  }, []);

  const setNetWorthHistorySorted = useCallback((history: NetWorthSnapshot[]) => {
    setNetWorthHistory(sortNetWorthHistory(history));
  }, []);

  const upsertNetWorthSnapshotAt = useCallback(
    (index: number, patch: Partial<NetWorthSnapshot>) => {
      setNetWorthHistory((prev) => {
        if (index < 0 || index >= prev.length) return prev;
        const next = [...prev];
        next[index] = { ...next[index], ...patch };
        return sortNetWorthHistory(next);
      });
    },
    []
  );

  const addNetWorthSnapshot = useCallback((snapshot?: Partial<NetWorthSnapshot>) => {
    setNetWorthHistory((prev) =>
      sortNetWorthHistory([
        ...prev,
        {
          period: snapshot?.period ?? "",
          netWorth: snapshot?.netWorth ?? 0,
          totalCostBasis: snapshot?.totalCostBasis,
        },
      ])
    );
  }, []);

  const deleteNetWorthSnapshot = useCallback((index: number) => {
    setNetWorthHistory((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const setThemePreference = useCallback((theme: ThemePreference) => {
    setUiPreferences((prev) => ({
      ...prev,
      theme: normalizeThemePreference(theme),
    }));
  }, []);

  const setSidebarCompact = useCallback(
    (compact: boolean) => {
      writeSidebarCompactToStorage(account.tenant, compact);
      setUiPreferences((prev) => ({ ...prev, sidebarCompact: compact }));
    },
    [account.tenant]
  );

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

  const getSectionGroups = useCallback(
    (page: SectionGroupPage) => getSectionGroupsForPage(sectionGroups, page),
    [sectionGroups]
  );

  const upsertSectionGroup = useCallback((group: SectionGroup) => {
    setSectionGroups((prev) => {
      const idx = prev.findIndex((g) => g.id === group.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = group;
        return next;
      }
      return [...prev, group];
    });
  }, []);

  const addSectionGroup = useCallback(
    (page: SectionGroupPage, name: string) => {
      const trimmed = name.trim();
      const group: SectionGroup = {
        id: createSectionGroupId(page),
        page,
        name: trimmed,
        order: getSectionGroupsForPage(sectionGroups, page).length,
      };
      setSectionGroups((prev) => [...prev, group]);
      return group;
    },
    [sectionGroups]
  );

  const deleteSectionGroup = useCallback(
    (groupId: string, mode: "ungroup" | "deleteAll") => {
      const group = sectionGroups.find((g) => g.id === groupId);
      if (!group) return;
      const memberIds = sections
        .filter((section) => section.groupId === groupId)
        .map((section) => section.id);

      if (mode === "ungroup") {
        setSections((prev) =>
          prev.map((section) =>
            section.groupId === groupId ? { ...section, groupId: undefined } : section
          )
        );
      } else {
        setSections((prev) => prev.filter((section) => section.groupId !== groupId));
        switch (group.page) {
          case "assets":
            setAssets((prev) => prev.filter((asset) => !memberIds.includes(asset.sectionId)));
            break;
          case "cash":
            setCashAccounts((prev) =>
              prev.filter((account) => !memberIds.includes(account.sectionId))
            );
            break;
          case "liabilities":
            setLiabilities((prev) =>
              prev.filter((liability) => !memberIds.includes(liability.sectionId))
            );
            break;
        }
      }
      setSectionGroups((prev) => prev.filter((g) => g.id !== groupId));
    },
    [sectionGroups, sections]
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
    setSections((prev) =>
      prev.map((s) =>
        s.metadata?.walletId === id
          ? { ...s, metadata: { ...s.metadata, walletId: undefined } }
          : s
      )
    );
  }, []);

  const replacePortfolioData = useCallback((data: PortfolioImportResult) => {
    hydrateFromPayload(data, account.tenant, {
      setSections,
      setSectionGroups,
      setAssets,
      setCashAccounts,
      setLiabilities,
      setPlanningItems,
      setSpendingItems,
      setAllocationNodes,
      setIncomePlan,
      setWalletMapNodes,
      setUiPreferences,
      setMonthlyIncome,
      setNetWorthHistory,
    });
  }, [account.tenant]);

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }

    const payload = buildPortfolioPayload({
      sections,
      sectionGroups,
      assets,
      cashAccounts,
      liabilities,
      planningItems,
      spendingItems,
      allocationNodes,
      incomePlan,
      walletMapNodes,
      uiPreferences,
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
    sectionGroups,
    assets,
    cashAccounts,
    liabilities,
    planningItems,
    spendingItems,
    allocationNodes,
    incomePlan,
    walletMapNodes,
    uiPreferences,
    monthlyIncome,
    netWorthHistory,
  ]);

  const value = useMemo(
    () => ({
      sections,
      sectionGroups,
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
      setNetWorthHistory: setNetWorthHistorySorted,
      upsertNetWorthSnapshotAt,
      addNetWorthSnapshot,
      deleteNetWorthSnapshot,
      monthlyIncome,
      setMonthlyIncome,
      getSections,
      getSectionGroups,
      upsertSectionGroup,
      deleteSectionGroup,
      addSectionGroup,
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
      setMonthlyAutoSnapshot,
      setThemePreference,
      setSidebarCompact,
      applyMorphoSync,
      applyAssetPrices,
      replacePortfolioData,
      account,
      updateAccount,
    }),
    [
      sections,
      sectionGroups,
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
      setNetWorthHistorySorted,
      upsertNetWorthSnapshotAt,
      addNetWorthSnapshot,
      deleteNetWorthSnapshot,
      monthlyIncome,
      getSections,
      getSectionGroups,
      upsertSectionGroup,
      deleteSectionGroup,
      addSectionGroup,
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
      setMonthlyAutoSnapshot,
      setThemePreference,
      setSidebarCompact,
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
