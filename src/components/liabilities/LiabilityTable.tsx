"use client";

import { useMemo, useState } from "react";
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
import { LiabilityDrawer } from "@/components/liabilities/LiabilityDrawer";
import { SectionDrawer } from "@/components/sections/SectionDrawer";
import { SectionGroupBlock, UngroupedSectionsBlock } from "@/components/sections/SectionGroupBlock";
import { SectionGroupDrawer } from "@/components/sections/SectionGroupDrawer";
import { AddSectionButton } from "@/components/sections/SectionHeader";
import { toggleColumnInSet } from "@/components/shared/ColumnPickerPopover";
import { PortfolioPageToolbar, type PortfolioSectionNavItem } from "@/components/shared/PortfolioPageToolbar";
import { PortfolioSectionBlock } from "@/components/shared/PortfolioSectionBlock";
import {
  DEFAULT_LIABILITY_COLUMNS,
  getLiabilityFilterColumnOptions,
  LIABILITY_CORE_COLUMNS,
  LIABILITY_DEFI_COLUMNS,
  LIABILITY_OPTIONAL_COLUMNS,
  LIABILITY_POSITION_COLUMNS,
  type LiabilityColumnKey,
} from "@/components/liabilities/liability-columns";
import { formatAssetNetworkLabel } from "@/lib/asset-network";
import {
  isDefiLiabilitySection,
  isPositionLiabilitySection,
  sectionShowsNetworkColumn,
  sectionShowsProtocolColumn,
} from "@/lib/section-columns";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { computeTotalLiabilities } from "@/lib/mock-data";
import { sumLiabilitySectionTotals } from "@/lib/section-totals";
import { sortLiabilitiesInSection } from "@/lib/position-sort";
import { formatCurrency, formatMoneyColumn, formatPercent } from "@/lib/utils";
import { LtvBar } from "@/components/liabilities/LtvBar";
import { formatSectionTotal, portfolioPanel } from "@/lib/portfolio-panel";
import {
  buildPageSectionLayout,
  formatSectionDisplayLabel,
  sectionFilterMatches,
} from "@/lib/section-groups";
import type { Liability, PortfolioSection, SectionGroup } from "@/types";

const debtCell = "text-red-500/90 dark:text-red-400/85";

function matchesSearch(liability: Liability, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    liability.name.toLowerCase().includes(q) ||
    (liability.address?.toLowerCase().includes(q) ?? false) ||
    (liability.protocol?.toLowerCase().includes(q) ?? false) ||
    formatAssetNetworkLabel(liability.network).toLowerCase().includes(q)
  );
}

function showLiabilityColumn(
  key: LiabilityColumnKey,
  section: PortfolioSection,
  visibleColumns: Set<LiabilityColumnKey>
): boolean {
  if (LIABILITY_CORE_COLUMNS.has(key)) return true;

  if (LIABILITY_DEFI_COLUMNS.has(key)) {
    return isDefiLiabilitySection(section);
  }

  if (LIABILITY_POSITION_COLUMNS.has(key)) {
    if (!isPositionLiabilitySection(section)) return false;
    if (key === "network") return sectionShowsNetworkColumn(section);
    if (key === "protocol") return sectionShowsProtocolColumn(section);
    return false;
  }

  if (LIABILITY_OPTIONAL_COLUMNS.has(key)) {
    return visibleColumns.has(key);
  }

  return visibleColumns.has(key);
}

function fmtMoney(value: number | undefined): string {
  return value != null ? formatCurrency(value) : "—";
}

function fmtPct(value: number | undefined): string {
  return value != null ? `${value}%` : "—";
}

const LIABILITY_COLUMN_ORDER: LiabilityColumnKey[] = [
  "name",
  "totalDebt",
  "network",
  "protocol",
  "initialBalance",
  "interestAccrued",
  "apy",
  "address",
  "collateral",
  "lltv",
  "ltv",
  "liquidationPrice",
];

const LIABILITY_SUM_COLUMNS = new Set<LiabilityColumnKey>([
  "totalDebt",
  "initialBalance",
  "interestAccrued",
  "collateral",
]);

function liabilityFooterLabelColSpan(
  section: PortfolioSection,
  visibleColumns: Set<LiabilityColumnKey>
): number {
  let span = 0;
  for (const key of LIABILITY_COLUMN_ORDER) {
    if (!showLiabilityColumn(key, section, visibleColumns)) continue;
    if (LIABILITY_SUM_COLUMNS.has(key)) break;
    span++;
  }
  return Math.max(span, 1);
}

