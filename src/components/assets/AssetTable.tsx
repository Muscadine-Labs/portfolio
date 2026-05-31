"use client";

import { useMemo, useState } from "react";
import { useSectionFilterFromUrl } from "@/hooks/use-section-from-url";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { AssetDrawer } from "@/components/assets/AssetDrawer";
import { AssetFilters, type AssetColumnKey } from "@/components/assets/AssetFilters";
import { SectionDrawer } from "@/components/sections/SectionDrawer";
import { SectionHeader, AddSectionButton } from "@/components/sections/SectionHeader";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import {
  formatCurrency,
  formatPercent,
  getAverageCost,
  getCostBasis,
  getGain,
  getGainColor,
  getMarketValue,
} from "@/lib/utils";
import {
  formatWalletAddress,
  getWalletForSection,
  isWalletAssetSection,
} from "@/lib/asset-sections";
import { sumAssetSectionTotals } from "@/lib/section-totals";
import type { Asset, PortfolioSection } from "@/types";

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
  if (WALLET_POSITION_COLUMNS.has(key)) return isWalletAssetSection(section);
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

export function AssetTable() {
  const {
    assets,
    connectedWallets,
    getSections,
    upsertAsset,
    deleteAsset,
    upsertSection,
    deleteSection,
  } = usePortfolio();
  const sections = getSections("assets");
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);
  const { sectionFilter, setSectionFilter, highlightSectionId } =
    useSectionFilterFromUrl(sectionIds);

  const [search, setSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Set<AssetColumnKey>>(
    () => new Set(DEFAULT_VISIBLE_COLUMNS)
  );

  const [assetDrawerOpen, setAssetDrawerOpen] = useState(false);
  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingSection, setEditingSection] = useState<PortfolioSection | null>(null);
  const [defaultSectionId, setDefaultSectionId] = useState<string | undefined>();

  const walletSectionIds = useMemo(
    () => new Set(sections.filter(isWalletAssetSection).map((s) => s.id)),
    [sections]
  );

  const showWalletPositionColumns = useMemo(() => {
    if (sectionFilter !== "all") {
      const section = sections.find((s) => s.id === sectionFilter);
      return section ? isWalletAssetSection(section) : false;
    }
    return walletSectionIds.size > 0;
  }, [sectionFilter, sections, walletSectionIds]);

  const filteredSections = useMemo(() => {
    if (sectionFilter === "all") return sections;
    return sections.filter((s) => s.id === sectionFilter);
  }, [sections, sectionFilter]);

  const { resultCount, assetsBySection } = useMemo(() => {
    let count = 0;
    const bySection: Record<string, Asset[]> = {};
    for (const section of filteredSections) {
      const rows = assets.filter(
        (a) => a.sectionId === section.id && matchesSearch(a, search)
      );
      bySection[section.id] = rows;
      count += rows.length;
    }
    return { resultCount: count, assetsBySection: bySection };
  }, [assets, filteredSections, search]);

  const totalPortfolioMV = useMemo(
    () => assets.reduce((sum, a) => sum + getMarketValue(a), 0),
    [assets]
  );

  const sectionMVById = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const asset of assets) {
      totals[asset.sectionId] = (totals[asset.sectionId] ?? 0) + getMarketValue(asset);
    }
    return totals;
  }, [assets]);

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

  return (
    <div className="space-y-6">
      <Card className="border-emerald-500/25 bg-gradient-to-br from-card to-emerald-500/5">
        <CardHeader>
          <CardTitle className="text-muted-foreground">Total Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tracking-tight text-emerald-400">
            <AnimatedNumber value={totalPortfolioMV} />
          </p>
        </CardContent>
      </Card>

      <AssetFilters
        search={search}
        onSearchChange={setSearch}
        sectionFilter={sectionFilter}
        onSectionFilterChange={setSectionFilter}
        sections={sections}
        showWalletPositionColumns={showWalletPositionColumns}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        resultCount={resultCount}
        totalCount={assets.length}
      />

      {sections.length === 0 && (
        <p className="text-sm text-muted-foreground">No sections yet. Add one below.</p>
      )}

      {filteredSections.map((section) => {
        const sectionAssets = assetsBySection[section.id] ?? [];
        if (sectionAssets.length === 0 && !showEmptySections) return null;

        const col = (key: AssetColumnKey) => showColumn(key, section, visibleColumns);
        const sectionTotals =
          sectionAssets.length > 0 ? sumAssetSectionTotals(sectionAssets) : null;
        const linkedWallet = getWalletForSection(section, connectedWallets);
        const sectionSubtitle = linkedWallet
          ? `${formatWalletAddress(linkedWallet.address)} · multi-chain`
          : undefined;

        return (
          <Card
            key={section.id}
            id={`section-${section.id}`}
            className={cn(
              "border-border/60 bg-card/80",
              highlightSectionId === section.id && "ring-2 ring-primary/40"
            )}
          >
            <SectionHeader
              title={section.label}
              subtitle={sectionSubtitle}
              onAddItem={() => openAddAsset(section.id)}
              onEditSection={() => {
                setEditingSection(section);
                setSectionDrawerOpen(true);
              }}
              onDeleteSection={() => deleteSection(section.id, "assets")}
              addItemLabel="Add Asset"
            />
            <CardContent className="overflow-x-auto p-0 pb-4">
              {sectionAssets.length === 0 ? (
                <p className="px-6 pb-4 text-sm text-muted-foreground">
                  {search.trim()
                    ? "No assets match your filters"
                    : "No assets in this section"}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {col("symbol") && <TableHead>Symbol</TableHead>}
                      {col("name") && <TableHead>Name</TableHead>}
                      {col("price") && (
                        <TableHead className="text-right">Price</TableHead>
                      )}
                      {col("qty") && <TableHead className="text-right">Qty</TableHead>}
                      {col("network") && <TableHead>Network</TableHead>}
                      {col("protocol") && <TableHead>Protocol</TableHead>}
                      {col("costBasis") && (
                        <TableHead className="text-right">Cost Basis</TableHead>
                      )}
                      {col("avgCost") && (
                        <TableHead className="text-right">Avg Cost / Share</TableHead>
                      )}
                      {col("marketValue") && (
                        <TableHead className="text-right">Market Value</TableHead>
                      )}
                      {col("gainDollars") && (
                        <TableHead className="text-right">Gain $</TableHead>
                      )}
                      {col("gainPercent") && (
                        <TableHead className="text-right">Gain %</TableHead>
                      )}
                      {col("pctOfAssets") && (
                        <TableHead className="text-right">% of Assets</TableHead>
                      )}
                      {col("pctOfClass") && (
                        <TableHead className="text-right">% of Class</TableHead>
                      )}
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectionAssets.map((asset) => {
                      const mv = getMarketValue(asset);
                      const gain = getGain(asset);
                      const avgCost = getAverageCost(asset);
                      const costBasis = getCostBasis(asset);

                      return (
                        <TableRow key={asset.id}>
                          {col("symbol") && (
                            <TableCell className="font-medium">{asset.symbol}</TableCell>
                          )}
                          {col("name") && (
                            <TableCell className="max-w-[180px] truncate text-muted-foreground">
                              {asset.name}
                            </TableCell>
                          )}
                          {col("price") && (
                            <TableCell className="text-right">
                              {formatCurrency(asset.price)}
                            </TableCell>
                          )}
                          {col("qty") && (
                            <TableCell className="text-right">{asset.quantity}</TableCell>
                          )}
                          {col("network") && (
                            <TableCell className="text-muted-foreground">
                              {asset.network ?? "—"}
                            </TableCell>
                          )}
                          {col("protocol") && (
                            <TableCell className="text-muted-foreground">
                              {asset.protocol ?? "—"}
                            </TableCell>
                          )}
                          {col("costBasis") && (
                            <TableCell className="text-right">
                              {costBasis != null ? formatCurrency(costBasis) : "—"}
                            </TableCell>
                          )}
                          {col("avgCost") && (
                            <TableCell className="text-right text-muted-foreground">
                              {avgCost != null ? formatCurrency(avgCost) : "—"}
                            </TableCell>
                          )}
                          {col("marketValue") && (
                            <TableCell className="text-right font-medium">
                              {formatCurrency(mv)}
                            </TableCell>
                          )}
                          {col("gainDollars") && (
                            <TableCell className={`text-right ${getGainColor(gain.dollars)}`}>
                              {formatCurrency(gain.dollars)}
                            </TableCell>
                          )}
                          {col("gainPercent") && (
                            <TableCell className={`text-right ${getGainColor(gain.percent)}`}>
                              {formatPercent(gain.percent)}
                            </TableCell>
                          )}
                          {col("pctOfAssets") && (
                            <TableCell className="text-right text-muted-foreground">
                              {totalPortfolioMV > 0
                                ? formatAllocationPercent((mv / totalPortfolioMV) * 100)
                                : "—"}
                            </TableCell>
                          )}
                          {col("pctOfClass") && (
                            <TableCell className="text-right text-muted-foreground">
                              {(sectionMVById[asset.sectionId] ?? 0) > 0
                                ? formatAllocationPercent(
                                    (mv / sectionMVById[asset.sectionId]) * 100
                                  )
                                : "—"}
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditAsset(asset)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => deleteAsset(asset.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  {sectionTotals ? (
                    <TableFooter>
                      <TableRow className="bg-muted/30 font-semibold hover:bg-muted/30">
                        <TableCell colSpan={assetFooterLabelColSpan(section, visibleColumns)}>
                          Section total
                        </TableCell>
                        {col("costBasis") && (
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(sectionTotals.costBasis)}
                          </TableCell>
                        )}
                        {col("avgCost") && <TableCell />}
                        {col("marketValue") && (
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(sectionTotals.marketValue)}
                          </TableCell>
                        )}
                        {col("gainDollars") && (
                          <TableCell
                            className={`text-right tabular-nums ${getGainColor(sectionTotals.gainDollars)}`}
                          >
                            {formatCurrency(sectionTotals.gainDollars)}
                          </TableCell>
                        )}
                        {col("gainPercent") && (
                          <TableCell
                            className={`text-right tabular-nums ${getGainColor(sectionTotals.gainPercent)}`}
                          >
                            {formatPercent(sectionTotals.gainPercent)}
                          </TableCell>
                        )}
                        {col("pctOfAssets") && <TableCell />}
                        {col("pctOfClass") && <TableCell />}
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  ) : null}
                </Table>
              )}
            </CardContent>
          </Card>
        );
      })}

      {resultCount === 0 && sections.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          No assets match your filters. Try clearing search or selecting All sections.
        </p>
      )}

      <AddSectionButton
        onClick={() => {
          setEditingSection(null);
          setSectionDrawerOpen(true);
        }}
      />

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
        onSave={saveSection}
        linkWallet
      />
    </div>
  );
}
