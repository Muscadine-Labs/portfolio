"use client";

import { FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onAddItem: () => void;
  onEditSection: () => void;
  onDeleteSection: () => void;
  addItemLabel?: string;
}

export function SectionHeader({
  title,
  subtitle,
  onAddItem,
  onEditSection,
  onDeleteSection,
  addItemLabel = "Add",
}: SectionHeaderProps) {
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
    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
      <div>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {subtitle ? (
          <p className="mt-0.5 text-xs font-normal text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="outline" size="sm" onClick={onAddItem}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          {addItemLabel}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEditSection} title="Edit section">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={handleDelete}
          title="Delete section"
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
}

export function AddSectionButton({ onClick, label = "Add Section" }: AddSectionButtonProps) {
  return (
    <Button variant="outline" className="w-full border-dashed" onClick={onClick}>
      <FolderPlus className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
