"use client";

import { useMemo, useState } from "react";
import { AssetMobileList } from "@/components/assets/AssetMobileList";
import { PageBreadcrumbs, type BreadcrumbItem } from "@/components/layout/PageBreadcrumbs";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useSectionFilterFromUrl, useScrollToSectionFromUrl, scrollToPortfolioSection } from "@/hooks/use-section-from-url";
import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AssetDrawer } from "@/components/assets/AssetDrawer";
import { type AssetColumnKey, getAssetColumnOptions } from "@/components/assets/AssetFilters";
import { PortfolioPageToolbar } from "@/components/shared/PortfolioPageToolbar";
import { PortfolioSectionBlock } from "@/components/shared/PortfolioSectionBlock";
import { SectionDrawer } from "@/components/sections/SectionDrawer";
import { SectionGroupBlock, UngroupedSectionsBlock } from "@/components/sections/SectionGroupBlock";
import { SectionGroupDrawer } from "@/components/sections/SectionGroupDrawer";
import { AddSectionButton } from "@/components/sections/SectionHeader";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { isDemoTenant } from "@/lib/demo-constants";
import {
  formatMoneyColumn,
  formatPercent,
  getAverageCost,
  getCostBasis,
  getGain,
  getGainColor,
  getMarketValue,
} from "@/lib/utils";
import {
  isCryptoAssetSection,
} from "@/lib/asset-sections";
import { compareAlphabeticalDeferred } from "@/lib/position-sort";
import { sumAssetSectionTotals } from "@/lib/section-totals";
import {
  buildPageSectionLayout,
  formatSectionDisplayLabel,
  sectionFilterMatches,
} from "@/lib/section-groups";
import { isFinnhubEligible, type MarketQuotesResponse } from "@/lib/finnhub";
import { apiErrorMessage } from "@/lib/format-error";
import { toast } from "sonner";
import { formatSectionTotal, portfolioPanel } from "@/lib/portfolio-panel";
import type { Asset, PortfolioSection, SectionGroup } from "@/types";

const DEFAULT_VISIBLE_COLUMNS: AssetColumnKey[] = [
  "symbol",
  "name",
  "price",
  "qty",
  "network",
  "protocol",
  "costBasis",
  "avgCost",
  "marketValue",
  "gainDollars",
  "gainPercent",
];

const WALLET_POSITION_COLUMNS = new Set<AssetColumnKey>(["network", "protocol"]);

function formatAllocationPercent(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
}

function matchesSearch(asset: Asset, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    asset.symbol.toLowerCase().includes(q) ||
    asset.name.toLowerCase().includes(q) ||
    (asset.protocol?.toLowerCase().includes(q) ?? false) ||
    (asset.network?.toLowerCase().includes(q) ?? false)
  );
}

function showColumn(
  key: AssetColumnKey,
  section: PortfolioSection,
  visibleColumns: Set<AssetColumnKey>
): boolean {
  if (!visibleColumns.has(key)) return false;
  if (WALLET_POSITION_COLUMNS.has(key)) return isCryptoAssetSection(section);
  return true;
}

const ASSET_COLUMN_ORDER: AssetColumnKey[] = [
  "symbol",
  "name",
  "price",
  "qty",
  "network",
  "protocol",
  "costBasis",
  "avgCost",
  "marketValue",
  "gainDollars",
  "gainPercent",
  "pctOfAssets",
  "pctOfClass",
];

const ASSET_SUM_COLUMNS = new Set<AssetColumnKey>([
  "costBasis",
  "marketValue",
  "gainDollars",
  "gainPercent",
]);

function assetFooterLabelColSpan(
  section: PortfolioSection,
  visibleColumns: Set<AssetColumnKey>
): number {
  let span = 0;
  for (const key of ASSET_COLUMN_ORDER) {
    if (!showColumn(key, section, visibleColumns)) continue;
    if (ASSET_SUM_COLUMNS.has(key)) break;
    span++;
  }
  return Math.max(span, 1);
}

