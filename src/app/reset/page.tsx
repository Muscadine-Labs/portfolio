import { TenantPage } from "@/components/layout/TenantPage";
import { ResetContent } from "@/components/settings/ResetContent";

export default function ResetPage() {
  return (
    <TenantPage title="Reset sign-in" description="Update your username or password">
      <ResetContent />
    </TenantPage>
  );
}
