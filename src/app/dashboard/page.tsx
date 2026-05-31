import { TenantPage } from "@/components/layout/TenantPage";
import { OverviewContent } from "@/components/dashboard/OverviewContent";

export default function DashboardPage() {
  return (
    <TenantPage
      title="Overview"
      description="Net worth snapshot across assets, cash, and liabilities"
    >
      <OverviewContent />
    </TenantPage>
  );
}
