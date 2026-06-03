"use client";

import { type CSSProperties, type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { MobileNavProvider, useMobileNav } from "@/components/layout/MobileNavContext";
import { PortfolioProvider, usePortfolio } from "@/components/providers/PortfolioProvider";
import { PortfolioAgreementProvider } from "@/contexts/PortfolioAgreementContext";
import { PortfolioAgreementModal } from "@/components/legal/PortfolioAgreementModal";
import { ThemePreferenceSync } from "@/components/shared/ThemePreferenceSync";
import type { PortfolioImportResult } from "@/lib/portfolio-data";
import {
  mainOffsetClass,
  SIDEBAR_WIDTH_COMPACT,
  SIDEBAR_WIDTH_EXPANDED,
} from "@/lib/sidebar-layout";
import type { User } from "@/types";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  initialAccount: User;
  initialPortfolio: PortfolioImportResult;
  children: ReactNode;
}

function ShellInner({ children }: { children: ReactNode }) {
  const { open, setOpen } = useMobileNav();
  const { uiPreferences } = usePortfolio();
  const compact = uiPreferences.sidebarCompact;

  const shellStyle = {
    "--sidebar-width": compact ? SIDEBAR_WIDTH_COMPACT : SIDEBAR_WIDTH_EXPANDED,
  } as CSSProperties;

  return (
    <div className="min-h-screen bg-background" style={shellStyle}>
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-64 max-w-[85vw] transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar mobile onNavigate={() => setOpen(false)} />
        </div>
      </div>

      <div className="fixed inset-y-0 left-0 z-40 hidden md:block">
        <Sidebar />
      </div>

      <div
        className={cn(
          "min-w-0 pb-16 transition-[padding] duration-200 md:pb-0",
          mainOffsetClass(compact)
        )}
      >
        <ThemePreferenceSync />
        {children}
      </div>

      <MobileBottomNav />
    </div>
  );
}

export function DashboardShell({
  initialAccount,
  initialPortfolio,
  children,
}: DashboardShellProps) {
  return (
    <PortfolioAgreementProvider>
      <PortfolioProvider
        initialAccount={initialAccount}
        initialPortfolio={initialPortfolio}
      >
        <MobileNavProvider>
          <ShellInner>{children}</ShellInner>
          <PortfolioAgreementModal />
        </MobileNavProvider>
      </PortfolioProvider>
    </PortfolioAgreementProvider>
  );
}
