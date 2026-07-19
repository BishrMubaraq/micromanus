import { LEMON_ENV, BILLING_CREDITS_PER_PURCHASE } from "@/lib/billing";

const LEMON_API = "https://api.lemonsqueezy.com/v1";

export type LemonCheckoutResult = {
  url: string;
  checkoutId: string;
};

function lemonHeaders(apiKey: string) {
  return {
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
    Authorization: `Bearer ${apiKey}`,
  };
}

export async function createLemonCheckout(input: {
  userId: string;
  email?: string | null;
  redirectUrl: string;
}): Promise<LemonCheckoutResult> {
  const apiKey = LEMON_ENV.apiKey();
  const storeId = LEMON_ENV.storeId();
  const variantId = LEMON_ENV.variantId();

  if (!apiKey || !storeId || !variantId) {
    throw new Error(
      "Lemon Squeezy is not configured. Set LEMON_SQUEEZY_API_KEY, STORE_ID, and VARIANT_ID.",
    );
  }

  const response = await fetch(`${LEMON_API}/checkouts`, {
    method: "POST",
    headers: lemonHeaders(apiKey),
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: input.email ?? undefined,
            // Lemon requires custom values to be strings.
            custom: {
              user_id: String(input.userId),
            },
          },
          product_options: {
            redirect_url: input.redirectUrl,
            name: "MicroManus Research Credits",
            description: `${BILLING_CREDITS_PER_PURCHASE} research credits`,
          },
          checkout_options: {
            embed: false,
            media: false,
            logo: true,
            desc: true,
            discount: true,
            dark: true,
          },
        },
        relationships: {
          store: {
            data: { type: "stores", id: String(storeId) },
          },
          variant: {
            data: { type: "variants", id: String(variantId) },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Lemon Squeezy checkout failed: ${body}`);
  }

  const json = (await response.json()) as {
    data: {
      id: string;
      attributes: { url: string };
    };
  };

  return {
    url: json.data.attributes.url,
    checkoutId: json.data.id,
  };
}

export type LemonOrderSummary = {
  id: string;
  status: string;
  total: number;
  currency: string;
  userEmail: string | null;
  createdAt: string | null;
};

/** Recent paid orders for an email — used to reconcile when webhooks are delayed/missing. */
export async function listRecentLemonOrdersForEmail(
  email: string,
  limit = 10,
): Promise<LemonOrderSummary[]> {
  const apiKey = LEMON_ENV.apiKey();
  const storeId = LEMON_ENV.storeId();
  if (!apiKey || !storeId) {
    throw new Error("Lemon Squeezy is not configured");
  }

  const params = new URLSearchParams({
    "filter[user_email]": email,
    "filter[store_id]": String(storeId),
    "page[size]": String(limit),
    sort: "-created_at",
  });

  const response = await fetch(`${LEMON_API}/orders?${params}`, {
    method: "GET",
    headers: lemonHeaders(apiKey),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Lemon Squeezy orders lookup failed: ${body}`);
  }

  const json = (await response.json()) as {
    data?: Array<{
      id: string;
      attributes: {
        status: string;
        total: number;
        currency: string;
        user_email?: string | null;
        created_at?: string | null;
      };
    }>;
  };

  return (json.data ?? []).map((order) => ({
    id: order.id,
    status: order.attributes.status,
    total: order.attributes.total ?? 0,
    currency: (order.attributes.currency ?? "usd").toLowerCase(),
    userEmail: order.attributes.user_email ?? null,
    createdAt: order.attributes.created_at ?? null,
  }));
}

export type LemonOrderWebhook = {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string | number;
      credits?: string | number;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      status: string;
      total: number;
      currency: string;
      customer_id?: number;
      user_email?: string;
      first_order_item?: {
        variant_id?: number;
        product_name?: string;
      };
    };
  };
};
