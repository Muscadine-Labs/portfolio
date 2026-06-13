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
import { CashDrawer } from "@/components/cash/CashDrawer";
import { SectionDrawer } from "@/components/sections/SectionDrawer";
import { SectionGroupBlock, UngroupedSectionsBlock } from "@/components/sections/SectionGroupBlock";
import { SectionGroupDrawer } from "@/components/sections/SectionGroupDrawer";
import { AddSectionButton } from "@/components/sections/SectionHeader";
import { toggleColumnInSet } from "@/components/shared/ColumnPickerPopover";
import { PortfolioPageToolbar, type PortfolioSectionNavItem } from "@/components/shared/PortfolioPageToolbar";
import { PortfolioSectionBlock } from "@/components/shared/PortfolioSectionBlock";
import {
  CASH_POSITION_COLUMNS,
  DEFAULT_CASH_COLUMNS,
  getCashColumnOptions,
  type CashColumnKey,
} from "@/components/cash/cash-columns";
import { formatAssetNetworkLabel } from "@/lib/asset-network";
import { isCryptoAssetSection } from "@/lib/asset-sections";
import {
  sectionShowsNetworkColumn,
  sectionShowsProtocolColumn,
} from "@/lib/section-columns";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { computeTotalCash } from "@/lib/mock-data";
import { sumCashPageTotals, sumCashSectionTotals } from "@/lib/section-totals";
import { sortCashInSection } from "@/lib/position-sort";
import { formatCurrency, formatMoneyColumn, formatPercent } from "@/lib/utils";
import { formatSectionTotal, portfolioPanel } from "@/lib/portfolio-panel";
import {
  buildPageSectionLayout,
  formatSectionDisplayLabel,
  sectionFilterMatches,
} from "@/lib/section-groups";
import type { CashAccount, PortfolioSection, SectionGroup } from "@/types";

function matchesSearch(account: CashAccount, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    account.name.toLowerCase().includes(q) ||
    (account.protocol?.toLowerCase().includes(q) ?? false) ||
    formatAssetNetworkLabel(account.network).toLowerCase().includes(q) ||
    (account.address?.toLowerCase().includes(q) ?? false)
  );
}

function showCashColumn(
  key: CashColumnKey,
  section: PortfolioSection,
  visibleColumns: Set<CashColumnKey>
): boolean {
  if (!visibleColumns.has(key)) return false;
  if (CASH_POSITION_COLUMNS.has(key)) {
    if (!isCryptoAssetSection(section)) return false;
    if (key === "network") return sectionShowsNetworkColumn(section);
    if (key === "protocol") return sectionShowsProtocolColumn(section);
  }
  return true;
}

function fmtOptional(value: number | undefined): string {
  return value != null ? formatCurrency(value) : "—";
}

const CASH_COLUMN_ORDER: CashColumnKey[] = [
  "name",
  "balance",
  "network",
  "protocol",
  "originalAmount",
  "interest",
  "address",
];

const CASH_SUM_COLUMNS = new Set<CashColumnKey>(["balance", "originalAmount", "interest"]);

function cashFooterLabelColSpan(
  section: PortfolioSection,
  visibleColumns: Set<CashColumnKey>
): number {
  let span = 0;
  for (const key of CASH_COLUMN_ORDER) {
    if (!showCashColumn(key, section, visibleColumns)) continue;
    if (CASH_SUM_COLUMNS.has(key)) break;
    span++;
  }
  return Math.max(span, 1);
}

