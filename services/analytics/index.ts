import {
  calculateTokenCost,
  resolveProviderId,
} from "@/features/analytics/pricing";
import { createClient } from "@/services/supabase/server";

export type AnalyticsUsageRow = {
  id: string;
  chatId: string | null;
  chatTitle: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  creditsUsed: number;
  estimatedCostUsd: number;
  durationMs: number | null;
  createdAt: string;
};

export type AnalyticsDashboard = {
  creditsRemaining: number;
  todayCostUsd: number;
  totalCostUsd: number;
  totalChats: number;
  rows: AnalyticsUsageRow[];
};

type UsageLogQueryRow = {
  id: string;
  chat_id: string | null;
  model: string;
  provider: string | null;
  input_tokens: number;
  output_tokens: number;
  cache_tokens: number | null;
  credits_spent: number;
  cost_cents: number | null;
  duration_ms: number | null;
  created_at: string;
  chats: { title: string } | { title: string }[] | null;
};

function startOfUtcDay(date = new Date()): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function chatTitleFromJoin(
  chats: UsageLogQueryRow["chats"],
): string {
  if (!chats) return "Untitled research";
  if (Array.isArray(chats)) return chats[0]?.title ?? "Untitled research";
  return chats.title || "Untitled research";
}

function toUsageRow(row: UsageLogQueryRow): AnalyticsUsageRow {
  const provider = resolveProviderId(row.provider);
  const inputTokens = row.input_tokens ?? 0;
  const outputTokens = row.output_tokens ?? 0;
  const cacheTokens = row.cache_tokens ?? 0;

  const computed = calculateTokenCost({
    provider,
    model: row.model,
    inputTokens,
    outputTokens,
    cacheTokens,
  });

  const estimatedCostUsd =
    row.cost_cents != null ? row.cost_cents / 100 : computed.totalCostUsd;

  return {
    id: row.id,
    chatId: row.chat_id,
    chatTitle: chatTitleFromJoin(row.chats),
    provider,
    model: row.model,
    inputTokens,
    outputTokens,
    cacheTokens,
    creditsUsed: row.credits_spent ?? 0,
    estimatedCostUsd,
    durationMs: row.duration_ms ?? null,
    createdAt: row.created_at,
  };
}

export async function getAnalyticsDashboard(
  userId: string,
): Promise<AnalyticsDashboard> {
  const supabase = await createClient();

  const [profileResult, chatsResult, usageResult, costResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("credits_balance")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("chats")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("usage_logs")
        .select(
          `
          id,
          chat_id,
          model,
          provider,
          input_tokens,
          output_tokens,
          cache_tokens,
          credits_spent,
          cost_cents,
          duration_ms,
          created_at,
          chats ( title )
        `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("usage_logs")
        .select(
          "model, provider, input_tokens, output_tokens, cache_tokens, cost_cents, created_at",
        )
        .eq("user_id", userId),
    ]);

  if (profileResult.error) throw profileResult.error;
  if (chatsResult.error) throw chatsResult.error;

  let usageRows: UsageLogQueryRow[] = [];

  if (usageResult.error) {
    // Graceful fallback when join / newer columns are unavailable.
    const legacy = await supabase
      .from("usage_logs")
      .select(
        "id, chat_id, model, provider, input_tokens, output_tokens, cache_tokens, credits_spent, cost_cents, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (legacy.error) {
      const minimal = await supabase
        .from("usage_logs")
        .select(
          "id, chat_id, model, input_tokens, output_tokens, credits_spent, cost_cents, created_at",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (minimal.error) throw minimal.error;

      usageRows = (minimal.data ?? []).map((row) => ({
        ...row,
        provider: null,
        cache_tokens: 0,
        duration_ms: null,
        chats: null,
      }));
    } else {
      usageRows = (legacy.data ?? []).map((row) => ({
        ...row,
        duration_ms: null,
        chats: null,
      }));
    }
  } else {
    usageRows = (usageResult.data ?? []) as UsageLogQueryRow[];
  }

  const rows = usageRows.map(toUsageRow);
  const dayStart = startOfUtcDay();

  const costRows =
    costResult.error || !costResult.data
      ? rows
      : costResult.data.map((row) =>
          toUsageRow({
            id: "",
            chat_id: null,
            model: row.model,
            provider: row.provider,
            input_tokens: row.input_tokens,
            output_tokens: row.output_tokens,
            cache_tokens: row.cache_tokens,
            credits_spent: 0,
            cost_cents: row.cost_cents,
            duration_ms: null,
            created_at: row.created_at,
            chats: null,
          }),
        );

  const totalCostUsd = costRows.reduce(
    (sum, row) => sum + row.estimatedCostUsd,
    0,
  );
  const todayCostUsd = costRows
    .filter((row) => row.createdAt >= dayStart)
    .reduce((sum, row) => sum + row.estimatedCostUsd, 0);

  return {
    creditsRemaining: profileResult.data?.credits_balance ?? 0,
    todayCostUsd,
    totalCostUsd,
    totalChats: chatsResult.count ?? 0,
    rows,
  };
}
