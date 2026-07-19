"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Ticket } from "lucide-react";
import { toast } from "sonner";

import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  confirmCheckoutAction,
  redeemCouponAction,
  startCheckout,
  type CouponFormState,
} from "@/features/billing/actions";
import { CREDIT_PACK } from "@/features/pricing/plans";
import {
  BILLING_CREDITS_PER_COUPON,
  BILLING_CREDITS_PER_PURCHASE,
  LAUNCH_COUPON_CODE,
} from "@/lib/billing";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { fadeUp, usePrefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const couponInitial: CouponFormState = {
  error: null,
  success: false,
};

type PaymentHistoryItem = {
  id: string;
  amount_cents: number;
  currency: string;
  credits_granted: number;
  status: string;
  created_at: string;
  provider: string;
};

type PaymentsPageProps = {
  email: string | null;
  creditsBalance: number;
  lemonConfigured: boolean;
  checkoutSuccess?: boolean;
  from?: "settings" | null;
  payments: PaymentHistoryItem[];
  onSignOut: () => void;
};

export function PaymentsPage({
  email,
  creditsBalance,
  lemonConfigured,
  checkoutSuccess,
  from = null,
  payments,
  onSignOut,
}: PaymentsPageProps) {
  const showBackToSettings = from === "settings";
  const router = useRouter();
  const [checkoutPending, startCheckoutTransition] = useTransition();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [couponState, couponAction, couponPending] = useActionState(
    redeemCouponAction,
    couponInitial,
  );
  const [confirming, setConfirming] = useState(Boolean(checkoutSuccess));
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (couponState.success) {
      toast.success(`Coupon applied — +${BILLING_CREDITS_PER_COUPON} credits`);
    } else if (couponState.error) {
      toast.error(couponState.error);
    }
  }, [couponState.error, couponState.success]);

  useEffect(() => {
    if (!checkoutSuccess) return;

    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;

    async function reconcile() {
      const result = await confirmCheckoutAction();
      if (cancelled) return;

      if (result.ok && result.creditsAdded > 0) {
        toast.success(`+${result.creditsAdded} credits added`);
        router.refresh();
        router.replace(ROUTES.chat);
        return;
      }

      if (result.ok === false) {
        console.error(result.error);
      }

      router.refresh();
      attempts += 1;
      if (attempts >= 6) {
        setConfirming(false);
        toast.message(
          "Payment received. Refreshing credits — if the balance stays at 0, configure the Lemon test-mode webhook.",
        );
        return;
      }

      timer = window.setTimeout(() => {
        void reconcile();
      }, 2500);
    }

    void reconcile();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [checkoutSuccess, router]);

  useEffect(() => {
    if (creditsBalance > 0 && checkoutSuccess) {
      router.replace(ROUTES.chat);
    }
  }, [creditsBalance, checkoutSuccess, router]);

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_50%)]"
      />

      <header className="relative z-10 flex h-14 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          {showBackToSettings ? (
            <Button asChild type="button" variant="ghost" size="sm" className="-ml-2">
              <Link href={ROUTES.settings}>
                <ArrowLeft className="size-4" />
                Back
              </Link>
            </Button>
          ) : null}
          <div className="flex items-center gap-2.5">
            <BrandMark size="sm" />
            <p className="text-sm font-semibold tracking-tight">{APP_NAME}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {email}
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={onSignOut}>
            Sign out
          </Button>
        </div>
      </header>

      <main
        id="main-content"
        className="relative z-10 mx-auto flex max-w-lg flex-col px-6 py-16 md:py-24"
      >
        <motion.div {...fadeUp(reduced)} className="text-center">
          <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Billing
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Unlock research
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Redeem a coupon or purchase {CREDIT_PACK.name.toLowerCase()}. Each
            research request uses 1 credit.
          </p>
          {creditsBalance > 0 ? (
            <p className="mt-4 text-sm text-foreground">
              Current balance:{" "}
              <span className="font-medium">
                {creditsBalance.toLocaleString()} credits
              </span>
            </p>
          ) : null}
        </motion.div>

        {confirming ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 flex items-center justify-center gap-2 rounded-xl border border-border bg-card/40 px-4 py-3 text-sm text-muted-foreground"
          >
            <LoaderCircle className="size-4 animate-spin" />
            Confirming payment and applying credits…
          </motion.div>
        ) : null}

        <motion.section
          {...fadeUp(reduced, 0.08)}
          className="mt-10 rounded-2xl border border-border bg-card/40 p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-medium tracking-tight">
                {CREDIT_PACK.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {CREDIT_PACK.description} Checkout via Lemon Squeezy.
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tracking-tight">
                {BILLING_CREDITS_PER_PURCHASE}
              </p>
              <p className="text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
                credits
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
            {[
              "Deep research workspace access",
              "1 credit per research request",
              "Secure checkout by Lemon Squeezy",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="size-3.5 text-foreground" />
                {item}
              </li>
            ))}
          </ul>

          <Button
            className="mt-6 h-11 w-full"
            disabled={!lemonConfigured || checkoutPending}
            onClick={() => {
              setCheckoutError(null);
              startCheckoutTransition(async () => {
                const result = await startCheckout();
                if ("error" in result) {
                  setCheckoutError(result.error);
                  toast.error(result.error);
                  return;
                }
                toast.message("Redirecting to checkout…");
                window.location.assign(result.url);
              });
            }}
          >
            {checkoutPending ? "Redirecting…" : "Continue to checkout"}
            <ArrowRight className="size-4" />
          </Button>
          {!lemonConfigured ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Checkout is temporarily unavailable. Please try again later or
              redeem a coupon.
            </p>
          ) : null}
          {checkoutError ? (
            <p role="alert" className="mt-3 text-xs text-destructive">
              {checkoutError}
            </p>
          ) : null}
        </motion.section>

        <div className="my-8 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            or
          </span>
          <Separator className="flex-1" />
        </div>

        <motion.section
          {...fadeUp(reduced, 0.14)}
          className="rounded-2xl border border-border bg-card/40 p-6"
        >
          <div className="flex items-center gap-2">
            <Ticket className="size-4 text-muted-foreground" />
            <h2 className="text-base font-medium tracking-tight">Coupon</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Redeem once per account for {BILLING_CREDITS_PER_COUPON} credits.
          </p>

          <form action={couponAction} className="mt-5 space-y-3">
            <Input
              name="code"
              placeholder={LAUNCH_COUPON_CODE}
              autoComplete="off"
              className="h-11 border-border bg-background/50 font-mono uppercase tracking-wider"
            />
            <Button
              type="submit"
              variant="outline"
              className="h-11 w-full"
              disabled={couponPending}
            >
              {couponPending ? "Redeeming…" : "Redeem coupon"}
            </Button>
          </form>
          {couponState.error ? (
            <p className="mt-3 text-xs text-destructive">{couponState.error}</p>
          ) : null}
        </motion.section>

        {payments.length > 0 ? (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-10"
          >
            <h2 className="text-sm font-medium tracking-tight">
              Payment history
            </h2>
            <div className="mt-3 divide-y divide-border rounded-xl border border-border">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {payment.credits_granted} credits
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.created_at).toLocaleString()} ·{" "}
                      <span className={cn("capitalize")}>{payment.status}</span>
                    </p>
                  </div>
                  <p className="shrink-0 text-muted-foreground">
                    {(payment.amount_cents / 100).toLocaleString(undefined, {
                      style: "currency",
                      currency: payment.currency.toUpperCase(),
                    })}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>
        ) : null}
      </main>
    </div>
  );
}
