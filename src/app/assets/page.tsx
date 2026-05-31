import { Suspense } from "react";
import { TenantPage } from "@/components/layout/TenantPage";
import { NavPageGuard } from "@/components/layout/NavPageGuard";
import { AssetTable } from "@/components/assets/AssetTable";

export default function AssetsPage() {
  return (
    <TenantPage title="Assets" description="Stocks, crypto, real estate, and more">
      <NavPageGuard page="assets">
        <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-muted/30" />}>
          <AssetTable />
        </Suspense>
      </NavPageGuard>
    </TenantPage>
  );
}
