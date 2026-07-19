import { BILLING_CREDITS_PER_PURCHASE } from "@/lib/billing";
import { APP_NAME } from "@/lib/constants";

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
  description: `${BILLING_CREDITS_PER_PURCHASE} credits for ${APP_NAME} deep research.`,
  credits: BILLING_CREDITS_PER_PURCHASE,
};
