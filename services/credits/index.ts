import { createClient } from "@/services/supabase/server";
import type { Credit, CreditReason, Json } from "@/types/database";

export async function getCreditsBalance(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.credits_balance ?? 0;
}

export async function listCreditLedger(
  userId: string,
  limit = 50,
): Promise<Credit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export type GrantCreditsInput = {
  userId: string;
  delta: number;
  reason: CreditReason;
  paymentId?: string | null;
  metadata?: Json;
};

/**
 * Grants or deducts credits via the security-definer RPC.
 * Requires a client with service_role (use createAdminClient).
 */
export async function grantCreditsWithAdmin(
  admin: Awaited<
    ReturnType<typeof import("@/services/supabase/admin").createAdminClient>
  >,
  input: GrantCreditsInput,
): Promise<number> {
  const { data, error } = await admin.rpc("grant_credits", {
    p_user_id: input.userId,
    p_delta: input.delta,
    p_reason: input.reason,
    p_payment_id: input.paymentId ?? null,
    p_metadata: input.metadata ?? {},
  });

  if (error) {
    throw error;
  }

  return data;
}
