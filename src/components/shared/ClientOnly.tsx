"use client";

import { useSyncExternalStore, type ReactNode } from "react";

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

function subscribe() {
  return () => {};
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
