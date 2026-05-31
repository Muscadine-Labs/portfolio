"use client";

import { useState } from "react";
import { AccountSettingsCard } from "@/components/settings/AccountSettingsCard";
import { AppearanceSettingsCard } from "@/components/settings/AppearanceSettingsCard";
import { ConnectedWalletsSettingsCard } from "@/components/settings/ConnectedWalletsSettingsCard";
import { DataImportExportCard } from "@/components/settings/DataImportExportCard";
import { NavigationSettingsCard } from "@/components/settings/NavigationSettingsCard";
import { OverviewChartSettingsCard } from "@/components/settings/OverviewChartSettingsCard";
import { SettingsFooter } from "@/components/settings/SettingsFooter";
import { SettingsNav } from "@/components/settings/SettingsNav";
import {
  SETTINGS_SECTIONS,
  type SettingsSectionId,
} from "@/components/settings/settings-sections";

interface SettingsContentProps {
  authEnabled: boolean;
}

function SettingsPanelHeader({ sectionId }: { sectionId: SettingsSectionId }) {
  const section = SETTINGS_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return null;
  return (
    <header className="mb-4 lg:hidden">
      <h2 className="text-lg font-semibold tracking-tight">{section.label}</h2>
      <p className="text-sm text-muted-foreground">{section.description}</p>
    </header>
  );
}

export function SettingsContent({ authEnabled }: SettingsContentProps) {
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("account");

  return (
    <div className="mx-auto max-w-5xl pb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SettingsNav active={activeSection} onChange={setActiveSection} />
        </div>

        <div className="min-w-0 flex-1 space-y-6">
          {activeSection === "account" && (
            <section aria-labelledby="settings-account">
              <SettingsPanelHeader sectionId="account" />
              <AccountSettingsCard authEnabled={authEnabled} />
            </section>
          )}

          {activeSection === "display" && (
            <section aria-labelledby="settings-display" className="space-y-4">
              <SettingsPanelHeader sectionId="display" />
              <AppearanceSettingsCard />
              <OverviewChartSettingsCard />
            </section>
          )}

          {activeSection === "wallets" && (
            <section aria-labelledby="settings-wallets">
              <SettingsPanelHeader sectionId="wallets" />
              <ConnectedWalletsSettingsCard />
            </section>
          )}

          {activeSection === "navigation" && (
            <section aria-labelledby="settings-navigation">
              <SettingsPanelHeader sectionId="navigation" />
              <NavigationSettingsCard />
            </section>
          )}

          {activeSection === "data" && (
            <section aria-labelledby="settings-data">
              <SettingsPanelHeader sectionId="data" />
              <DataImportExportCard />
            </section>
          )}

          <SettingsFooter />
        </div>
      </div>
    </div>
  );
}
