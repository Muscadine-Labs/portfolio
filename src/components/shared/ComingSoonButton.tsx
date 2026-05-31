"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface ComingSoonButtonProps {
  children: ReactNode;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ComingSoonButton({
  children,
  variant = "outline",
  size = "sm",
  className,
}: ComingSoonButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => toast.info("Coming soon", { description: "Export/Import XLSX will be available in a future release." })}
    >
      {children}
    </Button>
  );
}
