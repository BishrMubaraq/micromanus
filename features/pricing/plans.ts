import {
  BILLING_CREDITS_PER_PURCHASE,
} from "@/lib/billing";

export type PricingPlan = {
  id: "credits";
  name: string;
  description: string;
  credits: number;
};

/** Single credit pack used by Lemon Squeezy checkout. */
export const CREDIT_PACK: PricingPlan = {
  id: "credits",
  name: "Research credits",
  description: "Credits for deep research requests.",
  credits: BILLING_CREDITS_PER_PURCHASE,
};
