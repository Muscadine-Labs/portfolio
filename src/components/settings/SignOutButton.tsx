"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
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
