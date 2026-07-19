import { hasSupabaseConfig } from "@/services/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    ok: true as boolean,
    service: "micromanus",
    timestamp: new Date().toISOString(),
    supabaseConfigured: hasSupabaseConfig(),
    encryptionConfigured: Boolean(process.env.PROVIDER_ENCRYPTION_KEY),
    searchConfigured: Boolean(process.env.SERPAPI_API_KEY),
    billingConfigured: Boolean(
      process.env.LEMON_SQUEEZY_API_KEY &&
        process.env.LEMON_SQUEEZY_STORE_ID &&
        process.env.LEMON_SQUEEZY_VARIANT_ID &&
        process.env.LEMON_SQUEEZY_WEBHOOK_SECRET,
    ),
  };

  checks.ok = checks.supabaseConfigured && checks.encryptionConfigured;

  return Response.json(checks, {
    status: checks.ok ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
