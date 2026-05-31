"use client";

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
import type { AllocationNode } from "@/types";

function parseOptionalNumber(value: unknown): number | undefined {
  if (value === "" || value == null) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseNumber(value: unknown, fallback = 0): number {
  if (value === "" || value == null) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const schema = z
  .object({
    label: z.string().min(1, "Label is required"),
    targetMode: z.enum(["percent", "amount"]),
    percentOfParent: z.number().min(0).max(100),
    monthlyAmount: z.number().min(0).optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.targetMode === "amount" && data.monthlyAmount == null) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a monthly dollar amount",
        path: ["monthlyAmount"],
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
  const { register, control, handleSubmit, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: "",
      targetMode: "percent",
      percentOfParent: 0,
      monthlyAmount: undefined,
      notes: "",
    },
  });

  const targetMode = useWatch({ control, name: "targetMode" });

  useDrawerFormReset(
    open,
    reset,
    () => ({
      label: node?.label ?? "",
      targetMode: node?.targetMode === "amount" ? ("amount" as const) : ("percent" as const),
      percentOfParent: node?.percentOfParent ?? 0,
      monthlyAmount: node?.monthlyAmount,
      notes: node?.notes ?? "",
    }),
    [node?.id, parentId]
  );

  const onSubmit = (values: FormValues) => {
    onSave({
      id: node?.id ?? createEntityId("alloc"),
      parentId: node?.parentId ?? parentId,
      label: values.label,
      percentOfParent: values.targetMode === "percent" ? values.percentOfParent : 0,
      targetMode: values.targetMode,
      monthlyAmount: values.targetMode === "amount" ? values.monthlyAmount : undefined,
      order: node?.order ?? siblingCount,
      notes: values.notes || undefined,
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
            <Label htmlFor="alloc-target-mode">Target type</Label>
            <NativeSelect
              id="alloc-target-mode"
              value={targetMode}
              onValueChange={(v) => setValue("targetMode", v as FormValues["targetMode"])}
              options={[
                { value: "percent", label: `% of ${parentLabel ?? "income"}` },
                { value: "amount", label: "Fixed monthly amount ($)" },
              ]}
            />
          </div>
          {targetMode === "percent" ? (
            <div className="space-y-2">
              <Label htmlFor="alloc-pct">% of {parentLabel ?? "income"}</Label>
              <Input
                id="alloc-pct"
                type="number"
                step="any"
                {...register("percentOfParent", { setValueAs: (v) => parseNumber(v, 0) })}
              />
              <p className="text-xs text-muted-foreground">
                Sibling buckets under the same parent should add to 100%.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="alloc-amount">Monthly amount ($)</Label>
              <Input
                id="alloc-amount"
                type="number"
                step="any"
                min={0}
                placeholder="e.g. 2000"
                {...register("monthlyAmount", { setValueAs: parseOptionalNumber })}
              />
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
