import type { CheckoutPlanId } from "@/services/payments";

export type PricingPlan = {
  id: CheckoutPlanId;
  name: string;
  description: string;
  priceLabel: string;
  credits: number;
  highlighted?: boolean;
  features: string[];
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "For focused research sprints.",
    priceLabel: "$19",
    credits: 200,
    features: [
      "200 research credits",
      "Deep research workspace",
      "Export-ready reports",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For daily investigative work.",
    priceLabel: "$49",
    credits: 600,
    highlighted: true,
    features: [
      "600 research credits",
      "Priority model routing",
      "Usage analytics",
      "API key access",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    description: "For teams and heavy workloads.",
    priceLabel: "$129",
    credits: 2000,
    features: [
      "2,000 research credits",
      "Higher concurrency",
      "Advanced analytics",
      "Priority support",
    ],
  },
];

export function getPlanById(id: CheckoutPlanId): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === id);
}
