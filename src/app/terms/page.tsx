import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service">
      <p>
        Portfolio is provided for personal portfolio tracking. Use of this
        application is subject to the terms published at{" "}
        <a href="https://muscadine.xyz" className="text-foreground hover:underline">
          muscadine.xyz
        </a>
        .
      </p>
      <p>
        For questions about these terms, contact{" "}
        <a
          href="mailto:muscadinelabs@gmail.com"
          className="text-foreground hover:underline"
        >
          muscadinelabs@gmail.com
        </a>
        .
      </p>
    </LegalPageLayout>
  );
}
