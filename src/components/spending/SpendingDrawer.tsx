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
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { SpendingItem } from "@/types";

const schema = z.object({
  name: z.string().min(1),
  sectionId: z.string().min(1),
  budget: z.number().min(0),
  spent: z.number().min(0),
  frequency: z.enum(["monthly", "weekly", "yearly", "one_time"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface SpendingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: SpendingItem | null;
  defaultSectionId?: string;
  onSave: (item: SpendingItem) => void;
}

export function SpendingDrawer({
  open,
  onOpenChange,
  item,
  defaultSectionId,
  onSave,
}: SpendingDrawerProps) {
  const { getSections } = usePortfolio();
  const sections = getSections("spending");

  const { register, control, handleSubmit, reset, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      sectionId: "",
      budget: 0,
      spent: 0,
      frequency: "monthly",
    },
  });

  const sectionId = useWatch({ control, name: "sectionId" });
  const frequency = useWatch({ control, name: "frequency" });

  useDrawerFormReset(
    open,
    reset,
    () => {
      const fallbackSection = defaultSectionId ?? sections[0]?.id ?? "";
      if (item) {
        return {
          name: item.name,
          sectionId: item.sectionId,
          budget: item.budget,
          spent: item.spent,
          frequency: item.frequency,
          notes: item.notes ?? "",
        };
      }
      return {
        name: "",
        sectionId: fallbackSection,
        budget: 0,
        spent: 0,
        frequency: "monthly" as const,
        notes: "",
      };
    },
    [item?.id, defaultSectionId, sections.length]
  );

  const onSubmit = (values: FormValues) => {
    onSave({
      id: item?.id ?? createEntityId("spend"),
      name: values.name,
      sectionId: values.sectionId,
      budget: values.budget,
      spent: values.spent,
      frequency: values.frequency,
      notes: values.notes || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{item ? "Edit Item" : "Add Item"}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 pb-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...register("name")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="spending-section">Section</Label>
            <NativeSelect
              id="spending-section"
              value={sectionId}
              onValueChange={(v) => setValue("sectionId", v)}
              options={sections.map((s) => ({ value: s.id, label: s.label }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Budget</Label>
              <Input type="number" step="any" {...register("budget", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Spent</Label>
              <Input type="number" step="any" {...register("spent", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="spending-frequency">Frequency</Label>
            <NativeSelect
              id="spending-frequency"
              value={frequency}
              onValueChange={(v) => setValue("frequency", v as FormValues["frequency"])}
              options={[
                { value: "monthly", label: "Monthly" },
                { value: "weekly", label: "Weekly" },
                { value: "yearly", label: "Yearly" },
                { value: "one_time", label: "One-time" },
              ]}
            />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input {...register("notes")} />
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
