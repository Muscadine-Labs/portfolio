"use client";

import {
  SETTINGS_SECTIONS,
  type SettingsSectionId,
} from "@/components/settings/settings-sections";
import { cn } from "@/lib/utils";

interface SettingsNavProps {
  active: SettingsSectionId;
  onChange: (id: SettingsSectionId) => void;
}

export function SettingsNav({ active, onChange }: SettingsNavProps) {
  return (
    <nav
      aria-label="Settings sections"
      className="flex flex-col gap-4 lg:w-52 lg:shrink-0"
    >
      <div className="hidden lg:block">
        <p className="px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Settings
        </p>
        <ul className="mt-2 space-y-0.5">
          {SETTINGS_SECTIONS.map(({ id, label, description, icon: Icon }) => {
            const isActive = active === id;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onChange(id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-xs opacity-80">{description}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1 lg:hidden">
        <div className="flex w-max min-w-full gap-2">
          {SETTINGS_SECTIONS.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/60 bg-card/80 text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
