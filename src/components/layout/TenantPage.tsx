import { DashboardShell } from "@/components/layout/DashboardShell";
import { Header } from "@/components/layout/Header";
import { getInitialAccount, getInitialPortfolio } from "@/lib/tenant";
import type { ReactNode } from "react";

interface TenantPageProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export async function TenantPage({
  title,
  description,
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
      <Header title={title} description={description} />
      <main className="p-4 md:p-8">{children}</main>
    </DashboardShell>
  );
}
