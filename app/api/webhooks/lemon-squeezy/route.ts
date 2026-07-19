import crypto from "node:crypto";

import { LEMON_ENV } from "@/lib/billing";
import { fulfillLemonOrder } from "@/services/payments/fulfill-order";
import type { LemonOrderWebhook } from "@/services/payments/lemon-squeezy";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = LEMON_ENV.webhookSecret();
  if (!secret) {
    console.error("Lemon webhook: LEMON_SQUEEZY_WEBHOOK_SECRET missing");
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
    console.error("Lemon webhook: invalid signature");
    return new Response("Invalid signature", { status: 401 });
  }

  const eventName = request.headers.get("X-Event-Name") ?? "";

  let payload: LemonOrderWebhook;
  try {
    payload = JSON.parse(rawBody) as LemonOrderWebhook;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const resolvedEvent = eventName || payload.meta?.event_name || "";
  if (resolvedEvent !== "order_created") {
    return Response.json({ ok: true, ignored: true, event: resolvedEvent });
  }

  const orderId = payload.data?.id;
  const userIdRaw = payload.meta?.custom_data?.user_id;
  const userId = userIdRaw != null ? String(userIdRaw).trim() : "";
  const status = payload.data?.attributes?.status;
  const total = payload.data?.attributes?.total ?? 0;
  const currency = (payload.data?.attributes?.currency ?? "usd").toLowerCase();

  if (!orderId) {
    return new Response("Missing order id", { status: 400 });
  }

  if (!userId) {
    console.error("Lemon webhook missing custom_data.user_id", {
      orderId,
      custom_data: payload.meta?.custom_data,
    });
    return new Response("Missing user_id", { status: 400 });
  }

  if (status === "refunded" || status === "failed") {
    return Response.json({ ok: true, skipped: status });
  }

  try {
    const result = await fulfillLemonOrder({
      orderId,
      userId,
      amountCents: total,
      currency,
      metadata: {
        event: resolvedEvent,
        email: payload.data.attributes.user_email ?? null,
        product:
          payload.data.attributes.first_order_item?.product_name ?? null,
        source: "webhook",
      },
    });

    return Response.json(result);
  } catch (error) {
    console.error("Lemon fulfill failed", error);
    return new Response("Fulfillment failed", { status: 500 });
  }
}
