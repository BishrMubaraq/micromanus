"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getSession } from "@/features/auth/get-session";
import { getAppUrl } from "@/lib/app-url";
import { ROUTES } from "@/lib/constants";
import { isLemonConfigured } from "@/lib/billing";
import { createPaymentService } from "@/services/payments";
import { fulfillLemonOrder } from "@/services/payments/fulfill-order";
import { listRecentLemonOrdersForEmail } from "@/services/payments/lemon-squeezy";
import { createClient } from "@/services/supabase/server";

export type CouponFormState = {
  error: string | null;
  success: boolean;
};

export type CheckoutActionResult =
  | { url: string }
  | { error: string };

export type ConfirmCheckoutResult =
  | { ok: true; creditsAdded: number; balance?: number }
  | { ok: false; error: string };

export async function startCheckout(): Promise<CheckoutActionResult> {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  if (!isLemonConfigured()) {
    return { error: "Lemon Squeezy is not configured" };
  }

  const origin = getAppUrl();

  try {
    const payments = createPaymentService();
    const checkout = await payments.createCheckout({
      userId: session.user.id,
      email: session.user.email,
      redirectUrl: `${origin}${ROUTES.paywall}?checkout=success`,
    });
    return { url: checkout.url };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to start checkout",
    };
  }
}

/**
 * After Lemon redirects back with ?checkout=success, reconcile recent paid
 * orders for this user. Covers missing/misconfigured webhooks (common in test mode).
 */
export async function confirmCheckoutAction(): Promise<ConfirmCheckoutResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Unauthorized" };
  }

  if (!isLemonConfigured()) {
    return { ok: false, error: "Billing is not configured" };
  }

  const email = session.user.email;
  if (!email) {
    return { ok: false, error: "Account email is required to confirm payment" };
  }

  try {
    const orders = await listRecentLemonOrdersForEmail(email, 8);
    const paid = orders.filter(
      (order) => order.status === "paid" || order.status === "pending",
    );

    let creditsAdded = 0;
    let balance: number | undefined;

    for (const order of paid) {
      const result = await fulfillLemonOrder({
        orderId: order.id,
        userId: session.user.id,
        amountCents: order.total,
        currency: order.currency,
        metadata: {
          source: "checkout_reconcile",
          email,
        },
      });
      if (!result.duplicate) {
        creditsAdded += result.credits;
      }
      if (typeof result.balance === "number") {
        balance = result.balance;
      }
    }

    revalidatePath(ROUTES.paywall);
    revalidatePath(ROUTES.chat);
    revalidatePath(ROUTES.settings);

    return { ok: true, creditsAdded, balance };
  } catch (error) {
    console.error("Checkout confirm failed", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to confirm payment yet",
    };
  }
}

export async function redeemCouponAction(
  _prev: CouponFormState,
  formData: FormData,
): Promise<CouponFormState> {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized", success: false };
  }

  const code = String(formData.get("code") ?? "").trim();
  if (!code) {
    return { error: "Enter a coupon code", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("redeem_coupon", {
    p_user_id: session.user.id,
    p_code: code,
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already_redeemed")) {
      return {
        error: "This coupon has already been redeemed on your account.",
        success: false,
      };
    }
    if (message.includes("invalid_coupon")) {
      return { error: "Invalid or inactive coupon code.", success: false };
    }
    if (message.includes("forbidden")) {
      return { error: "Unauthorized", success: false };
    }
    return { error: error.message, success: false };
  }

  revalidatePath(ROUTES.paywall);
  revalidatePath(ROUTES.chat);
  revalidatePath(ROUTES.settings);
  redirect(ROUTES.chat);
}
