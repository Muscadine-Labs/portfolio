"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PasswordReveal({
  password,
  ariaLabel,
  className,
  inputClassName,
}: {
  password: string;
  ariaLabel: string;
  className?: string;
  inputClassName?: string;
}) {
  const [visible, setVisible] = useState(false);

  if (!password) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        type={visible ? "text" : "password"}
        value={password}
        readOnly
        className={cn("bg-muted/20 pr-10 font-mono text-sm", inputClassName)}
        aria-label={ariaLabel}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
        onClick={() => setVisible((open) => !open)}
        aria-label={visible ? `Hide ${ariaLabel}` : `Show ${ariaLabel}`}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}
