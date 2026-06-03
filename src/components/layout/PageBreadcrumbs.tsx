"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

interface PageBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function PageBreadcrumbs({ items, className }: PageBreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? <ChevronRight className="h-3 w-3 shrink-0 opacity-50" /> : null}
            {item.href && !isLast ? (
              <Link href={item.href} className="hover:text-primary hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast && "font-medium text-foreground")}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
