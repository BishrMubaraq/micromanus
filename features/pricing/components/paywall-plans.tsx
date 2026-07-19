"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PRICING_PLANS } from "@/features/pricing/plans";
import type { CheckoutPlanId } from "@/services/payments";
import { cn } from "@/lib/utils";

type PaywallPlansProps = {
  onCheckout?: (planId: CheckoutPlanId) => Promise<void>;
};

export function PaywallPlans({ onCheckout }: PaywallPlansProps) {
  const [pendingPlan, setPendingPlan] = useState<CheckoutPlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSelect(planId: CheckoutPlanId) {
    setError(null);
    setPendingPlan(planId);
    startTransition(async () => {
      try {
        if (onCheckout) {
          await onCheckout(planId);
          return;
        }
        // TODO: Call Stripe Checkout session creation once PaymentService is configured.
        setError(
          "Checkout is not configured yet. Add Stripe credentials to enable purchases.",
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to start checkout.",
        );
      } finally {
        setPendingPlan(null);
      }
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-3">
        {PRICING_PLANS.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
          >
            <Card
              className={cn(
                "h-full border-border bg-card/60 shadow-none",
                plan.highlighted && "border-foreground/25",
              )}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-medium">
                    {plan.name}
                  </CardTitle>
                  {plan.highlighted ? (
                    <Badge variant="secondary">Popular</Badge>
                  ) : null}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl font-semibold tracking-tight">
                    {plan.priceLabel}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {plan.credits.toLocaleString()} credits
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="mt-0.5 size-3.5 shrink-0 text-foreground" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  disabled={pending}
                  onClick={() => handleSelect(plan.id)}
                >
                  {pending && pendingPlan === plan.id
                    ? "Starting…"
                    : "Get credits"}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
      {error ? (
        <p className="text-center text-sm text-muted-foreground">{error}</p>
      ) : null}
    </div>
  );
}
