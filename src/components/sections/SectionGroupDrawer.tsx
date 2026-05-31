"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDrawerFormReset } from "@/hooks/use-drawer-form-reset";
import { createSectionGroupId } from "@/lib/section-groups";
import type { SectionGroup, SectionGroupPage } from "@/types";

const groupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
});

type GroupFormValues = z.infer<typeof groupSchema>;

interface SectionGroupDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: SectionGroup | null;
  page: SectionGroupPage;
  defaultOrder?: number;
  onSave: (group: SectionGroup) => void;
}

export function SectionGroupDrawer({
  open,
  onOpenChange,
  group,
  page,
  defaultOrder = 0,
  onSave,
}: SectionGroupDrawerProps) {
  const { register, handleSubmit, reset } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: "" },
  });

  useDrawerFormReset(
    open,
    reset,
    () => ({ name: group?.name ?? "" }),
    [group?.id]
  );

  const onSubmit = (values: GroupFormValues) => {
    onSave({
      id: group?.id ?? createSectionGroupId(page),
      page,
      name: values.name.trim(),
      order: group?.order ?? defaultOrder,
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{group ? "Edit group" : "Add group"}</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <DrawerBody className="space-y-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group name</Label>
            <Input
              id="group-name"
              {...register("name")}
              placeholder="e.g. Retirement, DeFi"
            />
          </div>
          </DrawerBody>
          <DrawerFooter>
            <Button type="submit">{group ? "Save" : "Create group"}</Button>
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
