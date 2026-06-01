"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        toast.error("Sign out failed", { description: "Please try again." });
        return;
      }
      window.location.assign("/login");
    } catch {
      toast.error("Sign out failed", { description: "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={() => void handleSignOut()} disabled={loading}>
      <LogOut className="mr-2 h-4 w-4" />
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
