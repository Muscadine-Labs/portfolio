import { normalizeOverviewChart } from "@/lib/overview-chart";
import { normalizeOverviewWidgets } from "@/lib/overview-widgets";
import { normalizeNetWorthSnapshotCadence } from "@/lib/net-worth-history";
import { normalizeThemePreference } from "@/lib/theme-preference";
import { migrateAndNormalizeSectionGroups } from "@/lib/section-groups";
import { parseSectionMetadata } from "@/lib/section-metadata";
import {
  mergeLegacyConnectedWallets,
  normalizeWalletMapNodes,
} from "@/lib/wallet-map";
import { createEntityId } from "@/lib/sections";
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
import type {
  AllocationNode,
  Asset,
  CashAccount,
  IncomePlanConfig,
  Liability,
  OverviewChartLineType,
  OverviewWidgetId,
  OverviewWidgetsPreferences,
  PageType,
  PlanningItem,
  PortfolioSection,
  SectionGroup,
  SectionGroupPage,
  SpendingItem,
  UiPreferences,
  WalletChain,
  WalletMapNode,
} from "@/types";

export interface PortfolioDataPayload {
  sections: PortfolioSection[];
  sectionGroups?: SectionGroup[];
  assets: Asset[];
  cashAccounts: CashAccount[];
  liabilities: Liability[];
  planningItems: PlanningItem[];
  spendingItems: SpendingItem[];
  allocationNodes?: AllocationNode[];
  incomePlan?: IncomePlanConfig;
  walletMapNodes?: WalletMapNode[];
  uiPreferences?: UiPreferences;
  monthlyIncome?: number;
  netWorthHistory?: import("@/types").NetWorthSnapshot[];
}

export type PortfolioImportResult = PortfolioDataPayload;

export type PortfolioValidationResult =
  | { ok: true; data: PortfolioDataPayload }
  | { ok: false; error: string };

const PAGE_TYPES: PageType[] = [
  "assets",
  "cash",
  "liabilities",
  "planning",
  "spending",
];

const GOAL_STATUSES: PlanningItem["status"][] = [
  "not_started",
  "in_progress",
  "completed",
];

const SPEND_FREQUENCIES: SpendingItem["frequency"][] = [
  "monthly",
  "weekly",
  "yearly",
  "one_time",
];

const TRACK_PAGES: NonNullable<PlanningItem["trackPage"]>[] = [
  "assets",
  "cash",
  "liabilities",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const OVERVIEW_WIDGET_IDS: OverviewWidgetId[] = ["insights", "chart", "breakdown"];

function parseOverviewWidgets(
  raw: unknown
): Partial<OverviewWidgetsPreferences> | undefined {
  if (!isRecord(raw)) return undefined;
  const order: OverviewWidgetId[] = [];
  if (Array.isArray(raw.order)) {
    for (const item of raw.order) {
      if (
        typeof item === "string" &&
        OVERVIEW_WIDGET_IDS.includes(item as OverviewWidgetId) &&
        !order.includes(item as OverviewWidgetId)
      ) {
        order.push(item as OverviewWidgetId);
      }
    }
  }
  return {
    insights: typeof raw.insights === "boolean" ? raw.insights : undefined,
    chart: typeof raw.chart === "boolean" ? raw.chart : undefined,
    breakdown: typeof raw.breakdown === "boolean" ? raw.breakdown : undefined,
    order: order.length > 0 ? order : undefined,
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function requireFiniteNumber(
  value: unknown,
  label: string,
  errors: string[]
): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(label);
    return null;
  }
  return value;
}

function optionalFiniteNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseWalletLinks(raw: unknown): WalletMapNode["links"] | undefined {
  if (!isRecord(raw)) return undefined;
  const assetIds = Array.isArray(raw.assetIds)
    ? raw.assetIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    : undefined;
  const liabilityIds = Array.isArray(raw.liabilityIds)
    ? raw.liabilityIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    : undefined;
  const links = {
    assetsSectionId: optionalString(raw.assetsSectionId),
    cashSectionId: optionalString(raw.cashSectionId),
    liabilitiesSectionId: optionalString(raw.liabilitiesSectionId),
    assetIds: assetIds?.length ? assetIds : undefined,
    liabilityIds: liabilityIds?.length ? liabilityIds : undefined,
  };
  return links.assetsSectionId ||
    links.cashSectionId ||
    links.liabilitiesSectionId ||
    links.assetIds?.length ||
    links.liabilityIds?.length
    ? links
    : undefined;
}

function parseMorphoMappings(raw: unknown): WalletMapNode["morphoMappings"] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const targets = new Set(["assets", "liabilities", "cash"]);
  const kinds = new Set(["vault", "debt", "collateral"]);
  const mappings: NonNullable<WalletMapNode["morphoMappings"]> = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const key = optionalString(item.key);
    const target = optionalString(item.target);
    if (!key || !target || !targets.has(target)) continue;
    mappings.push({
      key,
      enabled: item.enabled !== false,
      target: target as "assets" | "liabilities" | "cash",
      sectionId: optionalString(item.sectionId),
      rowId: optionalString(item.rowId),
      label: optionalString(item.label),
      kind:
        typeof item.kind === "string" && kinds.has(item.kind)
          ? (item.kind as "vault" | "debt" | "collateral")
          : undefined,
    });
  }
  return mappings.length > 0 ? mappings : undefined;
}

