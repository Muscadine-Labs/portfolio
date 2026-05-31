"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LtvBarProps {
  ltv: number;
  className?: string;
}

export function getLtvHealth(ltv: number): {
  color: string;
  label: string;
  progressClass: string;
} {
  if (ltv < 50) {
    return {
      color: "text-emerald-400",
      label: "Healthy",
      progressClass: "[&>div]:bg-emerald-500",
    };
  }
  if (ltv <= 70) {
    return {
      color: "text-amber-400",
      label: "Moderate",
      progressClass: "[&>div]:bg-amber-500",
    };
  }
  return {
    color: "text-red-400",
    label: "At Risk",
    progressClass: "[&>div]:bg-red-500",
  };
}

export function LtvBar({ ltv, className }: LtvBarProps) {
  const health = getLtvHealth(ltv);

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">LTV Health</span>
        <span className={cn("font-medium", health.color)}>
          {ltv.toFixed(1)}% · {health.label}
        </span>
      </div>
      <Progress value={Math.min(ltv, 100)} className={cn("h-2", health.progressClass)} />
    </div>
  );
}
