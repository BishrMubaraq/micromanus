import { z } from "zod";

import { RESEARCH_CREDIT_COST } from "@/lib/billing";

export { RESEARCH_CREDIT_COST };
export const WELCOME_CREDITS = 100;

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
});

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  PROVIDER_ENCRYPTION_KEY: z
    .string()
    .regex(/^$|^[0-9a-fA-F]{64}$/, "Must be 64 hex characters")
    .optional(),
  SERPAPI_API_KEY: z.string().min(1).optional(),
  LEMON_SQUEEZY_API_KEY: z.string().min(1).optional(),
  LEMON_SQUEEZY_STORE_ID: z.string().min(1).optional(),
  LEMON_SQUEEZY_VARIANT_ID: z.string().min(1).optional(),
  LEMON_SQUEEZY_WEBHOOK_SECRET: z.string().min(1).optional(),
});

function readPublicEnv() {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

function readServerEnv() {
  return serverEnvSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    PROVIDER_ENCRYPTION_KEY: process.env.PROVIDER_ENCRYPTION_KEY,
    SERPAPI_API_KEY: process.env.SERPAPI_API_KEY,
    LEMON_SQUEEZY_API_KEY: process.env.LEMON_SQUEEZY_API_KEY,
    LEMON_SQUEEZY_STORE_ID: process.env.LEMON_SQUEEZY_STORE_ID,
    LEMON_SQUEEZY_VARIANT_ID: process.env.LEMON_SQUEEZY_VARIANT_ID,
    LEMON_SQUEEZY_WEBHOOK_SECRET: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET,
  });
}

/** Validated public env accessors. Throws on malformed values. */
export const env = {
  get appUrl() {
    return readPublicEnv().NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },
  get supabaseUrl() {
    return readPublicEnv().NEXT_PUBLIC_SUPABASE_URL;
  },
  get supabaseAnonKey() {
    const parsed = readPublicEnv();
    return (
      parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      parsed.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );
  },
  get serviceRoleKey() {
    return readServerEnv().SUPABASE_SERVICE_ROLE_KEY;
  },
  get providerEncryptionKey() {
    const key = readServerEnv().PROVIDER_ENCRYPTION_KEY;
    return key || undefined;
  },
  get serpApiKey() {
    return readServerEnv().SERPAPI_API_KEY;
  },
  get lemon() {
    const parsed = readServerEnv();
    return {
      apiKey: parsed.LEMON_SQUEEZY_API_KEY,
      storeId: parsed.LEMON_SQUEEZY_STORE_ID,
      variantId: parsed.LEMON_SQUEEZY_VARIANT_ID,
      webhookSecret: parsed.LEMON_SQUEEZY_WEBHOOK_SECRET,
    };
  },
};

export function requireEnv(name: keyof NodeJS.ProcessEnv): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

/** Soft check used by proxy when config is incomplete. */
export function hasRequiredPublicEnv(): boolean {
  try {
    return Boolean(env.supabaseUrl && env.supabaseAnonKey);
  } catch {
    return false;
  }
}
