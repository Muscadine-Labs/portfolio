"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignOutButton } from "@/components/settings/SignOutButton";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { APP_HOST, APP_ORIGIN } from "@/lib/site";
import type { User } from "@/types";

interface AccountSettingsCardProps {
  authEnabled: boolean;
}

export function AccountSettingsCard({ authEnabled }: AccountSettingsCardProps) {
  const router = useRouter();
  const { account, updateAccount } = usePortfolio();
  const [draft, setDraft] = useState<User>(account);
  const [saving, setSaving] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const handleSave = async () => {
    const tenant = draft.tenant.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!tenant) {
      toast.error("Workspace ID required", {
        description: "Internal label for your data — not a DNS subdomain.",
      });
      return;
    }
    if (!draft.displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setSaving(true);
    try {
      const next: User = {
        ...draft,
        tenant,
        displayName: draft.displayName.trim(),
        email: draft.email.trim(),
        username: draft.username?.trim() ?? "",
        password: passwordTouched ? draft.password : account.password,
      };

      if (next.username) {
        const res = await fetch("/api/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: next.username,
            password: passwordTouched ? next.password : undefined,
          }),
        });
        if (!res.ok) {
          toast.error("Could not save sign-in credentials");
          return;
        }
      }

      const saved = { ...next, password: "" };
      updateAccount(saved);
      setDraft(saved);
      setPasswordTouched(false);
      toast.success("Account updated");
      router.refresh();
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>
          Profile and sign-in for this workspace. Changes apply for this session until the API is
          connected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            value={draft.displayName}
            onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={draft.email}
            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tenant">Workspace ID</Label>
          <Input
            id="tenant"
            value={draft.tenant}
            onChange={(e) => setDraft((d) => ({ ...d, tenant: e.target.value }))}
            placeholder="workspace"
          />
          <p className="text-xs text-muted-foreground">
            App URL for everyone:{" "}
            <span className="font-mono text-foreground/80">{APP_ORIGIN}</span>
            {APP_HOST !== "portfolio.muscadine.io" ? (
              <> (override via NEXT_PUBLIC_APP_HOST={APP_HOST})</>
            ) : null}
          </p>
        </div>
        <div className="space-y-2 border-t border-border/40 pt-4">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            autoComplete="username"
            value={draft.username ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, username: e.target.value }))}
            placeholder="Optional — enables sign-in when password is set"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={draft.password ?? ""}
            placeholder={authEnabled && !passwordTouched ? "••••••••" : "Set a password"}
            onChange={(e) => {
              setPasswordTouched(true);
              setDraft((d) => ({ ...d, password: e.target.value }));
            }}
          />
          <p className="text-xs text-muted-foreground">
            Leave blank when updating other fields to keep the current password. Set both username
            and password to require sign-in without .env variables.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Save account"}
          </Button>
          {authEnabled ? <SignOutButton /> : null}
        </div>
      </CardContent>
    </Card>
  );
}
