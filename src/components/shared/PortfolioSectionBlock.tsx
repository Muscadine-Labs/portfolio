"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { portfolioPanel, type PortfolioAccent } from "@/lib/portfolio-panel";
import { cn } from "@/lib/utils";

export type SectionStat = {
  label: string;
  value: string;
  valueClassName?: string;
};

interface PortfolioSectionBlockProps {
  sectionId: string;
  label: string;
  subtitle?: string;
  accent?: PortfolioAccent;
  highlighted?: boolean;
  addItemLabel?: string;
  onAddItem: () => void;
  onEditSection: () => void;
  onDeleteSection: () => void;
  stats?: SectionStat[];
  emptyMessage?: string;
  isEmpty: boolean;
  children: React.ReactNode;
}

export function PortfolioSectionBlock({
  sectionId,
  label,
  subtitle,
  accent = "neutral",
  highlighted = false,
  addItemLabel = "Add",
  onAddItem,
  onEditSection,
  onDeleteSection,
  stats = [],
  emptyMessage = "No items in this section",
  isEmpty,
  children,
}: PortfolioSectionBlockProps) {
  const panel = portfolioPanel(accent);

  const handleDelete = () => {
    if (
      window.confirm(
        `Delete section "${label}" and all items inside it? This cannot be undone.`
      )
    ) {
      onDeleteSection();
    }
  };

  return (
    <div
      id={`section-${sectionId}`}
      className={cn(
        panel.sectionBlock,
        panel.sectionScrollMargin,
        highlighted && "ring-1 ring-primary/25"
      )}
    >
      <div className={panel.sectionTitleRow}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-1">
            <div className="min-w-0">
              <h3 className={panel.sectionTitle}>{label}</h3>
              {subtitle ? (
                <p className="text-xs font-normal text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            {stats.map((stat) => (
              <span
                key={`${stat.label}-${stat.value}`}
                className="inline-flex items-baseline gap-1"
              >
                <span className={panel.statLabel}>{stat.label}</span>
                <span className={cn(panel.statValue, stat.valueClassName)}>
                  {stat.value}
                </span>
              </span>
            ))}
          </div>
          <div className={panel.sectionActions}>
            <Button
              variant="ghost"
              size="sm"
              className={panel.sectionAddBtn}
              onClick={onAddItem}
            >
              <Plus className="mr-1.5 h-3 w-3" />
              {addItemLabel}
            </Button>
            <span aria-hidden className={panel.sectionActionDivider} />
            <Button
              variant="ghost"
              size="icon"
              className={panel.iconBtn}
              onClick={onEditSection}
              title="Edit section"
              aria-label={`Edit section ${label}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(panel.iconBtn, "hover:text-destructive")}
              onClick={handleDelete}
              title="Delete section"
              aria-label={`Delete section ${label}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <p className="px-3 py-3 text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className={cn("overflow-x-auto pb-1", panel.compactTable)}>{children}</div>
      )}
    </div>
  );
}
