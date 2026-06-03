import { TenantPage } from "@/components/layout/TenantPage";
import { NavPageGuard } from "@/components/layout/NavPageGuard";
import { WalletMapGuide } from "@/components/plan/WalletMapGuide";

export default function WalletsPage() {
  return (
    <TenantPage title="Wallets" compact>
      <NavPageGuard page="wallets">
        <WalletMapGuide />
      </NavPageGuard>
    </TenantPage>
  );
}
