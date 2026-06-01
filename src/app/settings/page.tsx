import { TenantPage } from "@/components/layout/TenantPage";
import { SettingsContent } from "@/components/settings/SettingsContent";
import { isTenantCredentialManagementEnabled } from "@/lib/tenant";

export default async function SettingsPage() {
  const authEnabled = await isTenantCredentialManagementEnabled();

  return (
    <TenantPage title="Settings" description="Manage account, display, wallets, and data">
      <SettingsContent authEnabled={authEnabled} />
    </TenantPage>
  );
}
