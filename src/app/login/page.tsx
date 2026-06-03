"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Grape, LogIn, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/format-error";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        role?: string;
        tenant?: string;
      };

      if (!res.ok) {
        toast.error("Sign in failed", {
          description: apiErrorMessage(body.error, "Invalid username or password"),
        });
        return;
      }

      let role = body.role;
      if (!role) {
        const statusRes = await fetch("/api/auth/status", { credentials: "include" });
        const statusBody = (await statusRes.json().catch(() => ({}))) as { role?: string };
        role = statusBody.role;
      }

      if (role === "admin") {
        router.replace("/admin");
        router.refresh();
        return;
      }

      const from = searchParams.get("from");
      const dest =
        from && from.startsWith("/") && !from.startsWith("/login") ? from : "/dashboard";
      router.replace(dest);
      router.refresh();
    } catch {
      toast.error("Sign in failed", { description: "Could not reach the server." });
    } finally {
      setLoading(false);
    }
  };

  const startDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST", credentials: "include" });
      if (!res.ok) {
        toast.error("Could not start demo");
        return;
      }
      toast.message("Demo mode", {
        description: "Sample portfolio — changes are not saved.",
      });
      router.replace("/dashboard");
      router.refresh();
    } catch {
      toast.error("Could not start demo");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="landing-gradient flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/20 ring-1 ring-violet-500/30">
          <Grape className="h-8 w-8 text-violet-400" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Sign in with your username and password, or explore the demo
        </p>
      </div>

      <Card className="w-full max-w-md border-border/60 bg-card/90 shadow-2xl shadow-black/30 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your credentials to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                placeholder="Username"
                {...form.register("username")}
              />
              {form.formState.errors.username && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold"
              disabled={loading || demoLoading}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full font-medium"
            disabled={loading || demoLoading}
            onClick={() => void startDemo()}
          >
            <Play className="mr-2 h-4 w-4" />
            {demoLoading ? "Loading demo…" : "Demo"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/contact" className="text-violet-400 hover:text-violet-300">
              Forgot password or sign up?
            </Link>
          </p>
        </CardContent>
      </Card>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        <Link href="https://muscadine.io" className="hover:text-foreground">
          muscadine.io
        </Link>
      </p>
    </div>
  );
}
