import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import type { ProviderId } from "@/features/providers/types";

/**
 * Build a language model for BYOK providers.
 * OpenAI + Kimi use Chat Completions via `.chat()` — not the Responses API.
 */
export function createLanguageModel(options: {
  provider: ProviderId;
  endpoint: string;
  apiKey: string;
  model: string;
}): LanguageModel {
  const { provider, endpoint, apiKey, model } = options;

  if (provider === "anthropic") {
    const anthropic = createAnthropic({
      apiKey,
      baseURL: normalizeTrailingSlash(endpoint),
    });
    return anthropic(model);
  }

  const openai = createOpenAI({
    apiKey,
    baseURL: normalizeOpenAIBaseUrl(endpoint),
  });

  return openai.chat(model);
}

function normalizeOpenAIBaseUrl(endpoint: string): string {
  const trimmed = normalizeTrailingSlash(endpoint);
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function normalizeTrailingSlash(endpoint: string): string {
  return endpoint.replace(/\/+$/, "");
}
