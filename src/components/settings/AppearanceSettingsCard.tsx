"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { ThemePreference } from "@/types";
import { Monitor, Moon, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "system", label: "Auto", icon: Monitor, description: "Match system" },
  { value: "light", label: "Light", icon: Sun, description: "Light mode" },
  { value: "dark", label: "Dark", icon: Moon, description: "Dark mode" },
] as const;

export function AppearanceSettingsCard() {
  const { uiPreferences, setThemePreference } = usePortfolio();
  const { setTheme } = useTheme();
  const theme = uiPreferences.theme;
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle className="text-base">Appearance</CardTitle>
        <CardDescription>Choose light, dark, or match your system</CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
