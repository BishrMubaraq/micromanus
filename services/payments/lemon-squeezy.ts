import { LEMON_ENV, BILLING_CREDITS_PER_PURCHASE } from "@/lib/billing";

const LEMON_API = "https://api.lemonsqueezy.com/v1";

export type LemonCheckoutResult = {
  url: string;
  checkoutId: string;
};

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
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: input.email ?? undefined,
            custom: {
              user_id: input.userId,
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

export type LemonOrderWebhook = {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
      credits?: string;
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
