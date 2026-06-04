"use client";

import { useEffect, useState } from "react";
import packageJson from "../../../package.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Same-origin proxy — direct api-portfolio URL fails browser CORS on GET /api/health. */
const API_HEALTH_URL = "/api/health";

type ApiHealth = {
  service?: string;
  version?: string;
  status?: string;
};

export function PortfolioVersionsCard() {
  const [apiVersion, setApiVersion] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(API_HEALTH_URL, {
          cache: "no-store",
          credentials: "same-origin",
        });
        const text = await res.text();
        if (!res.ok || !text.trim()) throw new Error("unreachable");
        const body = JSON.parse(text) as ApiHealth;
        if (cancelled) return;
        const ok =
          body.status === "ok" ||
          (body.service === "api-portfolio" && Boolean(body.version));
        setApiConnected(ok);
        setApiVersion(typeof body.version === "string" ? body.version : null);
      } catch {
        if (!cancelled) {
          setApiConnected(false);
          setApiVersion(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusDot = (ok: boolean | null) =>
    cn(
      "inline-block h-2.5 w-2.5 shrink-0 rounded-full",
      ok === null && "bg-muted-foreground/40 animate-pulse",
      ok === true && "bg-emerald-500",
      ok === false && "bg-red-500"
    );

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Versions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/15 px-3 py-2.5">
          <span className="text-muted-foreground">Portfolio app</span>
          <span className="font-mono font-medium tabular-nums">v{packageJson.version}</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/15 px-3 py-2.5">
          <a
            href="https://api-portfolio.muscadine.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary hover:underline"
          >
            api-portfolio
          </a>
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium",
                apiConnected === true &&
                  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                apiConnected === false && "bg-red-500/15 text-red-600 dark:text-red-400",
                apiConnected === null && "bg-muted text-muted-foreground"
              )}
            >
              {apiConnected === null
                ? "Checking…"
                : apiConnected
                  ? "Connected"
                  : "Offline"}
            </span>
            <span className={statusDot(apiConnected)} aria-hidden />
            <span className="font-mono font-medium tabular-nums">
              {apiVersion ? `v${apiVersion}` : "—"}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
