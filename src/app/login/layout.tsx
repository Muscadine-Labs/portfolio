import { Suspense } from "react";
import type { ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="landing-gradient flex min-h-screen items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
