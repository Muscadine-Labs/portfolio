"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Home, BarChart3, ClipboardList, Settings } from "lucide-react";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { getVisiblePlanNavShortcuts } from "@/lib/plan-nav";
import { isNavPageVisible } from "@/lib/ui-preferences";
import { cn } from "@/lib/utils";

const CORE_TABS = [
  { href: "/dashboard", label: "Overview", icon: Home, match: (p: string) => p === "/dashboard" },
  {
    href: "/assets",
    label: "Assets",
    icon: BarChart3,
    navKey: "assets" as const,
    match: (p: string) => p === "/assets" || p.startsWith("/assets/"),
  },
  {
    href: "/plan",
    label: "Plan",
    icon: ClipboardList,
    navKey: "plan" as const,
    match: (p: string, tab: string | null) =>
      (p === "/plan" && !tab) ||
      p.startsWith("/plan/") ||
      p === "/planning" ||
      p === "/spending",
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    match: (p: string) => p === "/settings" || p.startsWith("/settings/"),
  },
];

function MobileBottomNavInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const { uiPreferences } = usePortfolio();

  const planShortcuts = getVisiblePlanNavShortcuts(uiPreferences).map((s) => ({
    href: s.href,
    label: s.label,
    icon: s.icon,
    match: (p: string, tab: string | null) => p === "/plan" && tab === s.tab,
  }));

  const items = [
    ...CORE_TABS.filter((tab) => !tab.navKey || isNavPageVisible(uiPreferences, tab.navKey)),
    ...planShortcuts,
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl md:hidden supports-[padding:max(0px)]:pb-[max(0px,env(safe-area-inset-bottom))]"
      aria-label="Main navigation"
    >
      <div
        className="grid h-14 auto-cols-fr grid-flow-col overflow-x-auto"
        style={{ minWidth: "100%" }}
      >
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname, tabParam);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-[4.25rem] flex-col items-center justify-center gap-0.5 px-1 text-[9px] font-medium transition-colors sm:text-[10px]",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavInner />
    </Suspense>
  );
}
