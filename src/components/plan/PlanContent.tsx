"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, PiggyBank, Target } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AllocationGuide } from "@/components/plan/AllocationGuide";
import { PlanningContent } from "@/components/planning/PlanningContent";
import { SpendingContent } from "@/components/spending/SpendingContent";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import {
  getDefaultPlanTab,
  getVisiblePlanTabs,
  isPlanTabVisible,
  resolvePlanTabFromUrl,
  type PlanTabId,
} from "@/lib/ui-preferences";
import { cn } from "@/lib/utils";

const TAB_CONFIG: Record<
  PlanTabId,
  { label: string; icon: typeof BookOpen; content: React.ReactNode }
> = {
  income: { label: "Income", icon: BookOpen, content: <AllocationGuide /> },
  budget: { label: "Budget", icon: PiggyBank, content: <SpendingContent /> },
  goals: { label: "Goals", icon: Target, content: <PlanningContent /> },
};

function PlanTabsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { uiPreferences } = usePortfolio();

  const visibleTabs = useMemo(
    () => getVisiblePlanTabs(uiPreferences),
    [uiPreferences]
  );

  const tabParam = searchParams.get("tab");
  const requestedTab = resolvePlanTabFromUrl(tabParam);

  useEffect(() => {
    if (tabParam === "wallets") {
      router.replace("/wallets", { scroll: false });
    }
  }, [tabParam, router]);

  const activeTab: PlanTabId | null = useMemo(() => {
    if (visibleTabs.length === 0) return null;
    if (requestedTab && isPlanTabVisible(uiPreferences, requestedTab)) {
      return requestedTab;
    }
    return getDefaultPlanTab(uiPreferences);
  }, [uiPreferences, visibleTabs, requestedTab]);

  useEffect(() => {
    if (visibleTabs.length === 0 || activeTab == null) return;
    const needsRedirect =
      (tabParam === "guide" && activeTab !== "income") ||
      (requestedTab != null && requestedTab !== activeTab) ||
      (tabParam == null && activeTab !== "income");
    if (!needsRedirect) return;

    const params = new URLSearchParams(searchParams.toString());
    if (activeTab === "income") params.delete("tab");
    else params.set("tab", activeTab);
    const qs = params.toString();
    router.replace(qs ? `/plan?${qs}` : "/plan", { scroll: false });
  }, [activeTab, visibleTabs.length, tabParam, requestedTab, router, searchParams]);

  if (visibleTabs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No Plan tabs are enabled. Turn on Income, Budget, or Goals in Settings, or hide Plan
          from the sidebar.
        </p>
        <Link
          href="/settings"
          className="mt-4 inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-accent"
        >
          Open Settings
        </Link>
      </div>
    );
  }

  const setTab = (tab: PlanTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "income") params.delete("tab");
    else params.set("tab", tab);
    const qs = params.toString();
    router.replace(qs ? `/plan?${qs}` : "/plan", { scroll: false });
  };

  const gridCols =
    visibleTabs.length >= 4
      ? "sm:grid-cols-4"
      : visibleTabs.length === 3
        ? "sm:grid-cols-3"
        : visibleTabs.length === 2
          ? "sm:grid-cols-2"
          : "sm:grid-cols-1";

  return (
    <Tabs value={activeTab ?? visibleTabs[0]} onValueChange={(v) => setTab(v as PlanTabId)}>
      <TabsList className={cn("grid h-auto w-full max-w-xl grid-cols-2 gap-1", gridCols)}>
        {visibleTabs.map((id) => {
          const { label, icon: Icon } = TAB_CONFIG[id];
          return (
            <TabsTrigger key={id} value={id} className="gap-1.5 text-xs sm:text-sm">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {visibleTabs.map((id) => (
        <TabsContent key={id} value={id} className="mt-6">
          {TAB_CONFIG[id].content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function PlanContent() {
  return (
    <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-muted/30" />}>
      <PlanTabsInner />
    </Suspense>
  );
}
