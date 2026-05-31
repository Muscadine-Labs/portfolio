import { TenantPage } from "@/components/layout/TenantPage";
import { PlanContent } from "@/components/plan/PlanContent";
import { NavPageGuard } from "@/components/layout/NavPageGuard";

export default function PlanPage() {
  return (
    <TenantPage
      title="Plan"
      description="Income guide, monthly budget, and financial goals"
    >
      <NavPageGuard page="plan">
        <PlanContent />
      </NavPageGuard>
    </TenantPage>
  );
}
