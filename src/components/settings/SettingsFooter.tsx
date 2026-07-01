import { MUSCADINE_LEGAL_URL } from "@/lib/site-links";

const externalLinkClass = "hover:text-foreground";

export function SettingsFooter() {
  return (
    <footer className="border-t border-border/60 pt-8 text-center text-sm text-muted-foreground">
      <p>
        Questions or feedback?{" "}
        <a
          href="mailto:muscadinelabs@gmail.com"
          className="text-foreground underline-offset-4 hover:underline"
        >
          muscadinelabs@gmail.com
        </a>
      </p>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <a
          href="https://muscadine.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className={externalLinkClass}
        >
          muscadine.xyz
        </a>
        <span aria-hidden className="text-border">
          ·
        </span>
        <a
          href="https://muscadine.xyz/contact"
          target="_blank"
          rel="noopener noreferrer"
          className={externalLinkClass}
        >
          Contact
        </a>
      </p>
      <p className="mt-3">
        <a
          href={MUSCADINE_LEGAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={externalLinkClass}
        >
          Terms · Privacy · Legal
        </a>
      </p>
      <p className="mt-6 text-xs">© 2026 Muscadine. All rights reserved.</p>
    </footer>
  );
}
