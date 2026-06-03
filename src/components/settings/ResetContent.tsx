"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/format-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortfolio } from "@/components/providers/PortfolioProvider";
import type { CredentialSource } from "@/lib/account-credentials-store";

type ResetInfo = {
  username: string;
  tenant?: string;
  hasPassword: boolean;
  source: CredentialSource;
  canViewPassword: boolean;
  canEditUsername: boolean;
  password?: string;
};

export function ResetContent() {
  const router = useRouter();
  const { account, updateAccount } = usePortfolio();
  const [info, setInfo] = useState<ResetInfo | null>(null);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const applyInfo = (data: ResetInfo) => {
    setInfo(data);
    setUsername(data.username);
  };

  const loadInfo = async () => {
    const res = await fetch("/api/account/password", { credentials: "include" });
    if (!res.ok) throw new Error("Could not load sign-in settings");
    const data = (await res.json()) as ResetInfo;
    applyInfo(data);
    return data;
  };

  useEffect(() => {
    let active = true;

    fetch("/api/account/password", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load sign-in settings");
        return res.json() as Promise<ResetInfo>;
      })
      .then((data) => {
        if (active) applyInfo(data);
      })
      .catch(() => {
        if (active) toast.error("Could not load sign-in settings");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    if (!info) return;
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      toast.error("Username is required");
      return;
    }

    const usernameChanged = trimmedUsername !== info.username;
    const passwordChanging = newPassword.length > 0 || confirmPassword.length > 0;

    if (!usernameChanged && !passwordChanging) {
      toast.error("No changes to save");
      return;
    }

    const verifiedCurrentPassword = info.canViewPassword ? info.password ?? "" : currentPassword;

    if (info.hasPassword && !verifiedCurrentPassword) {
      toast.error("Enter your current password to save changes");
      return;
    }

    if (passwordChanging) {
      if (!newPassword) {
        toast.error("New password is required");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: trimmedUsername,
          currentPassword: info.hasPassword ? verifiedCurrentPassword : undefined,
          newPassword: passwordChanging ? newPassword : undefined,
          confirmPassword: passwordChanging ? confirmPassword : undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        username?: string;
        tenant?: string;
      };
      if (!res.ok) {
        toast.error(apiErrorMessage(data.error, "Could not save sign-in settings"));
        return;
      }

      const nextUsername = data.username ?? trimmedUsername;
      const nextTenant = data.tenant ?? nextUsername;
      updateAccount({
        ...account,
        username: nextUsername,
        tenant: nextTenant,
        password: "",
      });
      toast.success("Sign-in updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await loadInfo();
      router.refresh();
    } catch {
      toast.error("Could not save sign-in settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!info) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign-in settings are unavailable.{" "}
        <Link href="/settings" className="text-primary hover:underline">
          Back to settings
        </Link>
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to settings
        </Link>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Reset sign-in</CardTitle>
          <CardDescription>Update your username or password for this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {info.source === "env" ? (
            <p className="rounded-lg border border-border/50 bg-muted/15 px-3 py-2 text-sm text-muted-foreground">
              Sign-in is configured via server environment variables and cannot be changed here.
            </p>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                </div>

                {info.canViewPassword ? (
                  <div className="space-y-2">
                    <Label htmlFor="current-password-view">Current password</Label>
                    <div className="relative">
                      <Input
                        id="current-password-view"
                        type={showPassword ? "text" : "password"}
                        value={info.password ?? ""}
                        readOnly
                        className="bg-muted/20 pr-10 font-mono"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                        onClick={() => setShowPassword((open) => !open)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                ) : info.hasPassword ? (
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                    />
                  </div>
                ) : null}
              </div>

              <div className="space-y-4 border-t border-border/40 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">
                    {info.hasPassword ? "New password" : "Password"}
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">
                    {info.hasPassword ? "Confirm new password" : "Confirm password"}
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                </div>
                <Button type="button" disabled={saving} onClick={() => void handleSave()}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </>
          )}

          {info.source === "env" && info.username ? (
            <div className="space-y-2">
              <Label htmlFor="username-readonly">Username</Label>
              <Input id="username-readonly" value={info.username} readOnly className="bg-muted/20" />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
