"use client";

import { useState } from "react";
import { AccountSettingsCard } from "@/components/settings/AccountSettingsCard";
import { AppearanceSettingsCard } from "@/components/settings/AppearanceSettingsCard";
import { DataImportExportCard } from "@/components/settings/DataImportExportCard";
import { NetWorthHistorySettingsCard } from "@/components/settings/NetWorthHistorySettingsCard";
import { NavigationSettingsCard } from "@/components/settings/NavigationSettingsCard";
import { OverviewChartSettingsCard } from "@/components/settings/OverviewChartSettingsCard";
import { OverviewDashboardSettingsCard } from "@/components/settings/OverviewDashboardSettingsCard";
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
    <div className="mx-auto max-w-5xl space-y-4 pb-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <div className="lg:sticky lg:top-20 lg:self-start xl:top-24">
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
              <OverviewDashboardSettingsCard />
              <OverviewChartSettingsCard />
            </section>
          )}

          {activeSection === "navigation" && (
            <section aria-labelledby="settings-navigation">
              <SettingsPanelHeader sectionId="navigation" />
              <NavigationSettingsCard />
            </section>
          )}

          {activeSection === "data" && (
            <section aria-labelledby="settings-data" className="space-y-4">
              <SettingsPanelHeader sectionId="data" />
              <NetWorthHistorySettingsCard />
              <DataImportExportCard />
              <SettingsFooter />
            </section>
          )}

          {activeSection !== "data" ? <SettingsFooter /> : null}
        </div>
      </div>
    </div>
  );
}
