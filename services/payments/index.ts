import type { Payment } from "@/types/database";

import { createLemonCheckout } from "./lemon-squeezy";

export type CreateCheckoutInput = {
  userId: string;
  email?: string | null;
  redirectUrl: string;
};

export type CreateCheckoutResult = {
  url: string;
  sessionId: string;
};

export interface PaymentService {
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
}

export class LemonSqueezyPaymentService implements PaymentService {
  async createCheckout(
    input: CreateCheckoutInput,
  ): Promise<CreateCheckoutResult> {
    const checkout = await createLemonCheckout(input);
    return {
      url: checkout.url,
      sessionId: checkout.checkoutId,
    };
  }
}

export function createPaymentService(): PaymentService {
  return new LemonSqueezyPaymentService();
}

export type { Payment };
