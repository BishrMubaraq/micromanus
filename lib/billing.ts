export const BILLING_CREDITS_PER_PURCHASE = 5;
export const BILLING_CREDITS_PER_COUPON = 5;
export const LAUNCH_COUPON_CODE = "SID_DRDROID";
export const RESEARCH_CREDIT_COST = 1;

export const LEMON_ENV = {
  apiKey: () => process.env.LEMON_SQUEEZY_API_KEY,
  storeId: () => process.env.LEMON_SQUEEZY_STORE_ID,
  variantId: () => process.env.LEMON_SQUEEZY_VARIANT_ID,
  webhookSecret: () => process.env.LEMON_SQUEEZY_WEBHOOK_SECRET,
};

export function isLemonConfigured(): boolean {
  return Boolean(
    LEMON_ENV.apiKey() && LEMON_ENV.storeId() && LEMON_ENV.variantId(),
  );
}
