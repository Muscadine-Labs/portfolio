"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordReveal } from "@/components/shared/PasswordReveal";
import { SignOutButton } from "@/components/settings/SignOutButton";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import { apiErrorMessage } from "@/lib/format-error";
import type { User } from "@/types";

type AccountCredentialInfo = {
  username: string;
  hasPassword: boolean;
  canViewPassword: boolean;
  password?: string;
};

interface AccountSettingsCardProps {
  /** When false, hide credential reset (demo / no home API). */
  authEnabled: boolean;
}

export function AccountSettingsCard({ authEnabled }: AccountSettingsCardProps) {
  const router = useRouter();
  const { account, updateAccount } = usePortfolio();
  const [draft, setDraft] = useState<User>(account);
  const [credentialInfo, setCredentialInfo] = useState<AccountCredentialInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const displayedUsername =
    credentialInfo?.username ?? account.username?.trim() ?? account.tenant;

  useEffect(() => {
    if (!authEnabled) return;

    let active = true;

    fetch("/api/account/password", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AccountCredentialInfo | null) => {
        if (active && data) setCredentialInfo(data);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [authEnabled]);

  const handleSave = async () => {
    if (!draft.displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setSaving(true);
    try {
      if (authEnabled) {
        const res = await fetch("/api/me", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: draft.displayName.trim(),
            email: draft.email.trim(),
          }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          user?: User;
        };
        if (!res.ok) {
          toast.error(apiErrorMessage(body.error, "Save failed"));
          return;
        }
        const next: User = {
          ...account,
          displayName: body.user?.displayName ?? draft.displayName.trim(),
          email: body.user?.email ?? draft.email.trim(),
          password: "",
        };
        updateAccount(next);
        setDraft(next);
      } else {
        const next: User = {
          ...account,
          displayName: draft.displayName.trim(),
          email: draft.email.trim(),
          password: "",
        };
        updateAccount(next);
        setDraft(next);
      }
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
        </div>
        {authEnabled ? (
          <div className="space-y-2">
            <Label htmlFor="account-password">Password</Label>
            {credentialInfo?.canViewPassword && credentialInfo.password ? (
              <PasswordReveal
                password={credentialInfo.password}
                ariaLabel="account password"
                inputClassName="h-9"
              />
            ) : credentialInfo?.hasPassword ? (
              <p className="text-sm text-muted-foreground">
                Password is set. Change it on the{" "}
                <Link href="/reset" className="text-primary hover:underline">
                  reset page
                </Link>
                .
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No password on file yet. Set one on the{" "}
                <Link href="/reset" className="text-primary hover:underline">
                  reset page
                </Link>
                .
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Change username or password on the{" "}
              <Link href="/reset" className="text-primary hover:underline">
                reset page
              </Link>
              .
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Demo mode — sign out to return to the login screen.
          </p>
        )}

        <div className="border-t border-border/40 pt-4">
          {authEnabled ? (
            <Link href="/reset" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Reset sign-in
            </Link>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Save account"}
          </Button>
          <SignOutButton />
        </div>
      </CardContent>
    </Card>
  );
}
