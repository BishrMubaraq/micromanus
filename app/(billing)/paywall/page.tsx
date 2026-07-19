import Link from "next/link";
import { redirect } from "next/navigation";

import { PaywallPlans } from "@/features/pricing/components/paywall-plans";
import { getSession } from "@/features/auth/get-session";
import { signOut } from "@/features/auth/actions";
import { grantTestCredits } from "@/features/auth/grant-test-credits";
import { Button } from "@/components/ui/button";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { WELCOME_CREDITS } from "@/lib/env";

export default async function PaywallPage() {
  const session = await getSession();
  if (!session) {
    redirect(ROUTES.home);
  }

  const credits = session.profile?.credits_balance ?? 0;
  if (credits > 0) {
    redirect(ROUTES.chat);
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <Link href={ROUTES.home} className="text-sm font-semibold tracking-tight">
          {APP_NAME}
        </Link>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="text-sm text-muted-foreground">
            Signed in as {session.user.email}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Unlock research credits
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
            MicroManus is credit-gated. Choose a plan to enter the deep research
            workspace.
          </p>
          <form action={grantTestCredits} className="mt-6">
            <Button type="submit" variant="outline">
              Continue with {WELCOME_CREDITS} test credits
            </Button>
          </form>
        </div>
        <PaywallPlans />
      </main>
    </div>
  );
}
