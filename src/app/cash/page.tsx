import { Suspense } from "react";
import { TenantPage } from "@/components/layout/TenantPage";
import { NavPageGuard } from "@/components/layout/NavPageGuard";
import { CashPageContent } from "@/components/cash/CashCard";

export default function CashPage() {
  return (
    <TenantPage title="Cash" compact>
      <NavPageGuard page="cash">
        <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-muted/30" />}>
          <CashPageContent />
        </Suspense>
      </NavPageGuard>
    </TenantPage>
  );
}