function parseWalletAddresses(raw: unknown): WalletMapNode["addresses"] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const entries: NonNullable<WalletMapNode["addresses"]> = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const id = optionalString(item.id);
    const address = optionalString(item.address);
    const networks = parseWalletNetworks(item.networks);
    if (!id || !address || !networks?.length) continue;
    entries.push({
      id,
      address,
      networks,
      label: optionalString(item.label),
    });
  }
  return entries.length > 0 ? entries : undefined;
}

function parseWalletNetworks(raw: unknown): WalletChain[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const chains: WalletChain[] = ["ethereum", "base", "bitcoin", "solana", "other"];
  const networks = raw.filter(
    (value): value is WalletChain => typeof value === "string" && chains.includes(value as WalletChain)
  );
  return networks.length > 0 ? networks : undefined;
}

function collectDuplicateIds(ids: string[], label: string, errors: string[]): void {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      errors.push(`Duplicate ${label} id: ${id}`);
      return;
    }
    seen.add(id);
  }
}

const SECTION_GROUP_PAGES: SectionGroupPage[] = ["assets", "cash", "liabilities"];

export function createDefaultPortfolioData(): PortfolioDataPayload {
  return {
    sections: structuredClone(EMPTY_SECTIONS),
    sectionGroups: structuredClone(EMPTY_SECTION_GROUPS),
    assets: structuredClone(EMPTY_ASSETS),
    cashAccounts: structuredClone(EMPTY_CASH_ACCOUNTS),
    liabilities: structuredClone(EMPTY_LIABILITIES),
    planningItems: structuredClone(EMPTY_PLANNING_ITEMS),
    spendingItems: structuredClone(EMPTY_SPENDING_ITEMS),
    allocationNodes: structuredClone(EMPTY_ALLOCATION_NODES),
    incomePlan: structuredClone(EMPTY_INCOME_PLAN),
    walletMapNodes: structuredClone(EMPTY_WALLET_MAP_NODES),
    uiPreferences: structuredClone(EMPTY_UI_PREFERENCES),
    netWorthHistory: structuredClone(EMPTY_NET_WORTH_HISTORY),
  };
}

function dedupeEntityIds<T extends { id: string }>(items: T[], prefix: string): T[] {
  const seen = new Set<string>();
  return items.map((item) => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      return item;
    }
    const id = createEntityId(prefix);
    seen.add(id);
    return { ...item, id };
  });
}

/** Repair duplicate entity ids from legacy imports (e.g. truncated slug collisions). */
export function normalizePortfolioEntityIds(
  payload: PortfolioDataPayload & {
    connectedWallets?: Array<{
      id: string;
      label: string;
      address: string;
      networks?: WalletChain[];
      chain?: WalletChain;
      notes?: string;
      links?: WalletMapNode["links"];
    }>;
  }
): PortfolioDataPayload {
  const walletMapNodes = normalizeWalletMapNodes(
    dedupeEntityIds(
      mergeLegacyConnectedWallets(
        payload.walletMapNodes ?? [],
        payload.connectedWallets ?? []
      ),
      "wallet"
    )
  );

  const migrated = migrateAndNormalizeSectionGroups(
    payload.sections ?? [],
    payload.sectionGroups ?? []
  );

  return {
    ...payload,
    sections: dedupeEntityIds(migrated.sections, "section"),
    sectionGroups: dedupeEntityIds(migrated.sectionGroups, "group"),
    assets: dedupeEntityIds(payload.assets ?? [], "asset"),
    cashAccounts: dedupeEntityIds(payload.cashAccounts ?? [], "cash"),
    liabilities: dedupeEntityIds(payload.liabilities ?? [], "lia"),
    planningItems: dedupeEntityIds(payload.planningItems ?? [], "plan"),
    spendingItems: dedupeEntityIds(payload.spendingItems ?? [], "spend"),
    allocationNodes: payload.allocationNodes
      ? dedupeEntityIds(payload.allocationNodes, "alloc")
      : payload.allocationNodes,
    walletMapNodes,
    uiPreferences: payload.uiPreferences
      ? {
          ...EMPTY_UI_PREFERENCES,
          ...payload.uiPreferences,
          theme: normalizeThemePreference(payload.uiPreferences.theme),
          overviewChart: normalizeOverviewChart(payload.uiPreferences.overviewChart),
          overviewWidgets: normalizeOverviewWidgets(payload.uiPreferences.overviewWidgets),
        }
      : EMPTY_UI_PREFERENCES,
  };
}

