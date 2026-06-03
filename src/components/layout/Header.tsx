"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobileNav } from "@/components/layout/MobileNavContext";
import { HeaderAddMenu } from "@/components/layout/HeaderAddMenu";
import { HeaderNetWorthPill } from "@/components/layout/HeaderNetWorthPill";
import type { BreadcrumbItem } from "@/components/layout/PageBreadcrumbs";
import { PageBreadcrumbs } from "@/components/layout/PageBreadcrumbs";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description?: string;
  compact?: boolean;
  breadcrumbs?: BreadcrumbItem[];
  /** Extra toolbar row (e.g. last quote refresh on Assets). */
  meta?: React.ReactNode;
}

export function Header({ title, description, compact = false, breadcrumbs, meta }: HeaderProps) {
  const { setOpen } = useMobileNav();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl [--app-header-height:3rem] supports-[padding:max(0px)]:pt-[max(0px,env(safe-area-inset-top))]",
        compact
          ? "min-h-12 px-3 md:px-4"
          : "min-h-14 px-4 [--app-header-height:3.5rem] sm:min-h-16 sm:[--app-header-height:4rem] md:px-8"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2",
          compact ? "min-h-12 py-2" : "min-h-14 py-2 sm:min-h-16"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1
              className={cn(
                "truncate font-semibold tracking-tight",
                compact ? "text-base md:text-lg" : "text-lg md:text-xl"
              )}
            >
              {title}
            </h1>
            {description && !compact ? (
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{description}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <HeaderNetWorthPill />
          <HeaderAddMenu />
        </div>
      </div>

      {breadcrumbs?.length ? (
        <div className={cn("pb-2", compact ? "px-0" : "")}>
          <PageBreadcrumbs items={breadcrumbs} className="mb-0" />
        </div>
      ) : null}

      {meta ? <div className="border-t border-border/40 px-0 pb-2 text-xs text-muted-foreground">{meta}</div> : null}
    </header>
  );
}
