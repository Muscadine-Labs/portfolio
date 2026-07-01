import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <p>
        Portfolio data you enter is stored for your workspace. When authentication is
        enabled, access is limited to credentials configured for your deployment.
      </p>
      <p>
        For privacy questions or data requests, contact{" "}
        <a
          href="mailto:muscadinelabs@gmail.com"
          className="text-foreground hover:underline"
        >
          muscadinelabs@gmail.com
        </a>{" "}
        or visit{" "}
        <a
          href="https://muscadine.xyz/contact"
          className="text-foreground hover:underline"
        >
          muscadine.xyz/contact
        </a>
        .
      </p>
    </LegalPageLayout>
  );
}
