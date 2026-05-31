"use client";

import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { portfolioPanel, type PortfolioAccent } from "@/lib/portfolio-panel";
import { cn, formatCurrency } from "@/lib/utils";
import type { SectionGroup } from "@/types";

interface SectionGroupBlockProps {
  group: SectionGroup;
  total: number;
  accent?: PortfolioAccent;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onEditGroup?: () => void;
  onDeleteGroup?: (mode: "ungroup" | "deleteAll") => void;
  children: React.ReactNode;
}

export function SectionGroupBlock({
  group,
  total,
  accent = "neutral",
  collapsed = false,
  onToggleCollapse,
  onEditGroup,
  onDeleteGroup,
  children,
}: SectionGroupBlockProps) {
  const panel = portfolioPanel(accent);

  const handleDelete = () => {
    if (!onDeleteGroup) return;
    if (
      !window.confirm(
        `Remove group "${group.name}"? You can keep the sections or delete them with the group.`
      )
    ) {
      return;
    }
    const deleteAll = window.confirm(
      `Delete ALL sections and holdings in "${group.name}"?\n\nOK = delete everything\nCancel = ungroup sections (keep holdings)`
    );
    onDeleteGroup(deleteAll ? "deleteAll" : "ungroup");
  };

  return (
    <div
      id={`group-${group.id}`}
      className={cn(
        "overflow-hidden rounded-lg border border-border/60 bg-card/40",
        panel.sectionScrollMargin
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/25 px-3 py-2">
        {onToggleCollapse ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "-rotate-90"
              )}
            />
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-tight">{group.name}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatCurrency(total)}
          </p>
        </div>
        <div className={panel.sectionActions}>
          {onEditGroup ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={panel.iconBtn}
              onClick={onEditGroup}
              title="Rename group"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ) : null}
          {onDeleteGroup ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(panel.iconBtn, "hover:text-destructive")}
              onClick={handleDelete}
              title="Delete group"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>
      {!collapsed ? <div className="space-y-3 p-2">{children}</div> : null}
    </div>
  );
}

interface UngroupedSectionsBlockProps {
  total: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  children: React.ReactNode;
}

export function UngroupedSectionsBlock({
  total,
  collapsed = false,
  onToggleCollapse,
  children,
}: UngroupedSectionsBlockProps) {
  const panel = portfolioPanel("neutral");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-dashed border-border/60 bg-card/20",
        panel.sectionScrollMargin
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/40 bg-muted/15 px-3 py-2">
        {onToggleCollapse ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "-rotate-90"
              )}
            />
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">Ungrouped</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatCurrency(total)}
          </p>
        </div>
      </div>
      {!collapsed ? <div className="space-y-3 p-2">{children}</div> : null}
    </div>
  );
}
