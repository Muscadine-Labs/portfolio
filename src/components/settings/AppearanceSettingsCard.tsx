"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { ThemePreference } from "@/types";
import { Grape, Monitor, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "system", label: "Auto", icon: Monitor, description: "Match system" },
  { value: "light", label: "Light", icon: Sun, description: "Light mode" },
  { value: "dark", label: "Dark", icon: Moon, description: "Dark mode" },
] as const;

export function AppearanceSettingsCard() {
  const { uiPreferences, setThemePreference, setSidebarCompact } = usePortfolio();
  const { setTheme } = useTheme();
  const theme = uiPreferences.theme;
  const sidebarCompact = uiPreferences.sidebarCompact;
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle className="text-base">Appearance</CardTitle>
        <CardDescription>Theme and sidebar layout — saved to your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="mb-3 block text-sm text-muted-foreground">Theme</Label>
          <div className="grid grid-cols-3 gap-2">
            {!mounted ? (
              <p className="col-span-3 text-sm text-muted-foreground">Loading theme…</p>
            ) : null}
            {mounted &&
              THEME_OPTIONS.map(({ value, label, icon: Icon, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setThemePreference(value as ThemePreference);
                    setTheme(value);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-colors",
                    theme === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 hover:bg-accent/50"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground">{description}</span>
                </button>
              ))}
          </div>
        </div>

        <div className="border-t border-border/40 pt-6">
          <Label className="mb-3 block text-sm text-muted-foreground">Sidebar</Label>
          <button
            type="button"
            onClick={() => setSidebarCompact(!sidebarCompact)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors",
              sidebarCompact
                ? "border-primary bg-primary/10"
                : "border-border/60 hover:bg-accent/50"
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                sidebarCompact ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              <Grape className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">
                {sidebarCompact ? "Compact sidebar" : "Full sidebar"}
              </span>
              <span className="block text-xs text-muted-foreground">
                {sidebarCompact
                  ? "Icon-only nav on desktop. Click the grape in the sidebar to expand."
                  : "Show page names in the sidebar. Click the grape to collapse."}
              </span>
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                sidebarCompact
                  ? "border-primary/40 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              {sidebarCompact ? "On" : "Off"}
            </span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
