"use client";

import { type ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNavProvider, useMobileNav } from "@/components/layout/MobileNavContext";
import { PortfolioProvider } from "@/components/providers/PortfolioProvider";
import { PortfolioAgreementProvider } from "@/contexts/PortfolioAgreementContext";
import { PortfolioAgreementModal } from "@/components/legal/PortfolioAgreementModal";
import { ThemePreferenceSync } from "@/components/shared/ThemePreferenceSync";
import type { PortfolioImportResult } from "@/lib/portfolio-data";
import type { User } from "@/types";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  initialAccount: User;
  initialPortfolio: PortfolioImportResult;
  children: ReactNode;
}

function ShellInner({ children }: { children: ReactNode }) {
  const { open, setOpen } = useMobileNav();

  return (
    <div className="min-h-screen bg-background">
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
        />
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-64 transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar onNavigate={() => setOpen(false)} />
        </div>
      </div>

      <div className="fixed inset-y-0 left-0 z-40 hidden md:block">
        <Sidebar />
      </div>

      <div className="md:pl-64">
        <ThemePreferenceSync />
        {children}
      </div>
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
