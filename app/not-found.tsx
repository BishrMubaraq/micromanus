import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { APP_NAME, ROUTES } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_50%)]"
      />
      <BrandMark size="lg" className="relative mb-6" />
      <p className="relative text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {APP_NAME}
      </p>
      <h1 className="relative mt-3 text-2xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="relative mt-2 max-w-md text-sm text-muted-foreground">
        That route doesn’t exist. Head back to research or the home page.
      </p>
      <div className="relative mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link href={ROUTES.chat}>Open research</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={ROUTES.home}>Go home</Link>
        </Button>
      </div>
    </div>
  );
}
