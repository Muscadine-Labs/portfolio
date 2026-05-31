import { DashboardShell } from "@/components/layout/DashboardShell";
import { Header } from "@/components/layout/Header";
import { getInitialAccount, getInitialPortfolio } from "@/lib/tenant";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TenantPageProps {
  title: string;
  description?: string;
  compact?: boolean;
  children: ReactNode;
}

export async function TenantPage({
  title,
  description,
  compact = false,
  children,
}: TenantPageProps) {
  const [initialAccount, initialPortfolio] = await Promise.all([
    getInitialAccount(),
    getInitialPortfolio(),
  ]);

  return (
    <DashboardShell
      initialAccount={initialAccount}
      initialPortfolio={initialPortfolio}
    >
      <Header title={title} description={description} compact={compact} />
      <main
        className={cn(
          "min-w-0 max-w-full overflow-x-hidden",
          compact ? "p-2 sm:p-3 md:p-4" : "p-3 sm:p-4 md:p-8"
        )}
      >
        {children}
      </main>
    </DashboardShell>
  );
}
