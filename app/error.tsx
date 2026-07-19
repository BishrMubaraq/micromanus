"use client";

import { useEffect } from "react";
import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { APP_NAME, ROUTES } from "@/lib/constants";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <BrandMark size="lg" />
      <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {APP_NAME}
      </p>
      <h1 className="text-xl font-medium tracking-tight">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page failed to render. You can retry, or return home.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
        <Button asChild>
          <Link href={ROUTES.home}>Go home</Link>
        </Button>
      </div>
    </div>
  );
}
