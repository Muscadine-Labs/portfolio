"use client";

import { useEffect, useRef, useState } from "react";
import {
  LayoutGrid,
  List,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import {
  ColumnPickerPopover,
  computePanelPosition,
  countHiddenColumns,
  type ColumnOption,
  type PanelPosition,
} from "@/components/shared/ColumnPickerPopover";
import { portfolioPanel, type PortfolioAccent } from "@/lib/portfolio-panel";
import { cn, formatCurrency } from "@/lib/utils";

export type PortfolioSectionNavItem = {
  id: string;
  label: string;
  value: number;
  assetCount: number;
};

type ViewMode = "sections" | "all";

interface PortfolioPageToolbarProps<K extends string = string> {
  accent?: PortfolioAccent;
  totalLabel: string;
  totalValue: number;
  countLabel: string;
  count: number;
  resultCount: number;
  sectionItems?: PortfolioSectionNavItem[];
  activeSectionId?: string;
  onSectionSelect?: (sectionId: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  columnOptions?: ColumnOption<K>[];
  visibleColumns?: Set<K>;
  onToggleColumn?: (key: K) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  showSectionControls?: boolean;
  refreshingPrices?: boolean;
  onRefreshPrices?: () => void;
}

export function PortfolioPageToolbar<K extends string = string>({
  accent = "neutral",
  totalLabel,
  totalValue,
  countLabel,
  count,
  resultCount,
  sectionItems = [],
  activeSectionId = "all",
  onSectionSelect,
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  columnOptions,
  visibleColumns,
  onToggleColumn,
  viewMode,
  onViewModeChange,
  onExpandAll,
  onCollapseAll,
  showSectionControls = false,
  refreshingPrices = false,
  onRefreshPrices,
}: PortfolioPageToolbarProps<K>) {
  const panel = portfolioPanel(accent);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const hasColumnPicker =
    columnOptions && visibleColumns && onToggleColumn && columnOptions.length > 0;
  const hiddenColumnCount =
    hasColumnPicker && visibleColumns
      ? countHiddenColumns(columnOptions, visibleColumns)
      : 0;

  const handleFiltersClick = () => {
    if (!hasColumnPicker) return;
    if (columnsOpen) {
      setColumnsOpen(false);
      return;
    }
    if (filtersButtonRef.current) {
      setPanelPosition(computePanelPosition(filtersButtonRef.current));
    }
    setColumnsOpen(true);
  };

  useEffect(() => {
    if (!columnsOpen) return;
    const update = () => {
      if (!filtersButtonRef.current) return;
      setPanelPosition(computePanelPosition(filtersButtonRef.current));
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [columnsOpen]);

  return (
    <div className={panel.toolbarPanel} data-portfolio-toolbar>
      <div className={cn(panel.toolbarRow, "max-sm:flex-col max-sm:items-stretch max-sm:gap-2")}>
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1 sm:min-w-[140px] sm:flex-none">
          <div>
            <p className={panel.label}>{totalLabel}</p>
            <p className={panel.total}>
              <AnimatedNumber value={totalValue} />
            </p>
          </div>
        </div>

        <div className="hidden h-8 w-px bg-border/80 sm:block" />

        <p className={cn(panel.meta, "hidden sm:block")}>
          {count} {countLabel} · showing {resultCount}
        </p>

        <div className="ml-auto flex flex-wrap items-center gap-1 max-sm:ml-0 max-sm:w-full max-sm:justify-end">
          {onViewModeChange && viewMode ? (
            <>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "sections" ? "secondary" : "ghost"}
                className="h-7 px-2 text-[11px]"
                onClick={() => onViewModeChange("sections")}
              >
                <LayoutGrid className="mr-1 h-3.5 w-3.5" />
                Sections
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "all" ? "secondary" : "ghost"}
                className="h-7 px-2 text-[11px]"
                onClick={() => onViewModeChange("all")}
              >
                <List className="mr-1 h-3.5 w-3.5" />
                All
              </Button>
            </>
          ) : null}
          {showSectionControls ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[11px]"
                onClick={onExpandAll}
              >
                Expand
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[11px]"
                onClick={onCollapseAll}
              >
                Collapse
              </Button>
            </>
          ) : null}
          {onRefreshPrices ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px]"
              disabled={refreshingPrices}
              onClick={onRefreshPrices}
            >
              {refreshingPrices ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1 h-3.5 w-3.5" />
              )}
              Quotes
            </Button>
          ) : null}
        </div>
      </div>

      {sectionItems.length > 1 && onSectionSelect ? (
        <div
          className={cn(
            "flex gap-1 overflow-x-auto px-3 py-1.5 [-webkit-overflow-scrolling:touch]",
            panel.toolbarDivider
          )}
        >
          <button
            type="button"
            className={panel.pill(activeSectionId === "all")}
            onClick={() => onSectionSelect("all")}
          >
            ALL
          </button>
          {sectionItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={panel.pill(activeSectionId === item.id)}
              onClick={() => onSectionSelect(item.id)}
              title={`${item.label} — ${formatCurrency(item.value)}`}
            >
              <span className={panel.pillLabel}>{item.label.toUpperCase()}</span>
              <span className={panel.pillValue}>
                · {formatCurrency(item.value, { maximumFractionDigits: 0 })}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          "flex flex-wrap items-center gap-2 px-3 py-1.5",
          panel.toolbarDivider,
          panel.toolbarStickyBar
        )}
        data-portfolio-sticky-bar
      >
        <div className="relative min-w-0 flex-1 sm:min-w-[160px] sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 border-border/60 bg-background/60 pl-8 text-xs"
          />
        </div>
        <Button
          type="button"
          variant={columnsOpen ? "secondary" : "outline"}
          size="sm"
          className="h-8 text-xs"
          ref={filtersButtonRef}
          onClick={handleFiltersClick}
          aria-expanded={columnsOpen}
          aria-haspopup="dialog"
          disabled={!hasColumnPicker}
        >
          <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
          Filters
          {hiddenColumnCount > 0 ? (
            <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {visibleColumns!.size}
            </span>
          ) : null}
        </Button>
      </div>
      {hasColumnPicker ? (
        <ColumnPickerPopover
          open={columnsOpen}
          onOpenChange={setColumnsOpen}
          panelPosition={panelPosition}
          anchorRef={filtersButtonRef}
          columnOptions={columnOptions!}
          visibleColumns={visibleColumns!}
          onToggleColumn={onToggleColumn!}
        />
      ) : null}
    </div>
  );
}