const COLUMN_LABELS: Record<AssetColumnKey, string> = {
  symbol: "Symbol",
  name: "Name",
  price: "Price",
  qty: "Qty",
  network: "Network",
  protocol: "Protocol",
  costBasis: "Cost",
  avgCost: "Avg",
  marketValue: "Mkt val",
  gainDollars: "Gain $",
  gainPercent: "Gain %",
  pctOfAssets: "% port",
  pctOfClass: "% class",
};

const RIGHT_ALIGNED = new Set<AssetColumnKey>([
  "price",
  "qty",
  "costBasis",
  "avgCost",
  "marketValue",
  "gainDollars",
  "gainPercent",
  "pctOfAssets",
  "pctOfClass",
]);

export function AssetTable() {
  const {
    assets,
    sectionGroups,
    getSections,
    getSectionGroups,
    upsertSectionGroup,
    deleteSectionGroup,
    upsertAsset,
    deleteAsset,
    upsertSection,
    deleteSection,
    applyAssetPrices,
    account,
  } = usePortfolio();
  const isDemo = isDemoTenant(account.tenant);
  const sections = getSections("assets");
  const groups = getSectionGroups("assets");
  const filterIds = useMemo(
    () => [...groups.map((group) => `group:${group.id}`), ...sections.map((s) => s.id)],
    [groups, sections]
  );
  const { sectionFilter, setSectionFilter, highlightSectionId } =
    useSectionFilterFromUrl(filterIds);
  useScrollToSectionFromUrl();

  const [search, setSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Set<AssetColumnKey>>(
    () => new Set(DEFAULT_VISIBLE_COLUMNS)
  );

  const [assetDrawerOpen, setAssetDrawerOpen] = useState(false);
  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);
  const [groupDrawerOpen, setGroupDrawerOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingSection, setEditingSection] = useState<PortfolioSection | null>(null);
  const [editingGroup, setEditingGroup] = useState<SectionGroup | null>(null);
  const [defaultSectionId, setDefaultSectionId] = useState<string | undefined>();
  const [defaultGroupId, setDefaultGroupId] = useState<string | undefined>();
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [lastPriceRefresh, setLastPriceRefresh] = useState<Date | null>(null);
  const isMobile = useMediaQuery("(max-width: 767px)", true);
  const [mobileCardView, setMobileCardView] = useState(true);

  const finnhubEligibleCount = useMemo(
    () => assets.filter(isFinnhubEligible).length,
    [assets]
  );

  const walletSectionIds = useMemo(
    () => new Set(sections.filter(isCryptoAssetSection).map((s) => s.id)),
    [sections]
  );

  const showWalletPositionColumns = useMemo(() => {
    if (sectionFilter !== "all") {
      if (sectionFilter.startsWith("group:")) {
        const groupId = sectionFilter.slice("group:".length);
        return sections.some(
          (section) => section.groupId === groupId && isCryptoAssetSection(section)
        );
      }
      const section = sections.find((s) => s.id === sectionFilter);
      return section ? isCryptoAssetSection(section) : false;
    }
    return walletSectionIds.size > 0;
  }, [sectionFilter, sections, walletSectionIds]);

  const sectionMVById = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const asset of assets) {
      totals[asset.sectionId] = (totals[asset.sectionId] ?? 0) + getMarketValue(asset);
    }
    return totals;
  }, [assets]);

  const visibleSections = useMemo(() => {
    if (sectionFilter === "all") return sections;
    return sections.filter((section) => sectionFilterMatches(sectionFilter, section));
  }, [sections, sectionFilter]);

  const pageLayout = useMemo(
    () => buildPageSectionLayout("assets", sectionGroups, visibleSections, sectionMVById),
    [sectionGroups, visibleSections, sectionMVById]
  );

  const { resultCount, assetsBySection } = useMemo(() => {
    let count = 0;
    const bySection: Record<string, Asset[]> = {};
    for (const section of visibleSections) {
      const rows = assets.filter(
        (a) => a.sectionId === section.id && matchesSearch(a, search)
      );
      bySection[section.id] = [...rows].sort((a, b) =>
        compareAlphabeticalDeferred(a.symbol, b.symbol)
      );
      count += rows.length;
    }
    return { resultCount: count, assetsBySection: bySection };
  }, [assets, visibleSections, search]);

  const totalPortfolioMV = useMemo(
    () => assets.reduce((sum, a) => sum + getMarketValue(a), 0),
    [assets]
  );

  const sectionNavItems = useMemo(() => {
    const items = [
      ...groups.map((group) => {
        const memberIds = sections
          .filter((section) => section.groupId === group.id)
          .map((section) => section.id);
        return {
          id: `group:${group.id}`,
          label: group.name,
          value: memberIds.reduce((sum, id) => sum + (sectionMVById[id] ?? 0), 0),
          assetCount: assets.filter((asset) => memberIds.includes(asset.sectionId)).length,
        };
      }),
      ...sections
        .filter((section) => !section.groupId)
        .map((section) => ({
          id: section.id,
          label: formatSectionDisplayLabel(section),
          value: sectionMVById[section.id] ?? 0,
          assetCount: assets.filter((asset) => asset.sectionId === section.id).length,
        })),
    ];
    return items.sort((a, b) => b.value - a.value);
  }, [groups, sections, sectionMVById, assets]);

  const handleSectionNavSelect = (sectionId: string) => {
    setSectionFilter(sectionId);
    scrollToPortfolioSection(sectionId);
  };

  const toggleColumn = (key: AssetColumnKey) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const openAddAsset = (sectionId: string) => {
    setEditingAsset(null);
    setDefaultSectionId(sectionId);
    setAssetDrawerOpen(true);
  };

  const openEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setDefaultSectionId(asset.sectionId);
    setAssetDrawerOpen(true);
  };

  const saveSection = (section: PortfolioSection) => {
    if (editingSection) {
      upsertSection({ ...section, order: editingSection.order });
    } else {
      upsertSection({ ...section, order: sections.length });
    }
  };

  const showEmptySections = search.trim() === "" && sectionFilter === "all";
  const panel = portfolioPanel("assets");

  const renderColumnHeader = (section: PortfolioSection, key: AssetColumnKey) => {
    if (!showColumn(key, section, visibleColumns)) return null;
    return (
      <TableHead
        key={key}
        className={cn(panel.headCell, RIGHT_ALIGNED.has(key) && "text-right")}
      >
        {COLUMN_LABELS[key]}
      </TableHead>
    );
  };

  const renderAssetRow = (asset: Asset, section: PortfolioSection) => {
    const col = (key: AssetColumnKey) => showColumn(key, section, visibleColumns);
    const mv = getMarketValue(asset);
    const gain = getGain(asset);
    const avgCost = getAverageCost(asset);
    const costBasis = getCostBasis(asset);

    return (
      <TableRow key={asset.id} className={panel.dataRow}>
        {col("symbol") && (
          <TableCell className={panel.symbolCell}>{asset.symbol}</TableCell>
        )}
        {col("name") && (
          <TableCell className={cn(panel.mutedCell, "max-w-[160px] truncate")}>
            {asset.name}
          </TableCell>
        )}
        {col("price") && (
          <TableCell className={cn(panel.dataCell, "text-right")}>
            {formatMoneyColumn(asset.price)}
          </TableCell>
        )}
        {col("qty") && (
          <TableCell className={cn(panel.dataCell, "text-right")}>{asset.quantity}</TableCell>
        )}
        {col("network") && (
          <TableCell className={panel.mutedCell}>{asset.network ?? "—"}</TableCell>
        )}
        {col("protocol") && (
          <TableCell className={panel.mutedCell}>{asset.protocol ?? "—"}</TableCell>
        )}
        {col("costBasis") && (
          <TableCell className={cn(panel.dataCell, "text-right")}>
            {costBasis != null ? formatMoneyColumn(costBasis) : "—"}
          </TableCell>
        )}
        {col("avgCost") && (
          <TableCell className={cn(panel.mutedCell, "text-right")}>
            {avgCost != null ? formatMoneyColumn(avgCost) : "—"}
          </TableCell>
        )}
        {col("marketValue") && (
          <TableCell className={cn(panel.dataCell, "text-right font-medium")}>
            {formatMoneyColumn(mv)}
          </TableCell>
        )}
        {col("gainDollars") && (
          <TableCell className={cn(panel.dataCell, "text-right", getGainColor(gain.dollars))}>
            {formatMoneyColumn(gain.dollars)}
          </TableCell>
        )}
        {col("gainPercent") && (
          <TableCell className={cn(panel.dataCell, "text-right", getGainColor(gain.percent))}>
            {formatPercent(gain.percent)}
          </TableCell>
        )}
        {col("pctOfAssets") && (
          <TableCell className={cn(panel.mutedCell, "text-right")}>
            {totalPortfolioMV > 0 ? formatAllocationPercent((mv / totalPortfolioMV) * 100) : "—"}
          </TableCell>
        )}
        {col("pctOfClass") && (
          <TableCell className={cn(panel.mutedCell, "text-right")}>
            {(sectionMVById[asset.sectionId] ?? 0) > 0
              ? formatAllocationPercent((mv / sectionMVById[asset.sectionId]) * 100)
              : "—"}
          </TableCell>
        )}
        <TableCell className="px-1 py-0">
          <div className="flex justify-end gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className={panel.iconBtn}
              onClick={() => openEditAsset(asset)}
              aria-label={`Edit ${asset.symbol}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(panel.iconBtn, "hover:text-destructive")}
              onClick={() => deleteAsset(asset.id)}
              aria-label={`Delete ${asset.symbol}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderAssetSectionBlock = (section: PortfolioSection) => {
    const sectionAssets = assetsBySection[section.id] ?? [];
    if (sectionAssets.length === 0 && !showEmptySections) return null;

    const sectionTotals =
      sectionAssets.length > 0 ? sumAssetSectionTotals(sectionAssets) : null;
    const col = (key: AssetColumnKey) => showColumn(key, section, visibleColumns);

    const stats = sectionTotals
      ? [
          { label: "Cost", value: formatSectionTotal(sectionTotals.costBasis) },
          { label: "Mkt val", value: formatSectionTotal(sectionTotals.marketValue) },
          {
            label: "Gain",
            value: formatSectionTotal(sectionTotals.gainDollars),
            valueClassName: getGainColor(sectionTotals.gainDollars),
          },
          {
            label: "Gain %",
            value: formatPercent(sectionTotals.gainPercent),
            valueClassName: getGainColor(sectionTotals.gainPercent),
          },
        ]
      : [];

    return (
      <PortfolioSectionBlock
        key={section.id}
        sectionId={section.id}
        label={section.label}
        subtitle={section.metadata?.account}
        accent="assets"
        highlighted={highlightSectionId === section.id}
        addItemLabel="Add"
        onAddItem={() => openAddAsset(section.id)}
        onEditSection={() => {
          setEditingSection(section);
          setDefaultGroupId(section.groupId);
          setSectionDrawerOpen(true);
        }}
        onDeleteSection={() => deleteSection(section.id, "assets")}
        stats={stats}
        isEmpty={sectionAssets.length === 0}
        emptyMessage="No assets in this section"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {ASSET_COLUMN_ORDER.map((key) => renderColumnHeader(section, key))}
              <TableHead className={cn(panel.headCell, "w-14 text-right")} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sectionAssets.map((asset) => renderAssetRow(asset, section))}
          </TableBody>
          {sectionTotals ? (
            <TableFooter>
              <TableRow className={panel.footerRow}>
                <TableCell
                  colSpan={assetFooterLabelColSpan(section, visibleColumns)}
                  className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground"
                >
                  Section total
                </TableCell>
                {col("costBasis") && (
                  <TableCell className={cn(panel.dataCell, "text-right font-medium")}>
                    {formatSectionTotal(sectionTotals.costBasis)}
                  </TableCell>
                )}
                {col("avgCost") && <TableCell className={panel.dataCell} />}
                {col("marketValue") && (
                  <TableCell className={cn(panel.dataCell, "text-right font-medium")}>
                    {formatSectionTotal(sectionTotals.marketValue)}
                  </TableCell>
                )}
                {col("gainDollars") && (
                  <TableCell
                    className={cn(
                      panel.dataCell,
                      "text-right font-medium",
                      getGainColor(sectionTotals.gainDollars)
                    )}
                  >
                    {formatSectionTotal(sectionTotals.gainDollars)}
                  </TableCell>
                )}
                {col("gainPercent") && (
                  <TableCell
                    className={cn(
                      panel.dataCell,
                      "text-right font-medium",
                      getGainColor(sectionTotals.gainPercent)
                    )}
                  >
                    {formatPercent(sectionTotals.gainPercent)}
                  </TableCell>
                )}
                {col("pctOfAssets") && <TableCell className={panel.dataCell} />}
                {col("pctOfClass") && <TableCell className={panel.dataCell} />}
                <TableCell className={panel.dataCell} />
              </TableRow>
            </TableFooter>
          ) : null}
        </Table>
      </PortfolioSectionBlock>
    );
  };

  const refreshPrices = async () => {
    if (finnhubEligibleCount === 0) {
      toast.message("No stock/ETF/metal assets to refresh", {
        description: "Finnhub + Yahoo fallback for symbols without wallet or on-chain metadata.",
      });
      return;
    }

    setRefreshingPrices(true);
    try {
      const res = await fetch("/api/market/quotes", { method: "POST" });
      const data = (await res.json()) as MarketQuotesResponse;
      if (!res.ok) {
        toast.error("Price refresh failed", {
          description: apiErrorMessage(data.error, "Unknown error"),
        });
        return;
      }

      const prices = data.prices ?? {};
      const updated = applyAssetPrices(prices);
      const parts: string[] = [];
      if (updated > 0) parts.push(`${updated} price${updated === 1 ? "" : "s"} updated`);
      if ((data.notFound?.length ?? 0) > 0) {
        parts.push(`${data.notFound!.length} symbol(s) not found`);
      }
      if (typeof data.finnhubCalls === "number" && data.finnhubCalls > 0) {
        parts.push(`${data.finnhubCalls} Finnhub call${data.finnhubCalls === 1 ? "" : "s"}`);
      } else if (typeof data.apiCalls === "number" && data.apiCalls > 0) {
        parts.push(`${data.apiCalls} Finnhub call${data.apiCalls === 1 ? "" : "s"}`);
      }
      if (typeof data.yfinanceSymbols === "number" && data.yfinanceSymbols > 0) {
        parts.push(`Yahoo fallback (${data.yfinanceSymbols} symbol${data.yfinanceSymbols === 1 ? "" : "s"})`);
      }
      setLastPriceRefresh(new Date());
      toast.success("Prices refreshed", {
        description: parts.length > 0 ? parts.join(" · ") : data.message ?? "No changes",
      });
    } catch {
      toast.error("Price refresh failed", { description: "Could not reach the server." });
    } finally {
      setRefreshingPrices(false);
    }
  };

  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: "Overview", href: "/dashboard" },
      { label: "Assets", href: "/assets" },
    ];
    if (sectionFilter !== "all") {
      const nav = sectionNavItems.find((i) => i.id === sectionFilter);
      if (nav) items.push({ label: nav.label });
    }
    return items;
  }, [sectionFilter, sectionNavItems]);

  const showMobileCards = isMobile && mobileCardView;
  const flatFilteredAssets = useMemo(() => {
    const list: Asset[] = [];
    for (const section of visibleSections) {
      list.push(...(assetsBySection[section.id] ?? []));
    }
    return list;
  }, [visibleSections, assetsBySection]);

  return (
    <div className="space-y-3">
      <PageBreadcrumbs items={breadcrumbItems} />
      <PortfolioPageToolbar
        accent="assets"
        totalLabel="Total assets"
        totalValue={totalPortfolioMV}
        countLabel="holdings"
        count={assets.length}
        resultCount={resultCount}
        sectionItems={sectionNavItems}
        activeSectionId={sectionFilter}
        onSectionSelect={handleSectionNavSelect}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Symbol, name, protocol…"
        columnOptions={getAssetColumnOptions(showWalletPositionColumns)}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        refreshingPrices={isDemo ? false : refreshingPrices}
        onRefreshPrices={isDemo ? undefined : () => void refreshPrices()}
        lastPriceRefresh={isDemo ? null : lastPriceRefresh}
        pricesNote={isDemo ? "Demo — sample prices are fixed" : undefined}
        mobileCardView={isMobile ? mobileCardView : undefined}
        onMobileCardViewChange={isMobile ? setMobileCardView : undefined}
      />

      {showMobileCards && flatFilteredAssets.length > 0 ? (
        <AssetMobileList
          assets={flatFilteredAssets}
          totalPortfolioMV={totalPortfolioMV}
          onEdit={openEditAsset}
        />
      ) : null}

      {sections.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">No sections yet. Add one below.</p>
      ) : showMobileCards ? null : (
        <div className={panel.sectionStack}>
          {pageLayout.map((block) => {
            if (block.kind === "group") {
              const visibleMembers = block.sections.filter((section) => {
                const rows = assetsBySection[section.id] ?? [];
                return rows.length > 0 || showEmptySections;
              });
              if (visibleMembers.length === 0) return null;

              return (
                <SectionGroupBlock
                  key={block.group.id}
                  group={block.group}
                  total={block.total}
                  accent="assets"
                  onEditGroup={() => {
                    setEditingGroup(block.group);
                    setGroupDrawerOpen(true);
                  }}
                  onDeleteGroup={(mode) => deleteSectionGroup(block.group.id, mode)}
                >
                  {block.sections.map((section) => renderAssetSectionBlock(section))}
                </SectionGroupBlock>
              );
            }

            return (
              <UngroupedSectionsBlock key="ungrouped" total={block.total}>
                {block.sections.map((section) => renderAssetSectionBlock(section))}
              </UngroupedSectionsBlock>
            );
          })}
        </div>
      )}

      {resultCount === 0 && sections.length > 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No assets match your filters.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <AddSectionButton
          accent="assets"
          onClick={() => {
            setEditingSection(null);
            setDefaultGroupId(undefined);
            setSectionDrawerOpen(true);
          }}
          label="Add section"
        />
        <AddSectionButton
          accent="assets"
          onClick={() => {
            setEditingGroup(null);
            setGroupDrawerOpen(true);
          }}
          label="Add group"
        />
      </div>

      <AssetDrawer
        open={assetDrawerOpen}
        onOpenChange={setAssetDrawerOpen}
        asset={editingAsset}
        defaultSectionId={defaultSectionId}
        onSave={upsertAsset}
      />
      <SectionDrawer
        open={sectionDrawerOpen}
        onOpenChange={setSectionDrawerOpen}
        section={editingSection}
        page="assets"
        defaultGroupId={defaultGroupId}
        onSave={saveSection}
        showCryptoToggle
      />
      <SectionGroupDrawer
        open={groupDrawerOpen}
        onOpenChange={setGroupDrawerOpen}
        group={editingGroup}
        page="assets"
        defaultOrder={groups.length}
        onSave={upsertSectionGroup}
      />
    </div>
  );
}
