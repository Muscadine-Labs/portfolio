"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { PortfolioSection } from "@/types";
import { cn } from "@/lib/utils";

export type ColumnOption<K extends string> = { key: K; label: string };

type PanelPosition = { top: number; left: number; width: number };

function computePanelPosition(button: HTMLButtonElement): PanelPosition {
  const rect = button.getBoundingClientRect();
  const width = Math.min(320, window.innerWidth - 16);
  const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
  const estimatedHeight = 280;
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  const top =
    spaceBelow >= estimatedHeight
      ? rect.bottom + 4
      : Math.max(8, rect.top - estimatedHeight - 4);
  return { top, left, width };
}

function ColumnToggle({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
        on
          ? "border-primary/40 bg-primary/15 text-primary"
          : "border-border/60 bg-background/50 text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

export interface RecordFiltersProps<K extends string> {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  sectionFilter: string;
  onSectionFilterChange: (value: string) => void;
  sections: PortfolioSection[];
  columnOptions: ColumnOption<K>[];
  visibleColumns: Set<K>;
  onToggleColumn: (key: K) => void;
  resultCount: number;
  totalCount: number;
  entityLabel: string;
  /** Start with the full filter panel collapsed (default true). */
  defaultExpanded?: boolean;
}

function ActiveChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
      {children}
    </span>
  );
}

export function RecordFilters<K extends string>({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  sectionFilter,
  onSectionFilterChange,
  sections,
  columnOptions,
  visibleColumns,
  onToggleColumn,
  resultCount,
  totalCount,
  entityLabel,
  defaultExpanded = false,
}: RecordFiltersProps<K>) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const hiddenCount = columnOptions.filter((o) => !visibleColumns.has(o.key)).length;
  const hasCustomColumns = hiddenCount > 0;
  const hasSearch = search.trim().length > 0;
  const sectionLabel =
    sectionFilter !== "all"
      ? sections.find((s) => s.id === sectionFilter)?.label
      : null;
  const activeFilterCount =
    (hasSearch ? 1 : 0) + (sectionLabel ? 1 : 0) + (hasCustomColumns ? 1 : 0);

  const handleFilterClick = () => {
    if (columnsOpen) {
      setColumnsOpen(false);
      return;
    }
    if (buttonRef.current) {
      setPanelPosition(computePanelPosition(buttonRef.current));
    }
    setColumnsOpen(true);
  };

  useEffect(() => {
    if (!columnsOpen) return;
    let active = true;
    const update = () => {
      if (!active || !buttonRef.current) return;
      setPanelPosition(computePanelPosition(buttonRef.current));
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      active = false;
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [columnsOpen]);

  useEffect(() => {
    if (!columnsOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setColumnsOpen(false);
    };
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setColumnsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [columnsOpen]);

  const filterPanel =
    columnsOpen && panelPosition && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Column filters"
            className="fixed z-[100] rounded-lg border border-border/60 bg-popover p-3 shadow-lg ring-1 ring-foreground/10"
            style={{
              top: panelPosition.top,
              left: panelPosition.left,
              width: panelPosition.width,
            }}
          >
            <p className="mb-2 text-xs font-medium text-foreground">Show columns</p>
            <div className="flex max-h-[min(16rem,calc(100vh-6rem))] flex-wrap gap-1.5 overflow-y-auto">
              {columnOptions.map(({ key, label }) => (
                <ColumnToggle
                  key={key}
                  label={label}
                  on={visibleColumns.has(key)}
                  onClick={() => onToggleColumn(key)}
                />
              ))}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <Card className="overflow-visible border-border/60 bg-card/80">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              <Search className="h-4 w-4 shrink-0" />
              Search &amp; filters
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {activeFilterCount}
                </span>
              ) : null}
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                  expanded && "rotate-180"
                )}
              />
            </Button>
            <p className="min-w-0 flex-1 text-xs text-muted-foreground">
              Showing {resultCount} of {totalCount} {entityLabel}
            </p>
            {!expanded && activeFilterCount > 0 ? (
              <div className="flex flex-wrap gap-1">
                {hasSearch ? <ActiveChip>Search</ActiveChip> : null}
                {sectionLabel ? <ActiveChip>{sectionLabel}</ActiveChip> : null}
                {hasCustomColumns ? (
                  <ActiveChip>{visibleColumns.size} columns</ActiveChip>
                ) : null}
              </div>
            ) : null}
          </div>

          {expanded ? (
            <div className="mt-3 flex flex-col gap-3 border-t border-border/50 pt-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Label htmlFor="record-search" className="text-xs text-muted-foreground">
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="record-search"
                      placeholder={searchPlaceholder}
                      value={search}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="w-full space-y-1.5 sm:w-48">
                    <Label className="text-xs text-muted-foreground">Section</Label>
                    <Select
                      value={sectionFilter}
                      onValueChange={(v) => v && onSectionFilterChange(v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All sections" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All sections</SelectItem>
                        {sections.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Columns</Label>
                    <Button
                      ref={buttonRef}
                      type="button"
                      variant="outline"
                      className="w-full gap-2 sm:w-auto"
                      onClick={handleFilterClick}
                      aria-expanded={columnsOpen}
                      aria-haspopup="dialog"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Choose columns
                      {hasCustomColumns && (
                        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                          {visibleColumns.size}
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      {filterPanel}
    </>
  );
}

export function toggleColumnInSet<K extends string>(
  prev: Set<K>,
  key: K
): Set<K> {
  const next = new Set(prev);
  if (next.has(key)) {
    if (next.size > 1) next.delete(key);
  } else {
    next.add(key);
  }
  return next;
}
