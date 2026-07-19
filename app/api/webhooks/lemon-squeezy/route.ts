import crypto from "node:crypto";

import { BILLING_CREDITS_PER_PURCHASE, LEMON_ENV } from "@/lib/billing";
import { createAdminClient } from "@/services/supabase/admin";
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

  let payload: LemonOrderWebhook;
  try {
    payload = JSON.parse(rawBody) as LemonOrderWebhook;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (
    eventName !== "order_created" &&
    payload.meta?.event_name !== "order_created"
  ) {
    return Response.json({ ok: true, ignored: true });
  }

  const orderId = payload.data?.id;
  const userId = payload.meta?.custom_data?.user_id;
  const status = payload.data?.attributes?.status;
  const total = payload.data?.attributes?.total ?? 0;
  const currency = (payload.data?.attributes?.currency ?? "usd").toLowerCase();

  if (!orderId) {
    return new Response("Missing order id", { status: 400 });
  }

  if (!userId) {
    console.error("Lemon webhook missing custom_data.user_id", orderId);
    return new Response("Missing user_id", { status: 400 });
  }

  if (status === "refunded" || status === "failed") {
    return Response.json({ ok: true, skipped: status });
  }

  // Never trust client-supplied credit amounts from custom_data.
  const credits = BILLING_CREDITS_PER_PURCHASE;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("fulfill_lemon_order", {
    p_order_id: orderId,
    p_user_id: userId,
    p_amount_cents: total,
    p_currency: currency,
    p_credits: credits,
    p_metadata: {
      event: eventName || payload.meta.event_name,
      email: payload.data.attributes.user_email ?? null,
      product:
        payload.data.attributes.first_order_item?.product_name ?? null,
    },
  });

  if (error) {
    console.error("Lemon fulfill failed", error);
    return new Response("Fulfillment failed", { status: 500 });
  }

  return Response.json(data ?? { ok: true, credits });
}
