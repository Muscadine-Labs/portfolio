"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { usePortfolio } from "@/components/providers/PortfolioProvider";

/** Applies `uiPreferences.theme` from portfolio seed / import to next-themes. */
export function ThemePreferenceSync() {
  const { uiPreferences } = usePortfolio();
  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme(uiPreferences.theme);
  }, [uiPreferences.theme, setTheme]);

  return null;
}
