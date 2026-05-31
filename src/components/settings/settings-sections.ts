import {
  Database,
  LayoutDashboard,
  Navigation,
  User,
  type LucideIcon,
} from "lucide-react";

export const SETTINGS_SECTION_IDS = [
  "account",
  "display",
  "navigation",
  "data",
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTION_IDS)[number];

export interface SettingsSectionDef {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const SETTINGS_SECTIONS: SettingsSectionDef[] = [
  {
    id: "account",
    label: "Account",
    description: "Profile and sign-in",
    icon: User,
  },
  {
    id: "display",
    label: "Display",
    description: "Theme, sidebar, and chart",
    icon: LayoutDashboard,
  },
  {
    id: "navigation",
    label: "Navigation",
    description: "Sidebar and plan tabs",
    icon: Navigation,
  },
  {
    id: "data",
    label: "Data",
    description: "Net worth history, import, and export",
    icon: Database,
  },
];
