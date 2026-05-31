"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMobileNav } from "@/components/layout/MobileNavContext";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { setOpen } = useMobileNav();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground md:text-sm">{description}</p>
          )}
        </div>
      </div>
    </header>
  );
}
