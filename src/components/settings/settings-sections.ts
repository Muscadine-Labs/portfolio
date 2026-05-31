import {
  Database,
  LayoutDashboard,
  Navigation,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const SETTINGS_SECTION_IDS = [
  "account",
  "display",
  "wallets",
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
    description: "Theme and overview chart",
    icon: LayoutDashboard,
  },
  {
    id: "wallets",
    label: "Wallets & DeFi",
    description: "Addresses and Morpho sync",
    icon: Wallet,
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
    description: "Import and export",
    icon: Database,
  },
];
