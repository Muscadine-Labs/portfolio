import { Suspense } from "react";
import { TenantPage } from "@/components/layout/TenantPage";
import { NavPageGuard } from "@/components/layout/NavPageGuard";
import { LiabilityTable } from "@/components/liabilities/LiabilityTable";

export default function LiabilitiesPage() {
  return (
    <TenantPage title="Liabilities" compact>
      <NavPageGuard page="liabilities">
        <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-muted/30" />}>
          <LiabilityTable />
        </Suspense>
      </NavPageGuard>
    </TenantPage>
  );
}
