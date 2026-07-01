import Link from "next/link";
import { Grape } from "lucide-react";
import { MUSCADINE_LEGAL_URL } from "@/lib/site-links";
import type { ReactNode } from "react";

interface LegalPageLayoutProps {
  title: string;
  children: ReactNode;
}

export function LegalPageLayout({ title, children }: LegalPageLayoutProps) {
  return (
    <div className="landing-gradient min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Grape className="h-5 w-5 text-violet-400" />
          Portfolio
        </Link>
        <h1 className="mb-6 text-3xl font-bold tracking-tight">{title}</h1>
        <div className="prose prose-invert max-w-none space-y-4 text-sm text-muted-foreground">
          {children}
        </div>
        <footer className="mt-12 border-t border-border/60 pt-8 text-center text-xs text-muted-foreground">
          <p>
            <a href="mailto:muscadinelabs@gmail.com" className="hover:text-foreground">
              muscadinelabs@gmail.com
            </a>
            {" · "}
            <a href="https://muscadine.xyz" className="hover:text-foreground">
              muscadine.xyz
            </a>
          </p>
          <p className="mt-2">
            <a
              href={MUSCADINE_LEGAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Terms · Privacy · Legal
            </a>
          </p>
          <p className="mt-4">© 2026 Muscadine. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
