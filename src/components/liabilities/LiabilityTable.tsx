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
  LIABILITY_COLUMN_OPTIONS,
  type LiabilityColumnKey,
} from "@/components/liabilities/liability-columns";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { computeTotalLiabilities } from "@/lib/mock-data";
import { sumLiabilitySectionTotals } from "@/lib/section-totals";
import { compareAlphabeticalDeferred } from "@/lib/position-sort";
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
    (liability.address?.toLowerCase().includes(q) ?? false)
  );
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

function liabilityFooterLabelColSpan(col: (key: LiabilityColumnKey) => boolean): number {
  let span = 0;
  for (const key of LIABILITY_COLUMN_ORDER) {
    if (!col(key)) continue;
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
      bySection[section.id] = [...rows].sort((a, b) =>
        compareAlphabeticalDeferred(a.name, b.name)
      );
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

  const col = (key: LiabilityColumnKey) => visibleColumns.has(key);

  const handleSectionNavSelect = (sectionId: string) => {
    setSectionFilter(sectionId);
    scrollToPortfolioSection(sectionId);
  };

  const renderLiabilitySectionBlock = (section: PortfolioSection) => {
    const items = itemsBySection[section.id] ?? [];
    const isDefi = section.metadata?.isDefi ?? false;
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
              {col("name") && <TableHead className={panel.headCell}>Name</TableHead>}
              {col("totalDebt") && (
                <TableHead className={cn(panel.headCell, "text-right")}>Debt</TableHead>
              )}
              {col("initialBalance") && (
                <TableHead className={cn(panel.headCell, "text-right")}>Initial</TableHead>
              )}
              {col("interestAccrued") && (
                <TableHead className={cn(panel.headCell, "text-right")}>Interest</TableHead>
              )}
              {col("apy") && (
                <TableHead className={cn(panel.headCell, "text-right")}>APY</TableHead>
              )}
              {col("address") && <TableHead className={panel.headCell}>Address</TableHead>}
              {col("collateral") && (
                <TableHead className={cn(panel.headCell, "text-right")}>Collateral</TableHead>
              )}
              {col("lltv") && (
                <TableHead className={cn(panel.headCell, "text-right")}>LLTV</TableHead>
              )}
              {col("ltv") && (
                <TableHead className={cn(panel.headCell, "text-right")}>LTV</TableHead>
              )}
              {col("liquidationPrice") && (
                <TableHead className={cn(panel.headCell, "text-right")}>Liq. price</TableHead>
              )}
              <TableHead className={cn(panel.headCell, "w-14 text-right")} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((l) => (
              <TableRow key={l.id} className={panel.dataRow}>
                {col("name") && <TableCell className={panel.symbolCell}>{l.name}</TableCell>}
                {col("totalDebt") && (
                  <TableCell className={cn(panel.dataCell, "text-right", debtCell)}>
                    {formatMoneyColumn(l.balance)}
                  </TableCell>
                )}
                {col("initialBalance") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>
                    {fmtMoney(l.initialBalance)}
                  </TableCell>
                )}
                {col("interestAccrued") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>
                    {fmtMoney(l.interestAccrued)}
                  </TableCell>
                )}
                {col("apy") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>{fmtPct(l.apy)}</TableCell>
                )}
                {col("address") && (
                  <TableCell
                    className={cn(
                      panel.mutedCell,
                      "max-w-[140px] truncate font-mono text-[11px]"
                    )}
                  >
                    {l.address ?? "—"}
                  </TableCell>
                )}
                {col("collateral") && (
                  <TableCell className={cn(panel.dataCell, "text-right")}>
                    {fmtMoney(l.collateral)}
                  </TableCell>
                )}
                {col("lltv") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>{fmtPct(l.lltv)}</TableCell>
                )}
                {col("ltv") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>{fmtPct(l.ltv)}</TableCell>
                )}
                {col("liquidationPrice") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>
                    {fmtMoney(l.liquidationPrice)}
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
                  colSpan={liabilityFooterLabelColSpan(col)}
                  className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground"
                >
                  Section total
                </TableCell>
                {col("totalDebt") && (
                  <TableCell className={cn(panel.dataCell, "text-right font-medium", debtCell)}>
                    {formatSectionTotal(sectionTotals.totalDebt)}
                  </TableCell>
                )}
                {col("initialBalance") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>
                    {formatSectionTotal(sectionTotals.initialBalance)}
                  </TableCell>
                )}
                {col("interestAccrued") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>
                    {formatSectionTotal(sectionTotals.interestAccrued)}
                  </TableCell>
                )}
                {col("apy") && <TableCell />}
                {col("address") && <TableCell />}
                {col("collateral") && (
                  <TableCell className={cn(panel.dataCell, "text-right font-medium")}>
                    {formatSectionTotal(sectionTotals.collateral)}
                  </TableCell>
                )}
                {col("lltv") && <TableCell />}
                {col("ltv") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>
                    {sectionTotals.collateral > 0
                      ? formatPercent((sectionTotals.totalDebt / sectionTotals.collateral) * 100)
                      : "—"}
                  </TableCell>
                )}
                {col("liquidationPrice") && <TableCell />}
                <TableCell />
              </TableRow>
            </TableFooter>
          ) : null}
        </Table>

        {isDefi &&
          col("ltv") &&
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
        columnOptions={LIABILITY_COLUMN_OPTIONS}
        visibleColumns={visibleColumns}
        onToggleColumn={(key) =>
          setVisibleColumns((prev) => toggleColumnInSet(prev, key))
        }
      />

      <div className={panel.sectionStack}>
        {pageLayout.map((block) => {
          if (block.kind === "group") {
            const visibleMembers = block.sections.filter((section) => {
              const rows = itemsBySection[section.id] ?? [];
              return rows.length > 0 || showEmptySections;
            });
            if (visibleMembers.length === 0) return null;

            return (
              <SectionGroupBlock
                key={block.group.id}
                group={block.group}
                total={block.total}
                accent="liabilities"
                onEditGroup={() => {
                  setEditingGroup(block.group);
                  setGroupDrawerOpen(true);
                }}
                onDeleteGroup={(mode) => deleteSectionGroup(block.group.id, mode)}
              >
                {block.sections.map((section) => renderLiabilitySectionBlock(section))}
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