export function validatePortfolioPayload(body: unknown): PortfolioValidationResult {
  if (!isRecord(body)) {
    return { ok: false, error: "Import must be a JSON object." };
  }

  const errors: string[] = [];
  const requiredArrays = [
    "sections",
    "assets",
    "cashAccounts",
    "liabilities",
    "planningItems",
    "spendingItems",
  ] as const;

  for (const key of requiredArrays) {
    if (!Array.isArray(body[key])) {
      errors.push(`Missing or invalid "${key}" array.`);
    }
  }

  if (errors.length > 0) {
    return { ok: false, error: errors.join(" ") };
  }

  const sectionGroups: SectionGroup[] = [];
  const groupIdsByPage = new Map<SectionGroupPage, Set<string>>();

  if (body.sectionGroups !== undefined && body.sectionGroups !== null) {
    if (!Array.isArray(body.sectionGroups)) {
      errors.push('"sectionGroups" must be an array.');
    } else {
      for (const [index, raw] of body.sectionGroups.entries()) {
        if (!isRecord(raw)) {
          errors.push(`sectionGroups[${index}] must be an object.`);
          continue;
        }
        if (!isNonEmptyString(raw.id)) {
          errors.push(`sectionGroups[${index}].id is required.`);
          continue;
        }
        if (!SECTION_GROUP_PAGES.includes(raw.page as SectionGroupPage)) {
          errors.push(`sectionGroups[${index}].page is invalid.`);
          continue;
        }
        const page = raw.page as SectionGroupPage;
        const idsOnPage = groupIdsByPage.get(page) ?? new Set<string>();
        if (idsOnPage.has(raw.id)) {
          errors.push(`Duplicate section group id "${raw.id}" on page "${page}".`);
          continue;
        }
        if (!isNonEmptyString(raw.name)) {
          errors.push(`sectionGroups[${index}].name is required.`);
          continue;
        }
        const order = requireFiniteNumber(raw.order, `sectionGroups[${index}].order`, errors);
        if (order === null) continue;
        idsOnPage.add(raw.id);
        groupIdsByPage.set(page, idsOnPage);
        sectionGroups.push({
          id: raw.id,
          page,
          name: raw.name.trim(),
          order,
        });
      }
    }
  }

  const sections: PortfolioSection[] = [];
  /** Section ids are unique per page (cash and liabilities may share slug-style ids). */
  const sectionIdsByPage = new Map<PageType, Set<string>>();

  for (const [index, raw] of (body.sections as unknown[]).entries()) {
    if (!isRecord(raw)) {
      errors.push(`sections[${index}] must be an object.`);
      continue;
    }
    if (!isNonEmptyString(raw.id)) {
      errors.push(`sections[${index}].id is required.`);
      continue;
    }
    if (!PAGE_TYPES.includes(raw.page as PageType)) {
      errors.push(`sections[${index}].page is invalid.`);
      continue;
    }
    const page = raw.page as PageType;
    const idsOnPage = sectionIdsByPage.get(page) ?? new Set<string>();
    if (idsOnPage.has(raw.id)) {
      errors.push(`Duplicate section id "${raw.id}" on page "${page}".`);
      continue;
    }
    if (!isNonEmptyString(raw.label)) {
      errors.push(`sections[${index}].label is required.`);
      continue;
    }
    const order = requireFiniteNumber(raw.order, `sections[${index}].order`, errors);
    if (order === null) continue;

    const metadata =
      raw.metadata === undefined
        ? undefined
        : isRecord(raw.metadata)
          ? parseSectionMetadata(raw.metadata)
          : (errors.push(`sections[${index}].metadata must be an object.`), undefined);

    let groupId: string | undefined;
    if (raw.groupId !== undefined && raw.groupId !== null && raw.groupId !== "") {
      if (!isNonEmptyString(raw.groupId)) {
        errors.push(`sections[${index}].groupId must be a string.`);
        continue;
      }
      if (!SECTION_GROUP_PAGES.includes(page as SectionGroupPage)) {
        errors.push(`sections[${index}].groupId is only valid on assets, cash, or liabilities.`);
        continue;
      }
      if (!groupIdsByPage.get(page as SectionGroupPage)?.has(raw.groupId)) {
        errors.push(`sections[${index}].groupId references unknown group "${raw.groupId}".`);
        continue;
      }
      groupId = raw.groupId;
    }

    idsOnPage.add(raw.id);
    sectionIdsByPage.set(page, idsOnPage);
    sections.push({
      id: raw.id,
      page,
      label: raw.label.trim(),
      order,
      groupId,
      metadata,
    });
  }

  function requireSectionId(
    sectionId: unknown,
    page: PageType,
    label: string
  ): string | null {
    if (!isNonEmptyString(sectionId)) {
      errors.push(`${label}: sectionId is required.`);
      return null;
    }
    if (!sectionIdsByPage.get(page)?.has(sectionId)) {
      errors.push(`${label}: unknown sectionId "${sectionId}" for page "${page}".`);
      return null;
    }
    return sectionId;
  }

  function hasSectionOnPage(sectionId: string, page: PageType): boolean {
    return sectionIdsByPage.get(page)?.has(sectionId) ?? false;
  }

  const assets: Asset[] = [];
  for (const [index, raw] of (body.assets as unknown[]).entries()) {
    if (!isRecord(raw)) {
      errors.push(`assets[${index}] must be an object.`);
      continue;
    }
    if (!isNonEmptyString(raw.id)) {
      errors.push(`assets[${index}].id is required.`);
      continue;
    }
    const sectionId = requireSectionId(raw.sectionId, "assets", `assets[${index}]`);
    if (!sectionId) continue;
    const price = requireFiniteNumber(raw.price, `assets[${index}].price`, errors);
    const quantity = requireFiniteNumber(
      raw.quantity,
      `assets[${index}].quantity`,
      errors
    );
    if (price === null || quantity === null) continue;
    if (!isNonEmptyString(raw.symbol) || !isNonEmptyString(raw.name)) {
      errors.push(`assets[${index}].symbol and name are required.`);
      continue;
    }
    const costBasis = optionalFiniteNumber(raw.costBasis);
    if (raw.costBasis != null && raw.costBasis !== "" && costBasis === undefined) {
      errors.push(`assets[${index}].costBasis must be a number.`);
      continue;
    }
    const priceSource =
      raw.priceSource === "manual" || raw.priceSource === "api"
        ? raw.priceSource
        : undefined;
    assets.push({
      id: raw.id,
      symbol: raw.symbol.trim(),
      name: raw.name.trim(),
      sectionId,
      price,
      quantity,
      priceSource,
      costBasis,
      network: optionalString(raw.network),
      protocol: optionalString(raw.protocol),
    });
  }

  collectDuplicateIds(
    assets.map((a) => a.id),
    "asset",
    errors
  );

  const cashAccounts: CashAccount[] = [];
  for (const [index, raw] of (body.cashAccounts as unknown[]).entries()) {
    if (!isRecord(raw)) {
      errors.push(`cashAccounts[${index}] must be an object.`);
      continue;
    }
    if (!isNonEmptyString(raw.id)) {
      errors.push(`cashAccounts[${index}].id is required.`);
      continue;
    }
    const sectionId = requireSectionId(raw.sectionId, "cash", `cashAccounts[${index}]`);
    if (!sectionId) continue;
    const balance = requireFiniteNumber(
      raw.balance,
      `cashAccounts[${index}].balance`,
      errors
    );
    if (balance === null) continue;
    if (!isNonEmptyString(raw.name)) {
      errors.push(`cashAccounts[${index}].name is required.`);
      continue;
    }
    cashAccounts.push({
      id: raw.id,
      name: raw.name.trim(),
      sectionId,
      balance,
      originalAmount: optionalFiniteNumber(raw.originalAmount),
      interest: optionalFiniteNumber(raw.interest),
      protocol: optionalString(raw.protocol),
      address: optionalString(raw.address),
    });
  }

  collectDuplicateIds(
    cashAccounts.map((a) => a.id),
    "cash account",
    errors
  );

  const liabilities: Liability[] = [];
  for (const [index, raw] of (body.liabilities as unknown[]).entries()) {
    if (!isRecord(raw)) {
      errors.push(`liabilities[${index}] must be an object.`);
      continue;
    }
    if (!isNonEmptyString(raw.id)) {
      errors.push(`liabilities[${index}].id is required.`);
      continue;
    }
    const sectionId = requireSectionId(raw.sectionId, "liabilities", `liabilities[${index}]`);
    if (!sectionId) continue;
    const balance = requireFiniteNumber(
      raw.balance,
      `liabilities[${index}].balance`,
      errors
    );
    if (balance === null) continue;
    if (!isNonEmptyString(raw.name)) {
      errors.push(`liabilities[${index}].name is required.`);
      continue;
    }
    liabilities.push({
      id: raw.id,
      name: raw.name.trim(),
      sectionId,
      balance,
      initialBalance: optionalFiniteNumber(raw.initialBalance),
      interestAccrued: optionalFiniteNumber(raw.interestAccrued),
      apy: optionalFiniteNumber(raw.apy),
      collateral: optionalFiniteNumber(raw.collateral),
      lltv: optionalFiniteNumber(raw.lltv),
      ltv: optionalFiniteNumber(raw.ltv),
      liquidationPrice: optionalFiniteNumber(raw.liquidationPrice),
      address: optionalString(raw.address),
    });
  }

  collectDuplicateIds(
    liabilities.map((l) => l.id),
    "liability",
    errors
  );

  const planningItems: PlanningItem[] = [];
  for (const [index, raw] of (body.planningItems as unknown[]).entries()) {
    if (!isRecord(raw)) {
      errors.push(`planningItems[${index}] must be an object.`);
      continue;
    }
    if (!isNonEmptyString(raw.id)) {
      errors.push(`planningItems[${index}].id is required.`);
      continue;
    }
    const sectionId = requireSectionId(raw.sectionId, "planning", `planningItems[${index}]`);
    if (!sectionId) continue;
    if (!isNonEmptyString(raw.title)) {
      errors.push(`planningItems[${index}].title is required.`);
      continue;
    }
    const status = raw.status as PlanningItem["status"];
    if (!GOAL_STATUSES.includes(status)) {
      errors.push(`planningItems[${index}].status is invalid.`);
      continue;
    }
    const trackPage = raw.trackPage as PlanningItem["trackPage"] | undefined;
    if (trackPage != null && !TRACK_PAGES.includes(trackPage)) {
      errors.push(`planningItems[${index}].trackPage is invalid.`);
      continue;
    }
    const trackSectionId = optionalString(raw.trackSectionId);
    if (
      trackSectionId &&
      trackPage &&
      !hasSectionOnPage(trackSectionId, trackPage)
    ) {
      errors.push(`planningItems[${index}].trackSectionId is unknown for trackPage.`);
      continue;
    }
    planningItems.push({
      id: raw.id,
      sectionId,
      title: raw.title.trim(),
      targetAmount: optionalFiniteNumber(raw.targetAmount),
      currentAmount: optionalFiniteNumber(raw.currentAmount),
      targetDate: optionalString(raw.targetDate),
      status,
      notes: optionalString(raw.notes),
      trackPage,
      trackSectionId,
    });
  }

  collectDuplicateIds(
    planningItems.map((i) => i.id),
    "planning item",
    errors
  );

  const spendingItems: SpendingItem[] = [];
  for (const [index, raw] of (body.spendingItems as unknown[]).entries()) {
    if (!isRecord(raw)) {
      errors.push(`spendingItems[${index}] must be an object.`);
      continue;
    }
    if (!isNonEmptyString(raw.id)) {
      errors.push(`spendingItems[${index}].id is required.`);
      continue;
    }
    const sectionId = requireSectionId(raw.sectionId, "spending", `spendingItems[${index}]`);
    if (!sectionId) continue;
    if (!isNonEmptyString(raw.name)) {
      errors.push(`spendingItems[${index}].name is required.`);
      continue;
    }
    const budget = requireFiniteNumber(
      raw.budget,
      `spendingItems[${index}].budget`,
      errors
    );
    const spent = requireFiniteNumber(
      raw.spent,
      `spendingItems[${index}].spent`,
      errors
    );
    if (budget === null || spent === null) continue;
    const frequency = raw.frequency as SpendingItem["frequency"];
    if (!SPEND_FREQUENCIES.includes(frequency)) {
      errors.push(`spendingItems[${index}].frequency is invalid.`);
      continue;
    }
    spendingItems.push({
      id: raw.id,
      sectionId,
      name: raw.name.trim(),
      budget,
      spent,
      frequency,
      notes: optionalString(raw.notes),
    });
  }

  collectDuplicateIds(
    spendingItems.map((i) => i.id),
    "spending item",
    errors
  );

  let allocationNodes: AllocationNode[] | undefined;
  if (body.allocationNodes !== undefined) {
    if (!Array.isArray(body.allocationNodes)) {
      errors.push('"allocationNodes" must be an array.');
    } else {
      allocationNodes = [];
      const nodeIds = new Set<string>();
      for (const [index, raw] of body.allocationNodes.entries()) {
        if (!isRecord(raw)) {
          errors.push(`allocationNodes[${index}] must be an object.`);
          continue;
        }
        if (!isNonEmptyString(raw.id)) {
          errors.push(`allocationNodes[${index}].id is required.`);
          continue;
        }
        const percentOfParent = requireFiniteNumber(
          raw.percentOfParent,
          `allocationNodes[${index}].percentOfParent`,
          errors
        );
        const order = requireFiniteNumber(
          raw.order,
          `allocationNodes[${index}].order`,
          errors
        );
        if (percentOfParent === null || order === null) continue;
        if (!isNonEmptyString(raw.label)) {
          errors.push(`allocationNodes[${index}].label is required.`);
          continue;
        }
        const targetMode =
          raw.targetMode === "amount" || raw.targetMode === "percent" ? raw.targetMode : undefined;
        let monthlyAmount: number | undefined;
        if (raw.monthlyAmount !== undefined && raw.monthlyAmount !== null) {
          const parsed = requireFiniteNumber(
            raw.monthlyAmount,
            `allocationNodes[${index}].monthlyAmount`,
            errors
          );
          if (parsed === null) continue;
          monthlyAmount = parsed;
        }
        if (targetMode === "amount" && (monthlyAmount == null || monthlyAmount < 0)) {
          errors.push(`allocationNodes[${index}].monthlyAmount is required when targetMode is "amount".`);
          continue;
        }
        const parentId =
          raw.parentId === null ? null : optionalString(raw.parentId) ?? null;
        if (raw.parentId != null && parentId === null) {
          errors.push(`allocationNodes[${index}].parentId is invalid.`);
          continue;
        }
        nodeIds.add(raw.id);
        allocationNodes.push({
          id: raw.id,
          parentId,
          label: raw.label.trim(),
          percentOfParent,
          order,
          notes: optionalString(raw.notes),
          targetMode,
          monthlyAmount: targetMode === "amount" ? monthlyAmount : undefined,
          trackPage: TRACK_PAGES.includes(raw.trackPage as (typeof TRACK_PAGES)[number])
            ? (raw.trackPage as PlanningItem["trackPage"])
            : undefined,
          trackSectionId: optionalString(raw.trackSectionId),
        });
      }
      for (const node of allocationNodes) {
        if (node.parentId && !nodeIds.has(node.parentId)) {
          errors.push(`allocationNodes: unknown parentId "${node.parentId}".`);
        }
      }
      collectDuplicateIds(
        allocationNodes.map((n) => n.id),
        "allocation node",
        errors
      );
    }
  }

  let walletMapNodes: WalletMapNode[] | undefined;
  if (body.walletMapNodes !== undefined) {
    if (!Array.isArray(body.walletMapNodes)) {
      errors.push('"walletMapNodes" must be an array.');
    } else {
      walletMapNodes = [];
      const nodeIds = new Set<string>();
      for (const [index, raw] of body.walletMapNodes.entries()) {
        if (!isRecord(raw)) {
          errors.push(`walletMapNodes[${index}] must be an object.`);
          continue;
        }
        if (!isNonEmptyString(raw.id)) {
          errors.push(`walletMapNodes[${index}].id is required.`);
          continue;
        }
        const order = requireFiniteNumber(
          raw.order,
          `walletMapNodes[${index}].order`,
          errors
        );
        if (order === null) continue;
        if (!isNonEmptyString(raw.label)) {
          errors.push(`walletMapNodes[${index}].label is required.`);
          continue;
        }
        const status = raw.status;
        if (status !== "active" && status !== "planned") {
          errors.push(`walletMapNodes[${index}].status is invalid.`);
          continue;
        }
        const parentId =
          raw.parentId === null ? null : optionalString(raw.parentId) ?? null;
        nodeIds.add(raw.id);
        walletMapNodes.push({
          id: raw.id,
          parentId,
          label: raw.label.trim(),
          order,
          owner: optionalString(raw.owner),
          walletType: optionalString(raw.walletType) as WalletMapNode["walletType"],
          address: optionalString(raw.address) ?? optionalString(raw.identifier),
          networks:
            parseWalletNetworks(raw.networks) ??
            (typeof raw.chain === "string"
              ? parseWalletNetworks([raw.chain])
              : undefined),
          addresses: parseWalletAddresses(raw.addresses),
          links: parseWalletLinks(raw.links),
          morphoMappings: parseMorphoMappings(raw.morphoMappings),
          syncEnabled: raw.syncEnabled === true,
          status,
          notes: optionalString(raw.notes),
        });
      }
      for (const node of walletMapNodes) {
        if (node.parentId && !nodeIds.has(node.parentId)) {
          errors.push(`walletMapNodes: unknown parentId "${node.parentId}".`);
        }
      }
      collectDuplicateIds(
        walletMapNodes.map((n) => n.id),
        "wallet map node",
        errors
      );
    }
  }

  let incomePlan: IncomePlanConfig | undefined;
  if (body.incomePlan !== undefined) {
    if (!isRecord(body.incomePlan) || typeof body.incomePlan.description !== "string") {
      errors.push('"incomePlan.description" must be a string.');
    } else {
      incomePlan = { description: body.incomePlan.description };
    }
  }

  let uiPreferences: UiPreferences | undefined;
  if (body.uiPreferences !== undefined) {
    if (!isRecord(body.uiPreferences)) {
      errors.push('"uiPreferences" must be an object.');
    } else {
      const nav = body.uiPreferences.navPages;
      const tabs = body.uiPreferences.planTabs;
      if (!isRecord(nav) || !isRecord(tabs)) {
        errors.push('"uiPreferences" must include navPages and planTabs.');
      } else {
        const navKeys = ["assets", "cash", "liabilities", "plan"] as const;
        const tabKeys = ["income", "wallets", "budget", "goals"] as const;
        const navValid =
          navKeys.every((k) => typeof nav[k] === "boolean") &&
          (typeof nav.overview === "boolean" || nav.overview === undefined) &&
          (typeof nav.wallets === "boolean" || nav.wallets === undefined);
        const tabsValid = tabKeys.every((k) => typeof tabs[k] === "boolean");
        if (!navValid || !tabsValid) {
          errors.push('"uiPreferences" has invalid navigation flags.');
        } else {
          const chart = isRecord(body.uiPreferences.overviewChart)
            ? body.uiPreferences.overviewChart
            : undefined;
          const lineType = chart?.lineType as OverviewChartLineType | undefined;
          const validLineTypes: OverviewChartLineType[] = [
            "monotone",
            "linear",
            "natural",
            "step",
            "stepBefore",
            "stepAfter",
          ];
          const rawTheme = body.uiPreferences.theme;
          uiPreferences = {
            theme: normalizeThemePreference(
              typeof rawTheme === "string" ? rawTheme : undefined
            ),
            navPages: {
              overview:
                typeof nav.overview === "boolean" ? (nav.overview as boolean) : true,
              assets: nav.assets as boolean,
              cash: nav.cash as boolean,
              liabilities: nav.liabilities as boolean,
              wallets:
                typeof nav.wallets === "boolean" ? (nav.wallets as boolean) : true,
              plan: nav.plan as boolean,
            },
            planTabs: {
              income: tabs.income as boolean,
              wallets: tabs.wallets as boolean,
              budget: tabs.budget as boolean,
              goals: tabs.goals as boolean,
            },
            overviewChart: normalizeOverviewChart({
              showBar: typeof chart?.showBar === "boolean" ? chart.showBar : undefined,
              showLine: typeof chart?.showLine === "boolean" ? chart.showLine : undefined,
              barColor:
                typeof chart?.barColor === "string" ? chart.barColor : undefined,
              lineColor:
                typeof chart?.lineColor === "string" ? chart.lineColor : undefined,
              lineType:
                lineType && validLineTypes.includes(lineType) ? lineType : undefined,
              showCostBasisLine:
                typeof chart?.showCostBasisLine === "boolean"
                  ? chart.showCostBasisLine
                  : undefined,
              costBasisLineColor:
                typeof chart?.costBasisLineColor === "string"
                  ? chart.costBasisLineColor
                  : undefined,
            }),
            sidebarCompact:
              typeof body.uiPreferences.sidebarCompact === "boolean"
                ? body.uiPreferences.sidebarCompact
                : false,
            monthlyAutoSnapshot:
              typeof body.uiPreferences.monthlyAutoSnapshot === "boolean"
                ? body.uiPreferences.monthlyAutoSnapshot
                : false,
            netWorthSnapshotCadence: normalizeNetWorthSnapshotCadence(
              body.uiPreferences.netWorthSnapshotCadence
            ),
            morphoVaultDisplayMode:
              body.uiPreferences.morphoVaultDisplayMode === "underlying"
                ? "underlying"
                : body.uiPreferences.morphoVaultDisplayMode === "share_price"
                  ? "share_price"
                  : undefined,
            overviewWidgets: normalizeOverviewWidgets(
              parseOverviewWidgets(body.uiPreferences.overviewWidgets)
            ),
          };
        }
      }
    }
  }

  if (!uiPreferences) {
    uiPreferences = structuredClone(EMPTY_UI_PREFERENCES);
  }

  let legacyConnectedWallets:
    | Array<{
        id: string;
        label: string;
        address: string;
        networks?: WalletChain[];
        chain?: WalletChain;
        notes?: string;
        links?: WalletMapNode["links"];
      }>
    | undefined;
  if (body.connectedWallets !== undefined) {
    if (!Array.isArray(body.connectedWallets)) {
      errors.push('"connectedWallets" must be an array.');
    } else {
      legacyConnectedWallets = [];
      const walletIds = new Set<string>();
      const chains: WalletChain[] = ["ethereum", "base", "bitcoin", "solana", "other"];
      for (const [index, raw] of body.connectedWallets.entries()) {
        if (!isRecord(raw)) {
          errors.push(`connectedWallets[${index}] must be an object.`);
          continue;
        }
        if (!isNonEmptyString(raw.id)) {
          errors.push(`connectedWallets[${index}].id is required.`);
          continue;
        }
        if (walletIds.has(raw.id)) {
          errors.push(`Duplicate wallet id: ${raw.id}`);
          continue;
        }
        if (!isNonEmptyString(raw.label) || !isNonEmptyString(raw.address)) {
          errors.push(`connectedWallets[${index}].label and address are required.`);
          continue;
        }

        let networks: WalletChain[] | undefined;
        if (Array.isArray(raw.networks)) {
          networks = raw.networks.filter(
            (value): value is WalletChain =>
              typeof value === "string" && chains.includes(value as WalletChain)
          );
        } else if (typeof raw.chain === "string" && chains.includes(raw.chain as WalletChain)) {
          networks = [raw.chain as WalletChain];
        }

        if (!networks || networks.length === 0) {
          errors.push(`connectedWallets[${index}].networks must be a non-empty array.`);
          continue;
        }

        walletIds.add(raw.id);
        const links = isRecord(raw.links) ? raw.links : undefined;
        legacyConnectedWallets.push({
          id: raw.id,
          label: raw.label.trim(),
          address: raw.address.trim(),
          networks,
          notes: optionalString(raw.notes),
          links: links
            ? {
                assetsSectionId: optionalString(links.assetsSectionId),
                cashSectionId: optionalString(links.cashSectionId),
                liabilitiesSectionId: optionalString(links.liabilitiesSectionId),
              }
            : undefined,
        });
      }
    }
  }

  let monthlyIncome: number | undefined;
  if (body.monthlyIncome !== undefined && body.monthlyIncome !== null) {
    if (typeof body.monthlyIncome !== "number" || !Number.isFinite(body.monthlyIncome)) {
      errors.push('"monthlyIncome" must be a number.');
    } else {
      monthlyIncome = body.monthlyIncome;
    }
  }

  let netWorthHistory: import("@/types").NetWorthSnapshot[] | undefined;
  if (body.netWorthHistory !== undefined && body.netWorthHistory !== null) {
    if (!Array.isArray(body.netWorthHistory)) {
      errors.push('"netWorthHistory" must be an array.');
    } else {
      netWorthHistory = body.netWorthHistory as import("@/types").NetWorthSnapshot[];
    }
  }

  if (errors.length > 0) {
    const summary =
      errors.length === 1
        ? errors[0]
        : `Import rejected: ${errors.slice(0, 3).join(" ")}${
            errors.length > 3 ? ` (+${errors.length - 3} more)` : ""
          }`;
    return { ok: false, error: summary };
  }

  return {
    ok: true,
    data: normalizePortfolioEntityIds({
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
      connectedWallets: legacyConnectedWallets,
      monthlyIncome,
      netWorthHistory,
    }),
  };
}
