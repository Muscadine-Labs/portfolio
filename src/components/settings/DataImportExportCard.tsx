"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolio, buildPortfolioPayload } from "@/components/providers/PortfolioProvider";
import type { PortfolioDataPayload } from "@/lib/portfolio-data";
import { exportPortfolioToXlsx } from "@/lib/xlsx-portfolio";

function downloadPortfolioJson(data: PortfolioDataPayload, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DataImportExportCard() {
  const portfolio = usePortfolio();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportingJson, setExportingJson] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExportJson = async () => {
    setExportingJson(true);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildPortfolioPayload({
            sections: portfolio.sections,
            assets: portfolio.assets,
            cashAccounts: portfolio.cashAccounts,
            liabilities: portfolio.liabilities,
            planningItems: portfolio.planningItems,
            spendingItems: portfolio.spendingItems,
            allocationNodes: portfolio.allocationNodes,
            incomePlan: portfolio.incomePlan,
            walletMapNodes: portfolio.walletMapNodes,
            uiPreferences: portfolio.uiPreferences,
            connectedWallets: portfolio.connectedWallets,
            monthlyIncome: portfolio.monthlyIncome,
            netWorthHistory: portfolio.netWorthHistory,
          })
        ),
      });
      const payload = (await res.json()) as PortfolioDataPayload & { error?: string };
      if (!res.ok) {
        toast.error("Export failed", {
          description: payload.error ?? "The server could not validate portfolio data.",
        });
        return;
      }
      const date = new Date().toISOString().slice(0, 10);
      downloadPortfolioJson(payload, `portfolio-${date}.json`);
      toast.success("Exported", {
        description: "Portfolio JSON downloaded from the API.",
      });
    } catch {
      toast.error("Export failed", { description: "Could not reach the export API." });
    } finally {
      setExportingJson(false);
    }
  };

  const handleExportExcel = () => {
    setExportingExcel(true);
    try {
      exportPortfolioToXlsx(
        buildPortfolioPayload({
          sections: portfolio.sections,
          assets: portfolio.assets,
          cashAccounts: portfolio.cashAccounts,
          liabilities: portfolio.liabilities,
          planningItems: portfolio.planningItems,
          spendingItems: portfolio.spendingItems,
          allocationNodes: portfolio.allocationNodes,
          incomePlan: portfolio.incomePlan,
          walletMapNodes: portfolio.walletMapNodes,
          uiPreferences: portfolio.uiPreferences,
          connectedWallets: portfolio.connectedWallets,
          monthlyIncome: portfolio.monthlyIncome,
          netWorthHistory: portfolio.netWorthHistory,
        })
      );
      toast.success("Exported", {
        description:
          "Excel file downloaded with Overview, Assets, Cash, Liabilities, and Plan sheets.",
      });
    } catch {
      toast.error("Export failed", { description: "Could not generate the spreadsheet." });
    } finally {
      setExportingExcel(false);
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        toast.error("Import failed", { description: "File is not valid JSON." });
        return;
      }

      if (
        !window.confirm(
          `Import "${file.name}"? This will replace all portfolio data in the app.`
        )
      ) {
        return;
      }

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const result = (await res.json()) as PortfolioDataPayload & { error?: string };
      if (!res.ok) {
        toast.error("Import rejected", {
          description: result.error ?? "The file could not be applied.",
        });
        return;
      }

      portfolio.replacePortfolioData(result);
      const total =
        result.assets.length +
        result.cashAccounts.length +
        result.liabilities.length +
        result.planningItems.length +
        result.spendingItems.length;
      toast.success("Import complete", {
        description: `Loaded ${total} records from the API.`,
      });
    } catch {
      toast.error("Import failed", { description: "Could not reach the import API." });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle className="text-base">Import / export</CardTitle>
        <CardDescription>
          Excel: Overview, Assets, Cash, Liabilities, Plan. JSON uses the API with full
          validation.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button variant="default" disabled={exportingExcel} onClick={handleExportExcel}>
          <Download className="mr-2 h-4 w-4" />
          {exportingExcel ? "Exporting…" : "Export to Excel"}
        </Button>
        <Button
          variant="secondary"
          disabled={exportingJson}
          onClick={() => void handleExportJson()}
        >
          <Download className="mr-2 h-4 w-4" />
          {exportingJson ? "Exporting…" : "Export JSON"}
        </Button>
        <Button
          variant="outline"
          disabled={importing}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {importing ? "Importing…" : "Import JSON"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleImport(file);
          }}
        />
      </CardContent>
    </Card>
  );
}
