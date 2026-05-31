"use client";

import { useSyncExternalStore } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEV_BANNER_STORAGE_KEY } from "@/lib/dev-banner";

const BANNER_CHANGE_EVENT = "portfolio-dev-banner-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(BANNER_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(BANNER_CHANGE_EVENT, onStoreChange);
  };
}

function getBannerVisible(): boolean {
  try {
    return sessionStorage.getItem(DEV_BANNER_STORAGE_KEY) !== "1";
  } catch {
    return true;
  }
}

export function DevelopmentBanner() {
  const visible = useSyncExternalStore(subscribe, getBannerVisible, () => false);

  const dismiss = () => {
    try {
      sessionStorage.setItem(DEV_BANNER_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(BANNER_CHANGE_EVENT));
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 md:px-8 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-medium text-amber-950 dark:text-amber-100">Still in development</p>
          <p className="mt-0.5 text-amber-900/85 dark:text-amber-200/80">
            Portfolio is early-stage: data may reset, features are incomplete, and the home API
            is not connected yet. Do not rely on this for production financial decisions.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-amber-800 hover:bg-amber-200/80 hover:text-amber-950 dark:text-amber-200/90 dark:hover:bg-amber-500/20 dark:hover:text-amber-50"
          onClick={dismiss}
          aria-label="Dismiss development notice"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
