import { TenantPage } from "@/components/layout/TenantPage";
import { PlanContent } from "@/components/plan/PlanContent";
import { NavPageGuard } from "@/components/layout/NavPageGuard";

export default function PlanPage() {
  return (
    <TenantPage title="Plan" compact>
      <NavPageGuard page="plan">
        <PlanContent />
      </NavPageGuard>
    </TenantPage>
  );
}
