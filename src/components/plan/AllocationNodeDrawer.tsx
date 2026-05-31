"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
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
import type { AllocationNode, GoalTrackPage } from "@/types";

const TRACK_PAGES: { value: GoalTrackPage; label: string }[] = [
  { value: "assets", label: "Assets" },
  { value: "cash", label: "Cash" },
  { value: "liabilities", label: "Liabilities" },
];

const schema = z
  .object({
    label: z.string().min(1, "Label is required"),
    percentOfParent: z.number().min(0).max(100),
    notes: z.string().optional(),
    trackMode: z.enum(["none", "linked"]),
    trackPage: z.enum(["assets", "cash", "liabilities"]).optional(),
    trackSectionId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.trackMode === "linked" && (!data.trackPage || !data.trackSectionId)) {
      ctx.addIssue({
        code: "custom",
        message: "Choose a portfolio section",
        path: ["trackSectionId"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface AllocationNodeDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node?: AllocationNode | null;
  parentId: string | null;
  parentLabel?: string;
  siblingCount: number;
  onSave: (node: AllocationNode) => void;
}

export function AllocationNodeDrawer({
  open,
  onOpenChange,
  node,
  parentId,
  parentLabel,
  siblingCount,
  onSave,
}: AllocationNodeDrawerProps) {
  const { getSections } = usePortfolio();
  const assetSections = getSections("assets");
  const cashSections = getSections("cash");
  const liabilitySections = getSections("liabilities");

  const { register, control, handleSubmit, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { label: "", percentOfParent: 0, notes: "", trackMode: "none" },
  });

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
      const linked = Boolean(node?.trackPage && node?.trackSectionId);
      return {
        label: node?.label ?? "",
        percentOfParent: node?.percentOfParent ?? 0,
        notes: node?.notes ?? "",
        trackMode: linked ? ("linked" as const) : ("none" as const),
        trackPage: node?.trackPage,
        trackSectionId: node?.trackSectionId,
      };
    },
    [node?.id, parentId]
  );

  const onSubmit = (values: FormValues) => {
    const linked = values.trackMode === "linked";
    onSave({
      id: node?.id ?? createEntityId("alloc"),
      parentId: node?.parentId ?? parentId,
      label: values.label,
      percentOfParent: values.percentOfParent,
      order: node?.order ?? siblingCount,
      notes: values.notes || undefined,
      trackPage: linked ? values.trackPage : undefined,
      trackSectionId: linked ? values.trackSectionId : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {node ? "Edit allocation" : parentLabel ? `Add under ${parentLabel}` : "Add top-level bucket"}
          </DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="alloc-label">Name</Label>
            <Input id="alloc-label" {...register("label")} placeholder="e.g. Brokerage" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alloc-pct">% of {parentLabel ?? "income"}</Label>
            <Input
              id="alloc-pct"
              type="number"
              step="any"
              {...register("percentOfParent", { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              Sibling buckets under the same parent should add to 100%.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alloc-track-mode">Compare to portfolio (optional)</Label>
            <NativeSelect
              id="alloc-track-mode"
              value={trackMode}
              onValueChange={(v) => {
                setValue("trackMode", v as FormValues["trackMode"]);
                if (v === "none") {
                  setValue("trackPage", undefined);
                  setValue("trackSectionId", undefined);
                } else if (!trackPage) {
                  setValue("trackPage", "assets");
                }
              }}
              options={[
                { value: "none", label: "Plan only (% of income)" },
                { value: "linked", label: "Link to assets / cash / liabilities section" },
              ]}
            />
          </div>

          {trackMode === "linked" && (
            <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-3">
              <div className="space-y-2">
                <Label htmlFor="alloc-track-page">Portfolio area</Label>
                <NativeSelect
                  id="alloc-track-page"
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
                  <Label htmlFor="alloc-track-section">Section</Label>
                  <NativeSelect
                    id="alloc-track-section"
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

          <div className="space-y-2">
            <Label htmlFor="alloc-notes">Notes (optional)</Label>
            <Input id="alloc-notes" {...register("notes")} placeholder="e.g. Fidelity account" />
          </div>
          <DrawerFooter className="px-0">
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
