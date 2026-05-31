"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePortfolioAgreement } from "@/contexts/PortfolioAgreementContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PortfolioAgreementModal() {
  const {
    isAccepted,
    shouldShowModal,
    acceptAgreement,
    declineAgreement,
    openModal,
    closeModal,
  } = usePortfolioAgreement();

  useEffect(() => {
    if (!isAccepted) {
      openModal();
    }
  }, [isAccepted, openModal]);

  if (!shouldShowModal && isAccepted) return null;
  if (!shouldShowModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto border-border/60 bg-card shadow-2xl">
        <CardHeader>
          <CardTitle>Portfolio terms</CardTitle>
          <CardDescription>
            Please review and accept before using your portfolio dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            This tool is for personal finance tracking only. It is not investment,
            tax, or legal advice.
          </p>
          <p>
            You are responsible for the accuracy of data you enter. Do not share
            your login credentials.
          </p>
          <p>
            Read the full{" "}
            <Link href="/terms" className="text-primary underline-offset-4 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={declineAgreement}>
            Decline
          </Button>
          <Button
            onClick={() => {
              acceptAgreement();
              closeModal();
            }}
          >
            I agree
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
