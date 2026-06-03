"use client";

import { cn } from "@/lib/utils";

interface GoalProgressRingProps {
  percent: number;
  size?: number;
  className?: string;
}

export function GoalProgressRing({ percent, size = 44, className }: GoalProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      className={cn("shrink-0 -rotate-90", className)}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted/40"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-primary transition-[stroke-dashoffset]"
      />
    </svg>
  );
}