export function LiabilityTable() {
  const {
    liabilities,
    sectionGroups,
    getSections,
    getSectionGroups,
    upsertSectionGroup,
    deleteSectionGroup,
    upsertLiability,
    deleteLiability,
    upsertSection,
    deleteSection,
  } = usePortfolio();
  const sections = getSections("liabilities");
  const groups = getSectionGroups("liabilities");
  const filterIds = useMemo(
    () => [...groups.map((group) => `group:${group.id}`), ...sections.map((s) => s.id)],
    [groups, sections]
  );
  const { sectionFilter, setSectionFilter, highlightSectionId } =
    useSectionFilterFromUrl(filterIds);
  useScrollToSectionFromUrl();

  const [search, setSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Set<LiabilityColumnKey>>(
    () => new Set(DEFAULT_LIABILITY_COLUMNS)
  );

  const [liabilityDrawerOpen, setLiabilityDrawerOpen] = useState(false);
  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);
  const [groupDrawerOpen, setGroupDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Liability | null>(null);
  const [editingSection, setEditingSection] = useState<PortfolioSection | null>(null);
  const [editingGroup, setEditingGroup] = useState<SectionGroup | null>(null);
  const [defaultSectionId, setDefaultSectionId] = useState<string | undefined>();
  const [defaultGroupId, setDefaultGroupId] = useState<string | undefined>();

  const liabilityFilterOptions = useMemo(() => getLiabilityFilterColumnOptions(), []);

  const panel = portfolioPanel("liabilities");

  const sectionDebtById = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const item of liabilities) {
      totals[item.sectionId] = (totals[item.sectionId] ?? 0) + item.balance;
    }
    return totals;
  }, [liabilities]);

  const visibleSections = useMemo(() => {
    if (sectionFilter === "all") return sections;
    return sections.filter((section) => sectionFilterMatches(sectionFilter, section));
  }, [sections, sectionFilter]);

  const pageLayout = useMemo(
    () => buildPageSectionLayout("liabilities", sectionGroups, visibleSections, sectionDebtById),
    [sectionGroups, visibleSections, sectionDebtById]
  );

  const { resultCount, itemsBySection } = useMemo(() => {
    let count = 0;
    const bySection: Record<string, Liability[]> = {};
    for (const section of visibleSections) {
      const rows = liabilities.filter(
        (l) => l.sectionId === section.id && matchesSearch(l, search)
      );
      bySection[section.id] = sortLiabilitiesInSection(section, rows);
      count += rows.length;
    }
    return { resultCount: count, itemsBySection: bySection };
  }, [liabilities, visibleSections, search]);

  const total = computeTotalLiabilities(liabilities);
  const showEmptySections = search.trim() === "" && sectionFilter === "all";

  const sectionNavItems: PortfolioSectionNavItem[] = useMemo(() => {
    const items = [
      ...groups.map((group) => {
        const memberIds = sections
          .filter((section) => section.groupId === group.id)
          .map((section) => section.id);
        return {
          id: `group:${group.id}`,
          label: group.name,
          value: memberIds.reduce((sum, id) => sum + (sectionDebtById[id] ?? 0), 0),
          assetCount: liabilities.filter((item) => memberIds.includes(item.sectionId)).length,
        };
      }),
      ...sections
        .filter((section) => !section.groupId)
        .map((section) => ({
          id: section.id,
          label: formatSectionDisplayLabel(section),
          value: sectionDebtById[section.id] ?? 0,
          assetCount: liabilities.filter((item) => item.sectionId === section.id).length,
        })),
    ];
    return items.sort((a, b) => b.value - a.value);
  }, [groups, sections, sectionDebtById, liabilities]);

  const saveSection = (section: PortfolioSection) => {
    if (editingSection) {
      upsertSection({ ...section, order: editingSection.order });
    } else {
      upsertSection({ ...section, order: sections.length });
    }
  };

  const col = (key: LiabilityColumnKey, section: PortfolioSection) =>
    showLiabilityColumn(key, section, visibleColumns);

  const handleSectionNavSelect = (sectionId: string) => {
    setSectionFilter(sectionId);
    scrollToPortfolioSection(sectionId);
  };

  const renderLiabilitySectionBlock = (section: PortfolioSection) => {
    const items = itemsBySection[section.id] ?? [];
    const isDefi = section.metadata?.isDefi ?? false;
    const showCol = (key: LiabilityColumnKey) => col(key, section);
    if (items.length === 0 && !showEmptySections) return null;
    const sectionTotals = items.length > 0 ? sumLiabilitySectionTotals(items) : null;
    const stats = sectionTotals
      ? [
          {
            label: "Debt",
            value: formatSectionTotal(sectionTotals.totalDebt),
            valueClassName: debtCell,
          },
          { label: "Collateral", value: formatSectionTotal(sectionTotals.collateral) },
          { label: "Interest", value: formatSectionTotal(sectionTotals.interestAccrued) },
        ]
      : [];

    return (
      <PortfolioSectionBlock
        key={section.id}
        sectionId={section.id}
        label={section.label}
        subtitle={section.metadata?.account}
        accent="liabilities"
        highlighted={highlightSectionId === section.id}
        addItemLabel="Add"
        onAddItem={() => {
          setEditing(null);
          setDefaultSectionId(section.id);
          setLiabilityDrawerOpen(true);
        }}
        onEditSection={() => {
          setEditingSection(section);
          setDefaultGroupId(section.groupId);
          setSectionDrawerOpen(true);
        }}
        onDeleteSection={() => deleteSection(section.id, "liabilities")}
        stats={stats}
        isEmpty={items.length === 0}
        emptyMessage="No liabilities in this section"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {showCol("name") && <TableHead className={panel.headCell}>Name</TableHead>}
              {showCol("totalDebt") && (
                <TableHead className={cn(panel.headCell, "text-right")}>Debt</TableHead>
              )}
              {showCol("network") && (
                <TableHead className={panel.headCell}>Network</TableHead>
              )}
              {showCol("protocol") && (
                <TableHead className={panel.headCell}>Protocol</TableHead>
              )}
              {showCol("initialBalance") && (
                <TableHead className={cn(panel.headCell, "text-right")}>Initial</TableHead>
              )}
              {showCol("interestAccrued") && (
                <TableHead className={cn(panel.headCell, "text-right")}>Interest</TableHead>
              )}
              {showCol("apy") && (
                <TableHead className={cn(panel.headCell, "text-right")}>APY</TableHead>
              )}
              {showCol("address") && <TableHead className={panel.headCell}>Address</TableHead>}
              {showCol("collateral") && (
                <TableHead className={cn(panel.headCell, "text-right")}>Collateral</TableHead>
              )}
              {showCol("lltv") && (
                <TableHead className={cn(panel.headCell, "text-right")}>LLTV</TableHead>
              )}
              {showCol("ltv") && (
                <TableHead className={cn(panel.headCell, "text-right")}>LTV</TableHead>
              )}
              {showCol("liquidationPrice") && (
                <TableHead className={cn(panel.headCell, "text-right")}>Liq. price</TableHead>
              )}
              <TableHead className={cn(panel.headCell, "w-14 text-right")} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((l) => (
              <TableRow key={l.id} className={panel.dataRow}>
                {showCol("name") && <TableCell className={panel.symbolCell}>{l.name}</TableCell>}
                {showCol("totalDebt") && (
                  <TableCell className={cn(panel.dataCell, "text-right", debtCell)}>
                    {formatMoneyColumn(l.balance)}
                  </TableCell>
                )}
                {showCol("network") && (
                  <TableCell className={panel.mutedCell}>
                    {formatAssetNetworkLabel(l.network)}
                  </TableCell>
                )}
                {showCol("protocol") && (
                  <TableCell className={panel.mutedCell}>{l.protocol ?? "—"}</TableCell>
                )}
                {showCol("initialBalance") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>
                    {fmtMoney(l.initialBalance)}
                  </TableCell>
                )}
                {showCol("interestAccrued") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>
                    {fmtMoney(l.interestAccrued)}
                  </TableCell>
                )}
                {showCol("apy") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>{fmtPct(l.apy)}</TableCell>
                )}
                {showCol("address") && (
                  <TableCell
                    className={cn(
                      panel.mutedCell,
                      "max-w-[140px] truncate font-mono text-[11px]"
                    )}
                  >
                    {l.address ?? "—"}
                  </TableCell>
                )}
                {showCol("collateral") && (
                  <TableCell className={cn(panel.dataCell, "text-right")}>
                    {l.collateral != null ? formatMoneyColumn(l.collateral) : "—"}
                  </TableCell>
                )}
                {showCol("lltv") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>{fmtPct(l.lltv)}</TableCell>
                )}
                {showCol("ltv") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>{fmtPct(l.ltv)}</TableCell>
                )}
                {showCol("liquidationPrice") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>
                    {l.liquidationPrice != null
                      ? formatMoneyColumn(l.liquidationPrice)
                      : "—"}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={panel.iconBtn}
                      onClick={() => {
                        setEditing(l);
                        setDefaultSectionId(l.sectionId);
                        setLiabilityDrawerOpen(true);
                      }}
                      aria-label={`Edit ${l.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(panel.iconBtn, "hover:text-destructive")}
                      onClick={() => deleteLiability(l.id)}
                      aria-label={`Delete ${l.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {sectionTotals ? (
            <TableFooter>
              <TableRow className={panel.footerRow}>
                <TableCell
                  colSpan={liabilityFooterLabelColSpan(section, visibleColumns)}
                  className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground"
                >
                  Section total
                </TableCell>
                {showCol("totalDebt") && (
                  <TableCell className={cn(panel.dataCell, "text-right font-medium", debtCell)}>
                    {formatSectionTotal(sectionTotals.totalDebt)}
                  </TableCell>
                )}
                {showCol("network") && <TableCell />}
                {showCol("protocol") && <TableCell />}
                {showCol("initialBalance") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>
                    {formatSectionTotal(sectionTotals.initialBalance)}
                  </TableCell>
                )}
                {showCol("interestAccrued") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>
                    {formatSectionTotal(sectionTotals.interestAccrued)}
                  </TableCell>
                )}
                {showCol("apy") && <TableCell />}
                {showCol("address") && <TableCell />}
                {showCol("collateral") && (
                  <TableCell className={cn(panel.dataCell, "text-right font-medium")}>
                    {formatSectionTotal(sectionTotals.collateral)}
                  </TableCell>
                )}
                {showCol("lltv") && <TableCell />}
                {showCol("ltv") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>
                    {sectionTotals.collateral > 0
                      ? formatPercent((sectionTotals.totalDebt / sectionTotals.collateral) * 100)
                      : "—"}
                  </TableCell>
                )}
                {showCol("liquidationPrice") && <TableCell />}
                <TableCell />
              </TableRow>
            </TableFooter>
          ) : null}
        </Table>

        {isDefi &&
          items.map(
            (l) =>
              l.ltv != null && (
                <div key={`ltv-${l.id}`} className="mt-2 border-t border-border/40 px-3 py-2">
                  <p className="mb-1.5 text-xs font-medium">{l.name}</p>
                  <LtvBar ltv={l.ltv} />
                </div>
              )
          )}
      </PortfolioSectionBlock>
    );
  };

  return (
    <div className="space-y-3">
      <PortfolioPageToolbar
        accent="liabilities"
        totalLabel="Total liabilities"
        totalValue={total}
        countLabel="liabilities"
        count={liabilities.length}
        resultCount={resultCount}
        sectionItems={sectionNavItems}
        activeSectionId={sectionFilter}
        onSectionSelect={handleSectionNavSelect}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Name or address…"
        columnOptions={liabilityFilterOptions}
        visibleColumns={visibleColumns}
        onToggleColumn={(key) =>
          setVisibleColumns((prev) => toggleColumnInSet(prev, key))
        }
      />

      <div className={panel.sectionStack}>
        {pageLayout.map((block) => {
          if (block.kind === "group") {
            const isEmptyGroup = block.sections.length === 0;
            const visibleMembers = block.sections.filter((section) => {
              const rows = itemsBySection[section.id] ?? [];
              return rows.length > 0 || showEmptySections;
            });
            if (!isEmptyGroup && visibleMembers.length === 0) return null;

            return (
              <SectionGroupBlock
                key={block.group.id}
                group={block.group}
                total={block.total}
                accent="liabilities"
                sectionCount={block.sections.length}
                onEditGroup={() => {
                  setEditingGroup(block.group);
                  setGroupDrawerOpen(true);
                }}
                onDeleteGroup={(mode) => deleteSectionGroup(block.group.id, mode)}
              >
                {isEmptyGroup ? (
                  <p className="px-3 py-3 text-sm text-muted-foreground">
                    No sections in this group. Use the trash icon to remove it.
                  </p>
                ) : (
                  block.sections.map((section) => renderLiabilitySectionBlock(section))
                )}
              </SectionGroupBlock>
            );
          }

          return (
            <UngroupedSectionsBlock key="ungrouped" total={block.total}>
              {block.sections.map((section) => renderLiabilitySectionBlock(section))}
            </UngroupedSectionsBlock>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <AddSectionButton
          accent="liabilities"
          onClick={() => {
            setEditingSection(null);
            setDefaultGroupId(undefined);
            setSectionDrawerOpen(true);
          }}
        />
        <AddSectionButton
          accent="liabilities"
          onClick={() => {
            setEditingGroup(null);
            setGroupDrawerOpen(true);
          }}
          label="Add group"
        />
      </div>

      <LiabilityDrawer
        open={liabilityDrawerOpen}
        onOpenChange={setLiabilityDrawerOpen}
        liability={editing}
        defaultSectionId={defaultSectionId}
        onSave={upsertLiability}
      />
      <SectionDrawer
        open={sectionDrawerOpen}
        onOpenChange={setSectionDrawerOpen}
        section={editingSection}
        page="liabilities"
        defaultGroupId={defaultGroupId}
        onSave={saveSection}
        showDefiToggle
        showCryptoToggle
      />
      <SectionGroupDrawer
        open={groupDrawerOpen}
        onOpenChange={setGroupDrawerOpen}
        group={editingGroup}
        page="liabilities"
        defaultOrder={groups.length}
        onSave={upsertSectionGroup}
      />
    </div>
  );
}
