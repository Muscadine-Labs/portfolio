import { Suspense } from "react";
import { TenantPage } from "@/components/layout/TenantPage";
import { NavPageGuard } from "@/components/layout/NavPageGuard";
import { AssetTable } from "@/components/assets/AssetTable";

export default function AssetsPage() {
  return (
    <TenantPage title="Assets" compact>
      <NavPageGuard page="assets">
        <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-muted/40" />}>
          <AssetTable />
        </Suspense>
      </NavPageGuard>
    </TenantPage>
  );
}
