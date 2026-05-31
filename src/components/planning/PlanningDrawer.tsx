"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useDrawerFormReset } from "@/hooks/use-drawer-form-reset";
import { createEntityId } from "@/lib/sections";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { GoalTrackPage, PlanningItem } from "@/types";

const TRACK_PAGES: { value: GoalTrackPage; label: string }[] = [
  { value: "assets", label: "Assets" },
  { value: "cash", label: "Cash" },
  { value: "liabilities", label: "Liabilities" },
];

const schema = z
  .object({
    title: z.string().min(1),
    sectionId: z.string().min(1),
    targetAmount: z.number().optional(),
    currentAmount: z.number().optional(),
    targetDate: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(["not_started", "in_progress", "completed"]),
    trackMode: z.enum(["manual", "linked"]),
    trackPage: z.enum(["assets", "cash", "liabilities"]).optional(),
    trackSectionId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.trackMode === "linked" && (!data.trackPage || !data.trackSectionId)) {
      ctx.addIssue({
        code: "custom",
        message: "Choose a portfolio section to track",
        path: ["trackSectionId"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface PlanningDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: PlanningItem | null;
  defaultSectionId?: string;
  onSave: (item: PlanningItem) => void;
}

export function PlanningDrawer({
  open,
  onOpenChange,
  item,
  defaultSectionId,
  onSave,
}: PlanningDrawerProps) {
  const { getSections } = usePortfolio();
  const planningSections = getSections("planning");
  const assetSections = getSections("assets");
  const cashSections = getSections("cash");
  const liabilitySections = getSections("liabilities");

  const { register, control, handleSubmit, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      sectionId: "",
      status: "not_started",
      trackMode: "manual",
    },
  });

  const sectionId = useWatch({ control, name: "sectionId" });
  const status = useWatch({ control, name: "status" });
  const trackMode = useWatch({ control, name: "trackMode" });
  const trackPage = useWatch({ control, name: "trackPage" });
  const trackSectionId = useWatch({ control, name: "trackSectionId" });

  const linkableSections = useMemo(() => {
    if (!trackPage) return [];
    if (trackPage === "assets") return assetSections;
    if (trackPage === "cash") return cashSections;
    return liabilitySections;
  }, [trackPage, assetSections, cashSections, liabilitySections]);

  useDrawerFormReset(
    open,
    reset,
    () => {
      const fallbackSection = defaultSectionId ?? planningSections[0]?.id ?? "";
      if (item) {
        const linked = Boolean(item.trackPage && item.trackSectionId);
        return {
          title: item.title,
          sectionId: item.sectionId,
          targetAmount: item.targetAmount,
          currentAmount: item.currentAmount,
          targetDate: item.targetDate ?? "",
          notes: item.notes ?? "",
          status: item.status,
          trackMode: linked ? ("linked" as const) : ("manual" as const),
          trackPage: item.trackPage,
          trackSectionId: item.trackSectionId,
        };
      }
      return {
        title: "",
        sectionId: fallbackSection,
        status: "not_started" as const,
        targetDate: "",
        notes: "",
        trackMode: "manual" as const,
      };
    },
    [item?.id, defaultSectionId, planningSections.length]
  );

  const onSubmit = (values: FormValues) => {
    const linked = values.trackMode === "linked";
    onSave({
      id: item?.id ?? createEntityId("plan"),
      title: values.title,
      sectionId: values.sectionId,
      targetAmount: values.targetAmount,
      currentAmount: linked ? undefined : values.currentAmount,
      targetDate: values.targetDate || undefined,
      notes: values.notes || undefined,
      status: values.status,
      trackPage: linked ? values.trackPage : undefined,
      trackSectionId: linked ? values.trackSectionId : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{item ? "Edit Goal" : "Add Goal"}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DrawerBody className="space-y-4 pb-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...register("title")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-section">Goal section</Label>
            <NativeSelect
              id="goal-section"
              value={sectionId}
              onValueChange={(v) => setValue("sectionId", v)}
              options={planningSections.map((s) => ({ value: s.id, label: s.label }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal-track-mode">Progress tracking</Label>
            <NativeSelect
              id="goal-track-mode"
              value={trackMode}
              onValueChange={(v) => {
                setValue("trackMode", v as FormValues["trackMode"]);
                if (v === "manual") {
                  setValue("trackPage", undefined);
                  setValue("trackSectionId", undefined);
                } else if (!trackPage) {
                  setValue("trackPage", "assets");
                }
              }}
              options={[
                { value: "manual", label: "Manual amount" },
                { value: "linked", label: "Link to portfolio section" },
              ]}
            />
          </div>

          {trackMode === "linked" && (
            <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">
                Current progress updates from the total value in that section (assets use market
                value, cash uses balances, liabilities use debt balances).
              </p>
              <div className="space-y-2">
                <Label htmlFor="goal-track-page">Portfolio area</Label>
                <NativeSelect
                  id="goal-track-page"
                  value={trackPage ?? ""}
                  onValueChange={(v) => {
                    setValue("trackPage", v as GoalTrackPage);
                    setValue("trackSectionId", undefined);
                  }}
                  options={TRACK_PAGES}
                  placeholder="Choose area"
                />
              </div>
              {trackPage && (
                <div className="space-y-2">
                  <Label htmlFor="goal-track-section">Section</Label>
                  <NativeSelect
                    id="goal-track-section"
                    value={trackSectionId ?? ""}
                    onValueChange={(v) => setValue("trackSectionId", v || undefined)}
                    options={linkableSections.map((s) => ({ value: s.id, label: s.label }))}
                    placeholder={
                      linkableSections.length === 0 ? "No sections" : "Choose section"
                    }
                    disabled={linkableSections.length === 0}
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Target Amount</Label>
              <Input type="number" step="any" {...register("targetAmount", { valueAsNumber: true })} />
            </div>
            {trackMode === "manual" ? (
              <div className="space-y-2">
                <Label>Current Amount</Label>
                <Input
                  type="number"
                  step="any"
                  {...register("currentAmount", { valueAsNumber: true })}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Current Amount</Label>
                <p className="rounded-md border border-dashed border-border/60 px-3 py-2 text-sm text-muted-foreground">
                  Auto from linked section
                </p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Target Date</Label>
            <Input type="date" {...register("targetDate")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal-status">Status</Label>
            <NativeSelect
              id="goal-status"
              value={status}
              onValueChange={(v) => setValue("status", v as FormValues["status"])}
              options={[
                { value: "not_started", label: "Not Started" },
                { value: "in_progress", label: "In Progress" },
                { value: "completed", label: "Completed" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input {...register("notes")} />
          </div>
          </DrawerBody>
          <DrawerFooter>
            <Button type="submit">Save</Button>
            <DrawerClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