export function CashPageContent() {
  const {
    cashAccounts,
    sectionGroups,
    getSections,
    getSectionGroups,
    upsertSectionGroup,
    deleteSectionGroup,
    upsertCashAccount,
    deleteCashAccount,
    upsertSection,
    deleteSection,
  } = usePortfolio();
  const sections = getSections("cash");
  const groups = getSectionGroups("cash");
  const filterIds = useMemo(
    () => [...groups.map((group) => `group:${group.id}`), ...sections.map((s) => s.id)],
    [groups, sections]
  );
  const { sectionFilter, setSectionFilter, highlightSectionId } =
    useSectionFilterFromUrl(filterIds);
  useScrollToSectionFromUrl();

  const [search, setSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Set<CashColumnKey>>(
    () => new Set(DEFAULT_CASH_COLUMNS)
  );

  const [cashDrawerOpen, setCashDrawerOpen] = useState(false);
  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);
  const [groupDrawerOpen, setGroupDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CashAccount | null>(null);
  const [editingSection, setEditingSection] = useState<PortfolioSection | null>(null);
  const [editingGroup, setEditingGroup] = useState<SectionGroup | null>(null);
  const [defaultSectionId, setDefaultSectionId] = useState<string | undefined>();
  const [defaultGroupId, setDefaultGroupId] = useState<string | undefined>();

  const showPositionInPicker = useMemo(
    () =>
      sections.some(
        (section) =>
          isCryptoAssetSection(section) &&
          (sectionShowsNetworkColumn(section) || sectionShowsProtocolColumn(section))
      ),
    [sections]
  );
  const cashColumnOptions = useMemo(
    () => getCashColumnOptions(showPositionInPicker),
    [showPositionInPicker]
  );

  const panel = portfolioPanel("cash");

  const sectionBalanceById = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const account of cashAccounts) {
      totals[account.sectionId] = (totals[account.sectionId] ?? 0) + account.balance;
    }
    return totals;
  }, [cashAccounts]);

  const visibleSections = useMemo(() => {
    if (sectionFilter === "all") return sections;
    return sections.filter((section) => sectionFilterMatches(sectionFilter, section));
  }, [sections, sectionFilter]);

  const pageLayout = useMemo(
    () => buildPageSectionLayout("cash", sectionGroups, visibleSections, sectionBalanceById),
    [sectionGroups, visibleSections, sectionBalanceById]
  );

  const { resultCount, accountsBySection } = useMemo(() => {
    let count = 0;
    const bySection: Record<string, CashAccount[]> = {};
    for (const section of visibleSections) {
      const rows = cashAccounts.filter(
        (a) => a.sectionId === section.id && matchesSearch(a, search)
      );
      bySection[section.id] = sortCashInSection(section, rows);
      count += rows.length;
    }
    return { resultCount: count, accountsBySection: bySection };
  }, [cashAccounts, visibleSections, search]);

  const total = computeTotalCash(cashAccounts);
  const pageTotals = useMemo(() => sumCashPageTotals(cashAccounts), [cashAccounts]);
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
          value: memberIds.reduce((sum, id) => sum + (sectionBalanceById[id] ?? 0), 0),
          assetCount: cashAccounts.filter((account) => memberIds.includes(account.sectionId))
            .length,
        };
      }),
      ...sections
        .filter((section) => !section.groupId)
        .map((section) => ({
          id: section.id,
          label: formatSectionDisplayLabel(section),
          value: sectionBalanceById[section.id] ?? 0,
          assetCount: cashAccounts.filter((account) => account.sectionId === section.id).length,
        })),
    ];
    return items.sort((a, b) => b.value - a.value);
  }, [groups, sections, sectionBalanceById, cashAccounts]);

  const saveSection = (section: PortfolioSection) => {
    if (editingSection) {
      upsertSection({ ...section, order: editingSection.order });
    } else {
      upsertSection({ ...section, order: sections.length });
    }
  };

  const col = (key: CashColumnKey, section: PortfolioSection) =>
    showCashColumn(key, section, visibleColumns);

  const handleSectionNavSelect = (sectionId: string) => {
    setSectionFilter(sectionId);
    scrollToPortfolioSection(sectionId);
  };

  const renderCashSectionBlock = (section: PortfolioSection) => {
    const accounts = accountsBySection[section.id] ?? [];
    const showCol = (key: CashColumnKey) => col(key, section);
    if (accounts.length === 0 && !showEmptySections) return null;
    const sectionTotals = accounts.length > 0 ? sumCashSectionTotals(accounts) : null;
    const stats = sectionTotals
      ? [
          { label: "Balance", value: formatSectionTotal(sectionTotals.balance) },
          { label: "Initial", value: formatSectionTotal(sectionTotals.originalAmount) },
          { label: "Interest", value: formatSectionTotal(sectionTotals.interest) },
        ]
      : [];

    return (
      <PortfolioSectionBlock
        key={section.id}
        sectionId={section.id}
        label={section.label}
        subtitle={section.metadata?.account}
        accent="cash"
        highlighted={highlightSectionId === section.id}
        addItemLabel="Add"
        onAddItem={() => {
          setEditing(null);
          setDefaultSectionId(section.id);
          setCashDrawerOpen(true);
        }}
        onEditSection={() => {
          setEditingSection(section);
          setDefaultGroupId(section.groupId);
          setSectionDrawerOpen(true);
        }}
        onDeleteSection={() => deleteSection(section.id, "cash")}
        stats={stats}
        isEmpty={accounts.length === 0}
        emptyMessage="No accounts in this section"
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {showCol("name") && <TableHead className={panel.headCell}>Name</TableHead>}
              {showCol("balance") && (
                <TableHead className={cn(panel.headCell, "text-right")}>Balance</TableHead>
              )}
              {showCol("network") && <TableHead className={panel.headCell}>Network</TableHead>}
              {showCol("protocol") && <TableHead className={panel.headCell}>Protocol</TableHead>}
              {showCol("originalAmount") && (
                <TableHead className={cn(panel.headCell, "text-right")}>Initial</TableHead>
              )}
              {showCol("interest") && (
                <TableHead className={cn(panel.headCell, "text-right")}>Interest</TableHead>
              )}
              {showCol("address") && <TableHead className={panel.headCell}>Address</TableHead>}
              <TableHead className={cn(panel.headCell, "w-14 text-right")} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id} className={panel.dataRow}>
                {showCol("name") && (
                  <TableCell className={panel.symbolCell}>{account.name}</TableCell>
                )}
                {showCol("balance") && (
                  <TableCell className={cn(panel.dataCell, "text-right font-medium")}>
                    {formatMoneyColumn(account.balance)}
                  </TableCell>
                )}
                {showCol("network") && (
                  <TableCell className={panel.mutedCell}>
                    {formatAssetNetworkLabel(account.network)}
                  </TableCell>
                )}
                {showCol("protocol") && (
                  <TableCell className={panel.mutedCell}>{account.protocol ?? "—"}</TableCell>
                )}
                {showCol("originalAmount") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>
                    {fmtOptional(account.originalAmount)}
                  </TableCell>
                )}
                {showCol("interest") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>
                    {fmtOptional(account.interest)}
                  </TableCell>
                )}
                {showCol("address") && (
                  <TableCell
                    className={cn(
                      panel.mutedCell,
                      "max-w-[140px] truncate font-mono text-[11px]"
                    )}
                  >
                    {account.address ?? "—"}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={panel.iconBtn}
                      onClick={() => {
                        setEditing(account);
                        setDefaultSectionId(account.sectionId);
                        setCashDrawerOpen(true);
                      }}
                      aria-label={`Edit ${account.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(panel.iconBtn, "hover:text-destructive")}
                      onClick={() => deleteCashAccount(account.id)}
                      aria-label={`Delete ${account.name}`}
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
                  colSpan={cashFooterLabelColSpan(section, visibleColumns)}
                  className="px-2 py-1 text-[10px] uppercase tracking-wide text-muted-foreground"
                >
                  Section total
                </TableCell>
                {showCol("balance") && (
                  <TableCell className={cn(panel.dataCell, "text-right font-medium")}>
                    {formatSectionTotal(sectionTotals.balance)}
                  </TableCell>
                )}
                {showCol("network") && <TableCell />}
                {showCol("protocol") && <TableCell />}
                {showCol("originalAmount") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>
                    {formatSectionTotal(sectionTotals.originalAmount)}
                  </TableCell>
                )}
                {showCol("interest") && (
                  <TableCell className={cn(panel.mutedCell, "text-right")}>
                    {formatSectionTotal(sectionTotals.interest)}
                  </TableCell>
                )}
                {showCol("address") && <TableCell />}
                <TableCell />
              </TableRow>
            </TableFooter>
          ) : null}
        </Table>
      </PortfolioSectionBlock>
    );
  };

  return (
    <div className="space-y-3">
      <PortfolioPageToolbar
        accent="cash"
        totalLabel="Total cash"
        totalValue={total}
        countLabel="accounts"
        count={cashAccounts.length}
        resultCount={resultCount}
        stats={[
          { label: "Cost basis", value: formatCurrency(pageTotals.costBasis) },
          {
            label: "Interest / gain",
            value: `${pageTotals.gainDollars >= 0 ? "+" : ""}${formatCurrency(pageTotals.gainDollars)} (${formatPercent(pageTotals.gainPercent)})`,
            tone:
              pageTotals.gainDollars > 0
                ? "positive"
                : pageTotals.gainDollars < 0
                  ? "negative"
                  : "neutral",
          },
        ]}
        sectionItems={sectionNavItems}
        activeSectionId={sectionFilter}
        onSectionSelect={handleSectionNavSelect}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Name, protocol, or address…"
        columnOptions={cashColumnOptions}
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
              const rows = accountsBySection[section.id] ?? [];
              return rows.length > 0 || showEmptySections;
            });
            if (!isEmptyGroup && visibleMembers.length === 0) return null;

            return (
              <SectionGroupBlock
                key={block.group.id}
                group={block.group}
                total={block.total}
                accent="cash"
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
                  block.sections.map((section) => renderCashSectionBlock(section))
                )}
              </SectionGroupBlock>
            );
          }

          return (
            <UngroupedSectionsBlock key="ungrouped" total={block.total}>
              {block.sections.map((section) => renderCashSectionBlock(section))}
            </UngroupedSectionsBlock>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <AddSectionButton
          accent="cash"
          onClick={() => {
            setEditingSection(null);
            setDefaultGroupId(undefined);
            setSectionDrawerOpen(true);
          }}
        />
        <AddSectionButton
          accent="cash"
          onClick={() => {
            setEditingGroup(null);
            setGroupDrawerOpen(true);
          }}
          label="Add group"
        />
      </div>

      <CashDrawer
        open={cashDrawerOpen}
        onOpenChange={setCashDrawerOpen}
        account={editing}
        defaultSectionId={defaultSectionId}
        onSave={upsertCashAccount}
      />
      <SectionDrawer
        open={sectionDrawerOpen}
        onOpenChange={setSectionDrawerOpen}
        section={editingSection}
        page="cash"
        defaultGroupId={defaultGroupId}
        onSave={saveSection}
        showDefiToggle
        showCryptoToggle
      />
      <SectionGroupDrawer
        open={groupDrawerOpen}
        onOpenChange={setGroupDrawerOpen}
        group={editingGroup}
        page="cash"
        defaultOrder={groups.length}
        onSave={upsertSectionGroup}
      />
    </div>
  );
}
