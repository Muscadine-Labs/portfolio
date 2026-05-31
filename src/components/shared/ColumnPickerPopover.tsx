"use client";

import { useEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";

export type ColumnOption<K extends string = string> = { key: K; label: string };

export type PanelPosition = { top: number; left: number; width: number };

export function computePanelPosition(button: HTMLButtonElement): PanelPosition {
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

export interface ColumnPickerPopoverProps<K extends string = string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panelPosition: PanelPosition | null;
  anchorRef: RefObject<HTMLButtonElement | null>;
  columnOptions: ColumnOption<K>[];
  visibleColumns: Set<K>;
  onToggleColumn: (key: K) => void;
}

export function ColumnPickerPopover<K extends string = string>({
  open,
  onOpenChange,
  panelPosition,
  anchorRef,
  columnOptions,
  visibleColumns,
  onToggleColumn,
}: ColumnPickerPopoverProps<K>) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, onOpenChange, anchorRef]);

  if (!open || !panelPosition || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Column filters"
      className="fixed z-[250] rounded-lg border border-border/60 bg-popover p-3 shadow-lg ring-1 ring-foreground/10"
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

export function countHiddenColumns<K extends string>(
  columnOptions: ColumnOption<K>[],
  visibleColumns: Set<K>
): number {
  return columnOptions.filter((option) => !visibleColumns.has(option.key)).length;
}
