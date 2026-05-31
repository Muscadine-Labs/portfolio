"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart3,
  Banknote,
  CreditCard,
  Settings,
  Grape,
  ClipboardList,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { isNavPageVisible } from "@/lib/ui-preferences";
import { cn } from "@/lib/utils";
import type { NavPageKey } from "@/types";

type MainNavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  navKey?: NavPageKey;
};

const MAIN_NAV_ITEMS: MainNavItem[] = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/assets", label: "Assets", icon: BarChart3, navKey: "assets" },
  { href: "/cash", label: "Cash", icon: Banknote, navKey: "cash" },
  { href: "/liabilities", label: "Liabilities", icon: CreditCard, navKey: "liabilities" },
  { href: "/plan", label: "Plan", icon: ClipboardList, navKey: "plan" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { uiPreferences, account } = usePortfolio();

  const mainNavItems = MAIN_NAV_ITEMS.filter(
    (item) => !item.navKey || isNavPageVisible(uiPreferences, item.navKey)
  );

  const settingsActive = pathname === "/settings" || pathname.startsWith("/settings/");

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border/60 bg-sidebar/95 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 border-b border-border/60 px-6">
        <Grape className="h-7 w-7 text-violet-400" />
        <div>
          <p className="text-sm font-semibold tracking-tight">Portfolio</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {mainNavItems.map(({ href, label, icon }) => {
          const active =
            pathname === href ||
            pathname.startsWith(`${href}/`) ||
            (href === "/plan" &&
              isNavPageVisible(uiPreferences, "plan") &&
              (pathname === "/planning" || pathname === "/spending"));
          return (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={active}
              onNavigate={onNavigate}
            />
          );
        })}
      </nav>

      <div className="border-t border-border/60 px-3 py-3">
        <NavLink
          href="/settings"
          label="Settings"
          icon={Settings}
          active={settingsActive}
          onNavigate={onNavigate}
        />
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-accent/30 px-3 py-2.5">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-violet-600/30 text-sm font-medium text-violet-200">
              {account.displayName.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{account.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{account.tenant}.portfolio</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
