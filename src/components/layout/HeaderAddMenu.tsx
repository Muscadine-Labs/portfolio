"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { isNavPageVisible } from "@/lib/ui-preferences";

const ADD_LINKS = [
  { href: "/assets", label: "Asset", page: "assets" as const },
  { href: "/cash", label: "Cash account", page: "cash" as const },
  { href: "/liabilities", label: "Liability", page: "liabilities" as const },
  { href: "/plan?tab=budget", label: "Budget item", page: "plan" as const, plan: true },
  { href: "/plan?tab=goals", label: "Goal", page: "plan" as const, plan: true },
];

export function HeaderAddMenu() {
  const { uiPreferences } = usePortfolio();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const links = ADD_LINKS.filter((link) => {
    if (link.plan) return isNavPageVisible(uiPreferences, "plan");
    return isNavPageVisible(uiPreferences, link.page);
  });

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (links.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 gap-1 px-2.5 text-xs"
        onClick={() => setOpen((v) => !v)}
        aria-label="Add"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Add</span>
      </Button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-lg border border-border/80 bg-popover py-1 shadow-lg"
        >
          {links.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              role="menuitem"
              className="block px-3 py-2 text-sm hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
