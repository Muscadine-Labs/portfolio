"use client";

import { useMemo, useState } from "react";
import { useSectionFilterFromUrl, useScrollToSectionFromUrl } from "@/hooks/use-section-from-url";
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
import { LiabilityDrawer } from "@/components/liabilities/LiabilityDrawer";
import { SectionDrawer } from "@/components/sections/SectionDrawer";
import { SectionHeader, AddSectionButton } from "@/components/sections/SectionHeader";
import { RecordFilters, toggleColumnInSet } from "@/components/shared/RecordFilters";
import {
  DEFAULT_LIABILITY_COLUMNS,
  LIABILITY_COLUMN_OPTIONS,
  type LiabilityColumnKey,
} from "@/components/liabilities/liability-columns";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { computeTotalLiabilities } from "@/lib/mock-data";
import { sumLiabilitySectionTotals } from "@/lib/section-totals";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { LtvBar } from "@/components/liabilities/LtvBar";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import type { Liability, PortfolioSection } from "@/types";

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
    getSections,
    upsertLiability,
    deleteLiability,
    upsertSection,
    deleteSection,
  } = usePortfolio();
  const sections = getSections("liabilities");
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);
  const { sectionFilter, setSectionFilter, highlightSectionId } =
    useSectionFilterFromUrl(sectionIds);
  useScrollToSectionFromUrl();

  const [search, setSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Set<LiabilityColumnKey>>(
    () => new Set(DEFAULT_LIABILITY_COLUMNS)
  );

  const [liabilityDrawerOpen, setLiabilityDrawerOpen] = useState(false);
  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Liability | null>(null);
  const [editingSection, setEditingSection] = useState<PortfolioSection | null>(null);
  const [defaultSectionId, setDefaultSectionId] = useState<string | undefined>();

  const filteredSections = useMemo(() => {
    if (sectionFilter === "all") return sections;
    return sections.filter((s) => s.id === sectionFilter);
  }, [sections, sectionFilter]);

  const { resultCount, itemsBySection } = useMemo(() => {
    let count = 0;
    const bySection: Record<string, Liability[]> = {};
    for (const section of filteredSections) {
      const rows = liabilities.filter(
        (l) => l.sectionId === section.id && matchesSearch(l, search)
      );
      bySection[section.id] = rows;
      count += rows.length;
    }
    return { resultCount: count, itemsBySection: bySection };
  }, [liabilities, filteredSections, search]);

  const total = computeTotalLiabilities(liabilities);
  const showEmptySections = search.trim() === "" && sectionFilter === "all";

  const saveSection = (section: PortfolioSection) => {
    if (editingSection) {
      upsertSection({ ...section, order: editingSection.order });
    } else {
      upsertSection({ ...section, order: sections.length });
    }
  };

  const col = (key: LiabilityColumnKey) => visibleColumns.has(key);

  return (
    <div className="space-y-6">
      <Card className="border-destructive/20 bg-gradient-to-br from-card to-destructive/5">
        <CardHeader>
          <CardTitle className="text-muted-foreground">Total Liabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tracking-tight text-red-400">
            <AnimatedNumber value={total} />
          </p>
        </CardContent>
      </Card>

      <RecordFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Name or address…"
        sectionFilter={sectionFilter}
        onSectionFilterChange={setSectionFilter}
        sections={sections}
        columnOptions={LIABILITY_COLUMN_OPTIONS}
        visibleColumns={visibleColumns}
        onToggleColumn={(key) => setVisibleColumns((p) => toggleColumnInSet(p, key))}
        resultCount={resultCount}
        totalCount={liabilities.length}
        entityLabel="liabilities"
      />

      {filteredSections.map((section) => {
        const items = itemsBySection[section.id] ?? [];
        const isDefi = section.metadata?.isDefi ?? false;
        if (items.length === 0 && !showEmptySections) return null;
        const sectionTotals =
          items.length > 0 ? sumLiabilitySectionTotals(items) : null;

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
              onAddItem={() => {
                setEditing(null);
                setDefaultSectionId(section.id);
                setLiabilityDrawerOpen(true);
              }}
              onEditSection={() => {
                setEditingSection(section);
                setSectionDrawerOpen(true);
              }}
              onDeleteSection={() => deleteSection(section.id, "liabilities")}
              addItemLabel="Add Liability"
            />
            <CardContent className="overflow-x-auto p-0 pb-4">
              {items.length === 0 ? (
                <p className="px-6 pb-4 text-sm text-muted-foreground">No liabilities in this section</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {col("name") && <TableHead>Name</TableHead>}
                        {col("totalDebt") && (
                          <TableHead className="text-right">Total debt</TableHead>
                        )}
                        {col("initialBalance") && (
                          <TableHead className="text-right">Initial balance</TableHead>
                        )}
                        {col("interestAccrued") && (
                          <TableHead className="text-right">Interest accrued</TableHead>
                        )}
                        {col("apy") && <TableHead className="text-right">APY %</TableHead>}
                        {col("address") && <TableHead>Address</TableHead>}
                        {col("collateral") && (
                          <TableHead className="text-right">Collateral</TableHead>
                        )}
                        {col("lltv") && <TableHead className="text-right">LLTV %</TableHead>}
                        {col("ltv") && <TableHead className="text-right">LTV %</TableHead>}
                        {col("liquidationPrice") && (
                          <TableHead className="text-right">Liq. price</TableHead>
                        )}
                        <TableHead className="w-20" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((l) => (
                        <TableRow key={l.id}>
                          {col("name") && (
                            <TableCell className="font-medium">{l.name}</TableCell>
                          )}
                          {col("totalDebt") && (
                            <TableCell className="text-right tabular-nums text-red-400">
                              {formatCurrency(l.balance)}
                            </TableCell>
                          )}
                          {col("initialBalance") && (
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {fmtMoney(l.initialBalance)}
                            </TableCell>
                          )}
                          {col("interestAccrued") && (
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {fmtMoney(l.interestAccrued)}
                            </TableCell>
                          )}
                          {col("apy") && (
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {fmtPct(l.apy)}
                            </TableCell>
                          )}
                          {col("address") && (
                            <TableCell className="max-w-[140px] truncate font-mono text-xs text-muted-foreground">
                              {l.address ?? "—"}
                            </TableCell>
                          )}
                          {col("collateral") && (
                            <TableCell className="text-right tabular-nums">
                              {fmtMoney(l.collateral)}
                            </TableCell>
                          )}
                          {col("lltv") && (
                            <TableCell className="text-right tabular-nums">
                              {fmtPct(l.lltv)}
                            </TableCell>
                          )}
                          {col("ltv") && (
                            <TableCell className="text-right tabular-nums">
                              {fmtPct(l.ltv)}
                            </TableCell>
                          )}
                          {col("liquidationPrice") && (
                            <TableCell className="text-right tabular-nums">
                              {fmtMoney(l.liquidationPrice)}
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setEditing(l);
                                  setDefaultSectionId(l.sectionId);
                                  setLiabilityDrawerOpen(true);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => deleteLiability(l.id)}
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
                        <TableRow className="bg-muted/30 font-semibold hover:bg-muted/30">
                          <TableCell colSpan={liabilityFooterLabelColSpan(col)}>
                            Section total
                          </TableCell>
                          {col("totalDebt") && (
                            <TableCell className="text-right tabular-nums text-red-400">
                              {formatCurrency(sectionTotals.totalDebt)}
                            </TableCell>
                          )}
                          {col("initialBalance") && (
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {fmtMoney(sectionTotals.initialBalance)}
                            </TableCell>
                          )}
                          {col("interestAccrued") && (
                            <TableCell className="text-right tabular-nums text-muted-foreground">
                              {fmtMoney(sectionTotals.interestAccrued)}
                            </TableCell>
                          )}
                          {col("apy") && <TableCell />}
                          {col("address") && <TableCell />}
                          {col("collateral") && (
                            <TableCell className="text-right tabular-nums">
                              {fmtMoney(sectionTotals.collateral)}
                            </TableCell>
                          )}
                          {col("lltv") && <TableCell />}
                          {col("ltv") && (
                            <TableCell className="text-right tabular-nums">
                              {sectionTotals.collateral > 0
                                ? formatPercent(
                                    (sectionTotals.totalDebt / sectionTotals.collateral) *
                                      100
                                  )
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
                          <div key={`ltv-${l.id}`} className="mt-4 px-4">
                            <p className="mb-2 text-sm font-medium">{l.name}</p>
                            <LtvBar ltv={l.ltv} />
                          </div>
                        )
                    )}
                </>
              )}
            </CardContent>
          </Card>
        );
      })}

      <AddSectionButton
        onClick={() => {
          setEditingSection(null);
          setSectionDrawerOpen(true);
        }}
      />

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
        onSave={saveSection}
        showDefiToggle
        linkWallet
      />
    </div>
  );
}
