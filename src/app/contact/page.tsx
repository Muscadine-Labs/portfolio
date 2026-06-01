import Link from "next/link";
import { Grape, Mail } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CONTACT_EMAIL = "muscadinelabs@gmail.com";

export default function ContactPage() {
  return (
    <div className="landing-gradient flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/20 ring-1 ring-violet-500/30">
          <Grape className="h-8 w-8 text-violet-400" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
      </div>

      <Card className="w-full max-w-md border-border/60 bg-card/90 shadow-2xl shadow-black/30 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle>Account access</CardTitle>
          <CardDescription>
            Sign up, password reset, and private workspace setup are handled directly by Muscadine
            Labs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Contact us for a new account or if you forgot your password:
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 text-base font-medium text-violet-400 hover:text-violet-300"
          >
            <Mail className="h-4 w-4" />
            {CONTACT_EMAIL}
          </a>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
