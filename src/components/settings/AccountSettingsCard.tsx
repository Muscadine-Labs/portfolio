"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignOutButton } from "@/components/settings/SignOutButton";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { User } from "@/types";

interface AccountSettingsCardProps {
  authEnabled: boolean;
}

export function AccountSettingsCard({ authEnabled }: AccountSettingsCardProps) {
  const router = useRouter();
  const { account, updateAccount } = usePortfolio();
  const [draft, setDraft] = useState<User>(account);
  const [signInUsername, setSignInUsername] = useState(account.username?.trim() ?? "");
  const [saving, setSaving] = useState(false);
  const displayedUsername = account.username?.trim() || signInUsername;

  useEffect(() => {
    let active = true;

    fetch("/api/account/password", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { username?: string } | null) => {
        if (active && data?.username) setSignInUsername(data.username);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    if (!draft.displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setSaving(true);
    try {
      const next: User = {
        ...account,
        displayName: draft.displayName.trim(),
        email: draft.email.trim(),
        password: "",
      };

      updateAccount(next);
      setDraft(next);
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
        <CardDescription>Your profile for this workspace.</CardDescription>
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
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={displayedUsername}
            readOnly
            className="bg-muted/20"
          />
          <p className="text-xs text-muted-foreground">
            Change username or password on the{" "}
            <Link href="/reset" className="text-primary hover:underline">
              reset page
            </Link>
            .
          </p>
        </div>

        <div className="border-t border-border/40 pt-4">
          <Link href="/reset" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Reset sign-in
          </Link>
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
