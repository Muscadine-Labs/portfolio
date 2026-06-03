"use client";

import { ChevronDown, ChevronRight, FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { portfolioPanel, type PortfolioAccent } from "@/lib/portfolio-panel";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onAddItem: () => void;
  onEditSection: () => void;
  onDeleteSection: () => void;
  addItemLabel?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  collapsible?: boolean;
  accent?: PortfolioAccent;
}

export function SectionHeader({
  title,
  subtitle,
  onAddItem,
  onEditSection,
  onDeleteSection,
  addItemLabel = "Add",
  collapsed = false,
  onToggleCollapse,
  collapsible = false,
  accent,
}: SectionHeaderProps) {
  const panel = accent ? portfolioPanel(accent) : null;

  const handleDelete = () => {
    if (
      window.confirm(
        `Delete section "${title}" and all items inside it? This cannot be undone.`
      )
    ) {
      onDeleteSection();
    }
  };

  return (
    <CardHeader
      className={cn(
        "flex flex-row flex-wrap items-center justify-between gap-2",
        panel?.bandRow,
        panel && "px-2 py-1.5"
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        {collapsible && onToggleCollapse ? (
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 h-8 w-8 shrink-0"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand section" : "Collapse section"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        ) : null}
        <div className="min-w-0">
          <CardTitle
            className={cn(
              panel ? panel.bandLabel : "text-base font-semibold",
              collapsed && "text-muted-foreground"
            )}
          >
            {title}
          </CardTitle>
          {subtitle ? (
            <p className="mt-0.5 text-xs font-normal text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className={cn(panel?.sectionActions ?? "flex flex-wrap items-center gap-2")}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(panel?.sectionAddBtn ?? "h-8 px-2.5 text-xs")}
          onClick={onAddItem}
        >
          <Plus className="mr-1.5 h-3 w-3" />
          {addItemLabel}
        </Button>
        {panel ? <span aria-hidden className={panel.sectionActionDivider} /> : null}
        <Button
          variant="ghost"
          size="icon"
          className={cn(panel?.iconBtn ?? "h-8 w-8 shrink-0")}
          onClick={onEditSection}
          title="Edit section"
          aria-label={`Edit section ${title}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(panel?.iconBtn ?? "h-8 w-8 shrink-0", "hover:text-destructive")}
          onClick={handleDelete}
          title="Delete section"
          aria-label={`Delete section ${title}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </CardHeader>
  );
}

interface AddSectionButtonProps {
  onClick: () => void;
  label?: string;
  accent?: PortfolioAccent;
}

export function AddSectionButton({
  onClick,
  label = "Add Section",
  accent = "neutral",
}: AddSectionButtonProps) {
  const panel = portfolioPanel(accent);

  return (
    <Button
      variant="outline"
      className={panel.addSection}
      onClick={onClick}
    >
      <FolderPlus className="mr-2 h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
