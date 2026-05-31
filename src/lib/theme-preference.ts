export const THEME_PREFERENCE_VALUES = ["system", "light", "dark"] as const;

export type ThemePreference = (typeof THEME_PREFERENCE_VALUES)[number];

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "system";

export function normalizeThemePreference(value?: string): ThemePreference {
  if (value === "auto") return "system";
  if (value === "light" || value === "dark" || value === "system") return value;
  return DEFAULT_THEME_PREFERENCE;
}
