import { BILLING_CREDITS_PER_PURCHASE } from "@/lib/billing";
import { createAdminClient } from "@/services/supabase/admin";
import { grantCreditsWithAdmin } from "@/services/credits";

export type FulfillOrderInput = {
  orderId: string;
  userId: string;
  amountCents: number;
  currency: string;
  credits?: number;
  metadata?: Record<string, unknown>;
};

export type FulfillOrderResult = {
  ok: true;
  duplicate: boolean;
  credits: number;
  paymentId: string;
  balance?: number;
};

/**
 * Idempotently grant credits for a Lemon order.
 * Prefers the atomic DB RPC; falls back if migration 00008 is not applied yet.
 */
export async function fulfillLemonOrder(
  input: FulfillOrderInput,
): Promise<FulfillOrderResult> {
  const credits = input.credits ?? BILLING_CREDITS_PER_PURCHASE;
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("fulfill_lemon_order", {
    p_order_id: input.orderId,
    p_user_id: input.userId,
    p_amount_cents: input.amountCents,
    p_currency: input.currency,
    p_credits: credits,
    p_metadata: (input.metadata ?? {}) as import("@/types/database").Json,
  });

  if (!error && data && typeof data === "object" && !Array.isArray(data)) {
    const row = data as {
      duplicate?: boolean;
      credits?: number;
      payment_id?: string;
      balance?: number;
    };
    return {
      ok: true,
      duplicate: Boolean(row.duplicate),
      credits: Number(row.credits ?? credits),
      paymentId: String(row.payment_id ?? ""),
      balance: row.balance,
    };
  }

  if (error && !isMissingRpcError(error.message)) {
    throw error;
  }

  // Fallback for environments that have not applied 00008 yet.
  return fulfillLemonOrderLegacy(admin, { ...input, credits });
}

function isMissingRpcError(message: string | undefined) {
  const lower = (message ?? "").toLowerCase();
  return (
    lower.includes("fulfill_lemon_order") ||
    lower.includes("could not find the function") ||
    lower.includes("does not exist")
  );
}

async function fulfillLemonOrderLegacy(
  admin: ReturnType<typeof createAdminClient>,
  input: FulfillOrderInput & { credits: number },
): Promise<FulfillOrderResult> {
  const { data: existing } = await admin
    .from("payments")
    .select("id, status")
    .eq("provider", "lemon_squeezy")
    .eq("provider_payment_id", input.orderId)
    .maybeSingle();

  if (existing?.status === "succeeded") {
    return {
      ok: true,
      duplicate: true,
      credits: input.credits,
      paymentId: existing.id,
    };
  }

  let paymentId = existing?.id;

  if (!paymentId) {
    const { data: payment, error: insertError } = await admin
      .from("payments")
      .insert({
        user_id: input.userId,
        provider: "lemon_squeezy",
        provider_payment_id: input.orderId,
        amount_cents: input.amountCents,
        currency: input.currency.toLowerCase(),
        status: "pending",
        credits_granted: 0,
        metadata: (input.metadata ?? {}) as import("@/types/database").Json,
      })
      .select("id")
      .single();

    if (insertError) {
      const { data: raced } = await admin
        .from("payments")
        .select("id, status")
        .eq("provider", "lemon_squeezy")
        .eq("provider_payment_id", input.orderId)
        .maybeSingle();

      if (raced?.status === "succeeded") {
        return {
          ok: true,
          duplicate: true,
          credits: input.credits,
          paymentId: raced.id,
        };
      }
      if (!raced) throw insertError;
      paymentId = raced.id;
    } else {
      paymentId = payment.id;
    }
  }

  // Claim row so concurrent webhook + reconcile don't double-grant.
  const { data: claimed, error: claimError } = await admin
    .from("payments")
    .update({ status: "pending" })
    .eq("id", paymentId)
    .neq("status", "succeeded")
    .select("id")
    .maybeSingle();

  if (claimError) throw claimError;
  if (!claimed) {
    return {
      ok: true,
      duplicate: true,
      credits: input.credits,
      paymentId,
    };
  }

  const balance = await grantCreditsWithAdmin(admin, {
    userId: input.userId,
    delta: input.credits,
    reason: "purchase",
    paymentId,
    metadata: {
      source: "lemon_squeezy",
      order_id: input.orderId,
      ...(input.metadata ?? {}),
    },
  });

  await admin
    .from("payments")
    .update({
      status: "succeeded",
      credits_granted: input.credits,
      amount_cents: input.amountCents,
      currency: input.currency.toLowerCase(),
    })
    .eq("id", paymentId);

  return {
    ok: true,
    duplicate: false,
    credits: input.credits,
    paymentId,
    balance,
  };
}
