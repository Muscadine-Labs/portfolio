"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobileNav } from "@/components/layout/MobileNavContext";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  description?: string;
  compact?: boolean;
}

export function Header({ title, description, compact = false }: HeaderProps) {
  const { setOpen } = useMobileNav();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-xl [--app-header-height:3rem] supports-[padding:max(0px)]:pt-[max(0px,env(safe-area-inset-top))]",
        compact
          ? "min-h-12 px-3 md:px-4"
          : "min-h-14 px-4 [--app-header-height:3.5rem] sm:min-h-16 sm:[--app-header-height:4rem] md:px-8"
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
    </header>
  );
}
