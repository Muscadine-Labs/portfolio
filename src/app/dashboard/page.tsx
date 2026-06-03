import { TenantPage } from "@/components/layout/TenantPage";
import { NavPageGuard } from "@/components/layout/NavPageGuard";
import { OverviewContent } from "@/components/dashboard/OverviewContent";

export default function DashboardPage() {
  return (
    <TenantPage title="Overview" compact>
      <NavPageGuard page="overview">
        <OverviewContent />
      </NavPageGuard>
    </TenantPage>
  );
}
