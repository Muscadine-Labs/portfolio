"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { isNavPageVisible } from "@/lib/ui-preferences";
import type { NavPageKey } from "@/types";

export function NavPageGuard({
  page,
  children,
}: {
  page: NavPageKey;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { uiPreferences } = usePortfolio();
  const visible = isNavPageVisible(uiPreferences, page);

  useEffect(() => {
    if (!visible) router.replace("/dashboard");
  }, [visible, router]);

  if (!visible) {
    return (
      <p className="px-4 py-8 text-sm text-muted-foreground" role="status">
        Redirecting…
      </p>
    );
  }
  return children;
}
