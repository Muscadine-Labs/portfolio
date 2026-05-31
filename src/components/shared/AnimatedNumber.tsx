"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  format?: "currency" | "percent" | "number";
  decimals?: number;
}

function formatValue(
  display: number,
  format: AnimatedNumberProps["format"],
  decimals: number
) {
  if (format === "currency") return formatCurrency(display);
  if (format === "percent") return formatPercent(display, decimals);
  return display.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function AnimatedNumber({
  value,
  className,
  format = "currency",
  decimals = 2,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    let active = true;
    let frameId = 0;
    const duration = 1400;
    const start = performance.now();
    const from = fromRef.current;

    const tick = (now: number) => {
      if (!active) return;
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (value - from) * eased;
      setDisplay(next);
      if (t < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
    };
  }, [value]);

  return <span className={className}>{formatValue(display, format, decimals)}</span>;
}
