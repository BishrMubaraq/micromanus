import { createClient } from "@/services/supabase/server";
import type { UsageLog } from "@/types/database";

export type UsageSummary = {
  totalCreditsSpent: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  requestCount: number;
};

export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("usage_logs")
    .select("credits_spent, input_tokens, output_tokens")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  const rows = data ?? [];

  return {
    totalCreditsSpent: rows.reduce((sum, row) => sum + row.credits_spent, 0),
    totalInputTokens: rows.reduce((sum, row) => sum + row.input_tokens, 0),
    totalOutputTokens: rows.reduce((sum, row) => sum + row.output_tokens, 0),
    requestCount: rows.length,
  };
}

export async function listRecentUsage(
  userId: string,
  limit = 25,
): Promise<UsageLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("usage_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}
