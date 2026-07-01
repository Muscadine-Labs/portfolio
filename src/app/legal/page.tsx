import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { MUSCADINE_LEGAL_URL } from "@/lib/site-links";

export default function LegalPage() {
  return (
    <LegalPageLayout title="Legal">
      <p>
        Muscadine Labs operates Portfolio and related services. Legal notices
        for the portfolio application are published on our main site.
      </p>
      <p>
        <a href={MUSCADINE_LEGAL_URL} className="text-foreground hover:underline">
          View terms, privacy, and legal information at muscadine.xyz/legal
        </a>
      </p>
      <p>
        Website:{" "}
        <a href="https://muscadine.xyz" className="text-foreground hover:underline">
          muscadine.xyz
        </a>
      </p>
      <p>© 2026 Muscadine. All rights reserved.</p>
    </LegalPageLayout>
  );
}
