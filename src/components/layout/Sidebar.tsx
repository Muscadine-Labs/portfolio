"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Home,
  BarChart3,
  Banknote,
  CreditCard,
  Settings,
  Grape,
  ClipboardList,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { getVisiblePlanNavShortcuts } from "@/lib/plan-nav";
import { isNavPageVisible } from "@/lib/ui-preferences";
import { portfolioNavAccent, type PortfolioAccent } from "@/lib/portfolio-panel";
import { sidebarWidthClass } from "@/lib/sidebar-layout";
import { cn } from "@/lib/utils";
import type { NavPageKey, User } from "@/types";

type MainNavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  navKey?: NavPageKey;
  accent?: Exclude<PortfolioAccent, "neutral">;
};

const MAIN_NAV_ITEMS: MainNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/assets", label: "Assets", icon: BarChart3, navKey: "assets", accent: "assets" },
  { href: "/cash", label: "Cash", icon: Banknote, navKey: "cash", accent: "cash" },
  {
    href: "/liabilities",
    label: "Liabilities",
    icon: CreditCard,
    navKey: "liabilities",
    accent: "liabilities",
  },
  { href: "/plan", label: "Plan", icon: ClipboardList, navKey: "plan" },
];

interface SidebarProps {
  onNavigate?: () => void;
  mobile?: boolean;
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  compact,
  accent,
  nested,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
  compact: boolean;
  accent?: Exclude<PortfolioAccent, "neutral">;
  nested?: boolean;
  onNavigate?: () => void;
}) {
  const activeClass =
    active && accent
      ? portfolioNavAccent[accent]
      : active
        ? "bg-primary/15 text-primary"
        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground";

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={compact ? label : undefined}
      aria-label={compact ? label : undefined}
      className={cn(
        "flex items-center rounded-lg text-sm font-medium transition-colors",
        compact ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
        nested && !compact && "ml-3 py-2 text-xs",
        active ? activeClass : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      )}
    >
      <Icon className={cn("shrink-0", nested ? "h-3.5 w-3.5" : "h-4 w-4")} />
      {!compact ? <span>{label}</span> : null}
    </Link>
  );
}

function accountSubtitle(account: User): string {
  const email = account.email?.trim();
  if (email) return email;
  const username = account.username?.trim();
  if (username) return `@${username}`;
  return account.tenant;
}

function SidebarInner({ onNavigate, mobile = false }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { uiPreferences, account, setSidebarCompact } = usePortfolio();
  const compact = !mobile && uiPreferences.sidebarCompact;
  const planShortcuts = getVisiblePlanNavShortcuts(uiPreferences);
  const tabParam = searchParams.get("tab");

  const mainNavItems = MAIN_NAV_ITEMS.filter(
    (item) => !item.navKey || isNavPageVisible(uiPreferences, item.navKey)
  );

  const settingsActive = pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border/60 bg-sidebar/95 backdrop-blur-xl",
        sidebarWidthClass(compact)
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-border/60 sm:h-16",
          mobile ? "justify-between gap-2 px-4 sm:px-6" : compact ? "justify-center px-2" : "px-4 sm:px-6"
        )}
      >
        {mobile ? (
          <div className="flex items-center gap-2">
            <Grape className="h-7 w-7 shrink-0 text-violet-400" aria-hidden />
            <p className="text-sm font-semibold tracking-tight">Portfolio</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSidebarCompact(!compact)}
            title={compact ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={compact ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "group flex items-center rounded-lg transition-colors hover:bg-accent/50",
              compact ? "justify-center p-2" : "gap-2 px-2 py-1.5"
            )}
          >
            <Grape className="h-7 w-7 shrink-0 text-violet-400 transition-transform group-hover:scale-105" />
            {!compact ? (
              <span className="text-sm font-semibold tracking-tight">Portfolio</span>
            ) : null}
          </button>
        )}
        {mobile && onNavigate ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={onNavigate}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3 sm:px-3 sm:py-4">
        {mainNavItems.map(({ href, label, icon, accent }) => {
          const isPlan = href === "/plan";
          const onPlanShortcut =
            isPlan && pathname === "/plan" && planShortcuts.some((s) => s.tab === tabParam);
          const active =
            !onPlanShortcut &&
            (pathname === href ||
              pathname.startsWith(`${href}/`) ||
              (isPlan &&
                (pathname === "/planning" || pathname === "/spending")));

          return (
            <div key={href}>
              <NavLink
                href={href}
                label={label}
                icon={icon}
                accent={accent}
                active={active}
                compact={compact}
                onNavigate={onNavigate}
              />
              {isPlan && !compact
                ? planShortcuts.map((shortcut) => (
                    <NavLink
                      key={shortcut.href}
                      href={shortcut.href}
                      label={shortcut.label}
                      icon={shortcut.icon}
                      active={pathname === "/plan" && tabParam === shortcut.tab}
                      compact={compact}
                      nested
                      onNavigate={onNavigate}
                    />
                  ))
                : null}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border/60 px-2 py-3 sm:px-3">
        <NavLink
          href="/settings"
          label="Settings"
          icon={Settings}
          active={settingsActive}
          compact={compact}
          onNavigate={onNavigate}
        />

        <div
          className={cn(
            "mt-3 flex items-center rounded-lg bg-accent/30",
            compact ? "justify-center px-2 py-2" : "gap-3 px-3 py-2.5"
          )}
        >
          <Avatar className={cn(compact ? "h-8 w-8" : "h-9 w-9")}>
            <AvatarFallback className="bg-violet-600/30 text-sm font-medium text-violet-200">
              {account.displayName.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          {!compact ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{account.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{accountSubtitle(account)}</p>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<aside className="h-full w-64 border-r border-border/60 bg-sidebar/95" />}>
      <SidebarInner {...props} />
    </Suspense>
  );
}
