import { TenantPage } from "@/components/layout/TenantPage";
import { OverviewContent } from "@/components/dashboard/OverviewContent";

export default function DashboardPage() {
  return (
    <TenantPage title="Overview" compact>
      <OverviewContent />
    </TenantPage>
  );
}
