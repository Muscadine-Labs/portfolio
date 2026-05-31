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
import { CashDrawer } from "@/components/cash/CashDrawer";
import { SectionDrawer } from "@/components/sections/SectionDrawer";
import { SectionHeader, AddSectionButton } from "@/components/sections/SectionHeader";
import { RecordFilters, toggleColumnInSet } from "@/components/shared/RecordFilters";
import {
  CASH_COLUMN_OPTIONS,
  DEFAULT_CASH_COLUMNS,
  type CashColumnKey,
} from "@/components/cash/cash-columns";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { computeTotalCash } from "@/lib/mock-data";
import { sumCashSectionTotals } from "@/lib/section-totals";
import { formatCurrency } from "@/lib/utils";
import type { CashAccount, PortfolioSection } from "@/types";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";

function matchesSearch(account: CashAccount, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    account.name.toLowerCase().includes(q) ||
    (account.protocol?.toLowerCase().includes(q) ?? false) ||
    (account.address?.toLowerCase().includes(q) ?? false)
  );
}

function fmtOptional(value: number | undefined): string {
  return value != null ? formatCurrency(value) : "—";
}

const CASH_COLUMN_ORDER: CashColumnKey[] = [
  "name",
  "balance",
  "originalAmount",
  "interest",
  "protocol",
  "address",
];

const CASH_SUM_COLUMNS = new Set<CashColumnKey>(["balance", "originalAmount", "interest"]);

function cashFooterLabelColSpan(col: (key: CashColumnKey) => boolean): number {
  let span = 0;
  for (const key of CASH_COLUMN_ORDER) {
    if (!col(key)) continue;
    if (CASH_SUM_COLUMNS.has(key)) break;
    span++;
  }
  return Math.max(span, 1);
}

export function CashPageContent() {
  const {
    cashAccounts,
    getSections,
    upsertCashAccount,
    deleteCashAccount,
    upsertSection,
    deleteSection,
  } = usePortfolio();
  const sections = getSections("cash");
  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);
  const { sectionFilter, setSectionFilter, highlightSectionId } =
    useSectionFilterFromUrl(sectionIds);
  useScrollToSectionFromUrl();

  const [search, setSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Set<CashColumnKey>>(
    () => new Set(DEFAULT_CASH_COLUMNS)
  );

  const [cashDrawerOpen, setCashDrawerOpen] = useState(false);
  const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CashAccount | null>(null);
  const [editingSection, setEditingSection] = useState<PortfolioSection | null>(null);
  const [defaultSectionId, setDefaultSectionId] = useState<string | undefined>();

  const filteredSections = useMemo(() => {
    if (sectionFilter === "all") return sections;
    return sections.filter((s) => s.id === sectionFilter);
  }, [sections, sectionFilter]);

  const { resultCount, accountsBySection } = useMemo(() => {
    let count = 0;
    const bySection: Record<string, CashAccount[]> = {};
    for (const section of filteredSections) {
      const rows = cashAccounts.filter(
        (a) => a.sectionId === section.id && matchesSearch(a, search)
      );
      bySection[section.id] = rows;
      count += rows.length;
    }
    return { resultCount: count, accountsBySection: bySection };
  }, [cashAccounts, filteredSections, search]);

  const total = computeTotalCash(cashAccounts);
  const showEmptySections = search.trim() === "" && sectionFilter === "all";

  const saveSection = (section: PortfolioSection) => {
    if (editingSection) {
      upsertSection({ ...section, order: editingSection.order });
    } else {
      upsertSection({ ...section, order: sections.length });
    }
  };

  const col = (key: CashColumnKey) => visibleColumns.has(key);

  return (
    <div className="space-y-6">
      <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
        <CardHeader>
          <CardTitle className="text-muted-foreground">Total Cash</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tracking-tight">
            <AnimatedNumber value={total} />
          </p>
        </CardContent>
      </Card>

      <RecordFilters
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Name, protocol, or address…"
        sectionFilter={sectionFilter}
        onSectionFilterChange={setSectionFilter}
        sections={sections}
        columnOptions={CASH_COLUMN_OPTIONS}
        visibleColumns={visibleColumns}
        onToggleColumn={(key) => setVisibleColumns((p) => toggleColumnInSet(p, key))}
        resultCount={resultCount}
        totalCount={cashAccounts.length}
        entityLabel="accounts"
      />

      {filteredSections.map((section) => {
        const accounts = accountsBySection[section.id] ?? [];
        if (accounts.length === 0 && !showEmptySections) return null;
        const sectionTotals =
          accounts.length > 0 ? sumCashSectionTotals(accounts) : null;

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
                setCashDrawerOpen(true);
              }}
              onEditSection={() => {
                setEditingSection(section);
                setSectionDrawerOpen(true);
              }}
              onDeleteSection={() => deleteSection(section.id, "cash")}
              addItemLabel="Add Account"
            />
            <CardContent className="overflow-x-auto p-0 pb-4">
              {accounts.length === 0 ? (
                <p className="px-6 pb-4 text-sm text-muted-foreground">No accounts in this section</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {col("name") && <TableHead>Name</TableHead>}
                      {col("balance") && <TableHead className="text-right">Balance</TableHead>}
                      {col("originalAmount") && (
                        <TableHead className="text-right">Initial balance</TableHead>
                      )}
                      {col("interest") && (
                        <TableHead className="text-right">Interest accrued</TableHead>
                      )}
                      {col("protocol") && <TableHead>Protocol</TableHead>}
                      {col("address") && <TableHead>Address</TableHead>}
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        {col("name") && <TableCell className="font-medium">{account.name}</TableCell>}
                        {col("balance") && (
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(account.balance)}
                          </TableCell>
                        )}
                        {col("originalAmount") && (
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {fmtOptional(account.originalAmount)}
                          </TableCell>
                        )}
                        {col("interest") && (
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {fmtOptional(account.interest)}
                          </TableCell>
                        )}
                        {col("protocol") && (
                          <TableCell className="text-muted-foreground">
                            {account.protocol ?? "—"}
                          </TableCell>
                        )}
                        {col("address") && (
                          <TableCell className="max-w-[140px] truncate font-mono text-xs text-muted-foreground">
                            {account.address ?? "—"}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditing(account);
                                setDefaultSectionId(account.sectionId);
                                setCashDrawerOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteCashAccount(account.id)}
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
                        <TableCell colSpan={cashFooterLabelColSpan(col)}>
                          Section total
                        </TableCell>
                        {col("balance") && (
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(sectionTotals.balance)}
                          </TableCell>
                        )}
                        {col("originalAmount") && (
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatCurrency(sectionTotals.originalAmount)}
                          </TableCell>
                        )}
                        {col("interest") && (
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {formatCurrency(sectionTotals.interest)}
                          </TableCell>
                        )}
                        {col("protocol") && <TableCell />}
                        {col("address") && <TableCell />}
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

      <AddSectionButton
        onClick={() => {
          setEditingSection(null);
          setSectionDrawerOpen(true);
        }}
      />

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
        onSave={saveSection}
        linkWallet
      />
    </div>
  );
}
