import crypto from "node:crypto";

import { BILLING_CREDITS_PER_PURCHASE, LEMON_ENV } from "@/lib/billing";
import { createAdminClient } from "@/services/supabase/admin";
import { grantCreditsWithAdmin } from "@/services/credits";
import type { LemonOrderWebhook } from "@/services/payments/lemon-squeezy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = LEMON_ENV.webhookSecret();
  if (!secret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("X-Signature") ?? "";

  if (!signatureHeader || !rawBody) {
    return new Response("Invalid request", { status: 400 });
  }

  const digest = Buffer.from(
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex"),
    "utf8",
  );
  const signature = Buffer.from(signatureHeader, "utf8");

  if (
    digest.length !== signature.length ||
    !crypto.timingSafeEqual(digest, signature)
  ) {
    return new Response("Invalid signature", { status: 401 });
  }

  const eventName = request.headers.get("X-Event-Name") ?? "";
  const payload = JSON.parse(rawBody) as LemonOrderWebhook;

  if (eventName !== "order_created" && payload.meta.event_name !== "order_created") {
    return Response.json({ ok: true, ignored: true });
  }

  const orderId = payload.data.id;
  const userId = payload.meta.custom_data?.user_id;
  const status = payload.data.attributes.status;
  const total = payload.data.attributes.total ?? 0;
  const currency = (payload.data.attributes.currency ?? "usd").toLowerCase();

  if (!userId) {
    console.error("Lemon webhook missing custom_data.user_id", orderId);
    return new Response("Missing user_id", { status: 400 });
  }

  if (status === "refunded" || status === "failed") {
    return Response.json({ ok: true, skipped: status });
  }

  const credits =
    Number(payload.meta.custom_data?.credits) || BILLING_CREDITS_PER_PURCHASE;

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("payments")
    .select("id, status")
    .eq("provider", "lemon_squeezy")
    .eq("provider_payment_id", orderId)
    .maybeSingle();

  if (existing?.status === "succeeded") {
    return Response.json({ ok: true, duplicate: true });
  }

  let paymentId = existing?.id;

  if (!paymentId) {
    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .insert({
        user_id: userId,
        provider: "lemon_squeezy",
        provider_payment_id: orderId,
        amount_cents: total,
        currency,
        status: "pending",
        credits_granted: 0,
        metadata: {
          event: eventName || payload.meta.event_name,
          email: payload.data.attributes.user_email ?? null,
          product:
            payload.data.attributes.first_order_item?.product_name ?? null,
        },
      })
      .select("id")
      .single();

    if (paymentError) {
      // Race: another webhook inserted first
      const { data: raced } = await admin
        .from("payments")
        .select("id, status")
        .eq("provider", "lemon_squeezy")
        .eq("provider_payment_id", orderId)
        .maybeSingle();

      if (raced?.status === "succeeded") {
        return Response.json({ ok: true, duplicate: true });
      }
      if (!raced) {
        console.error("Payment insert failed", paymentError);
        return new Response("Payment insert failed", { status: 500 });
      }
      paymentId = raced.id;
    } else {
      paymentId = payment.id;
    }
  }

  await grantCreditsWithAdmin(admin, {
    userId,
    delta: credits,
    reason: "purchase",
    paymentId,
    metadata: {
      source: "lemon_squeezy",
      order_id: orderId,
    },
  });

  await admin
    .from("payments")
    .update({
      status: "succeeded",
      credits_granted: credits,
      amount_cents: total,
      currency,
    })
    .eq("id", paymentId);

  return Response.json({ ok: true, credits });
}
