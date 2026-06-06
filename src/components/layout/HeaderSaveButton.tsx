"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { isDemoTenant } from "@/lib/demo-constants";

export function HeaderSaveButton() {
  const { savePortfolio, account } = usePortfolio();
  const [saving, setSaving] = useState(false);

  if (isDemoTenant(account.tenant)) return null;

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await savePortfolio();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-8 gap-1 px-2.5 text-xs"
      onClick={() => void onSave()}
      disabled={saving}
      aria-label="Save portfolio"
    >
      <Save className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{saving ? "Saving…" : "Save"}</span>
    </Button>
  );
}
