import type { Payment, PaymentStatus } from "@/types/database";

export type CheckoutPlanId = "starter" | "pro" | "scale";

export type CreateCheckoutSessionInput = {
  userId: string;
  planId: CheckoutPlanId;
  successUrl: string;
  cancelUrl: string;
};

export type CreateCheckoutSessionResult = {
  url: string;
  sessionId: string;
};

/**
 * Payment provider contract. Stripe Checkout will implement this.
 * Do not call from UI until Stripe keys and webhook are configured.
 */
export interface PaymentService {
  createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult>;
  getPaymentByProviderId(
    providerPaymentId: string,
  ): Promise<Payment | null>;
}

export class UnconfiguredPaymentService implements PaymentService {
  async createCheckoutSession(
    input: CreateCheckoutSessionInput,
  ): Promise<CreateCheckoutSessionResult> {
    void input;
    // TODO: Wire Stripe Checkout Session creation when STRIPE_SECRET_KEY is set.
    throw new Error(
      "PaymentService is not configured. Set Stripe credentials to enable checkout.",
    );
  }

  async getPaymentByProviderId(
    providerPaymentId: string,
  ): Promise<Payment | null> {
    void providerPaymentId;
    return null;
  }
}

export function createPaymentService(): PaymentService {
  return new UnconfiguredPaymentService();
}

export type PaymentRecordInput = {
  userId: string;
  providerPaymentId: string;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  creditsGranted: number;
};
