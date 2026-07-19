import { decryptSecret, encryptSecret } from "@/lib/crypto/secrets";
import {
  getDefaultEndpoint,
  getDefaultModel,
  isKnownModel,
} from "@/features/providers/catalog";
import type {
  ProviderId,
  UserProviderConfig,
  UserProviderPublic,
} from "@/features/providers/types";
import { createAdminClient } from "@/services/supabase/admin";
import { createClient } from "@/services/supabase/server";
import type { Json, UserProvider } from "@/types/database";

export async function getUserProviderPublic(
  userId: string,
): Promise<UserProviderPublic | null> {
  const row = await getUserProviderRow(userId);
  if (!row) return null;

  return {
    provider: row.provider,
    endpoint: row.endpoint,
    defaultModel: row.default_model,
    apiKeyLastFour: row.api_key_last_four,
    hasApiKey: Boolean(row.api_key_ciphertext),
  };
}

export async function getUserProviderConfig(
  userId: string,
): Promise<UserProviderConfig | null> {
  const row = await getUserProviderRow(userId);
  if (!row) return null;

  const apiKey = decryptSecret({
    ciphertext: row.api_key_ciphertext,
    iv: row.api_key_iv,
    tag: row.api_key_tag,
  });

  return {
    provider: row.provider,
    endpoint: row.endpoint,
    apiKey,
    defaultModel: row.default_model,
  };
}

export async function upsertUserProvider(input: {
  userId: string;
  provider: ProviderId;
  endpoint: string;
  defaultModel: string;
  apiKey?: string;
}): Promise<UserProviderPublic> {
  const supabase = await createClient();
  const existing = await getUserProviderRow(input.userId);

  const endpoint = input.endpoint.trim() || getDefaultEndpoint(input.provider);
  const defaultModel = isKnownModel(input.provider, input.defaultModel)
    ? input.defaultModel
    : getDefaultModel(input.provider);

  const apiKey = input.apiKey?.trim();
  if (!apiKey && !existing) {
    throw new Error("API key is required");
  }

  let ciphertext = existing?.api_key_ciphertext ?? "";
  let iv = existing?.api_key_iv ?? "";
  let tag = existing?.api_key_tag ?? "";
  let lastFour = existing?.api_key_last_four ?? "";

  if (apiKey) {
    const encrypted = encryptSecret(apiKey);
    ciphertext = encrypted.ciphertext;
    iv = encrypted.iv;
    tag = encrypted.tag;
    lastFour = apiKey.slice(-4);
  }

  const payload = {
    user_id: input.userId,
    provider: input.provider,
    endpoint,
    default_model: defaultModel,
    api_key_ciphertext: ciphertext,
    api_key_iv: iv,
    api_key_tag: tag,
    api_key_last_four: lastFour,
    is_active: true,
  };

  const { data, error } = await supabase
    .from("user_providers")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw error;

  return {
    provider: data.provider,
    endpoint: data.endpoint,
    defaultModel: data.default_model,
    apiKeyLastFour: data.api_key_last_four,
    hasApiKey: true,
  };
}

async function getUserProviderRow(userId: string): Promise<UserProvider | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_providers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function persistUsageLog(input: {
  userId: string;
  chatId: string;
  provider: ProviderId;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  totalTokens: number;
  creditsSpent: number;
  metadata?: Json;
}) {
  const admin = createAdminClient();

  const { error } = await admin.from("usage_logs").insert({
    user_id: input.userId,
    chat_id: input.chatId,
    model: input.model,
    provider: input.provider,
    input_tokens: input.inputTokens,
    output_tokens: input.outputTokens,
    cache_tokens: input.cacheTokens,
    total_tokens: input.totalTokens,
    credits_spent: input.creditsSpent,
    metadata: input.metadata ?? {},
  });

  if (error) {
    if (
      error.message?.includes("cache_tokens") ||
      error.message?.includes("provider") ||
      error.message?.includes("total_tokens")
    ) {
      const { error: fallbackError } = await admin.from("usage_logs").insert({
        user_id: input.userId,
        chat_id: input.chatId,
        model: input.model,
        input_tokens: input.inputTokens,
        output_tokens: input.outputTokens,
        credits_spent: input.creditsSpent,
        metadata: {
          ...(typeof input.metadata === "object" &&
          input.metadata &&
          !Array.isArray(input.metadata)
            ? input.metadata
            : {}),
          provider: input.provider,
          cache_tokens: input.cacheTokens,
          total_tokens: input.totalTokens,
        },
      });
      if (fallbackError) throw fallbackError;
      return;
    }
    throw error;
  }
}
