import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

import type { ProviderId } from "@/features/providers/types";

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
      baseURL: normalizeAnthropicBaseUrl(endpoint),
    });
    return anthropic(model);
  }

  // OpenAI + Kimi (+ any OpenAI-compatible endpoint)
  const openai = createOpenAI({
    apiKey,
    baseURL: normalizeOpenAIBaseUrl(endpoint),
  });

  return openai(model);
}

function normalizeOpenAIBaseUrl(endpoint: string): string {
  const trimmed = endpoint.replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function normalizeAnthropicBaseUrl(endpoint: string): string {
  const trimmed = endpoint.replace(/\/+$/, "");
  // @ai-sdk/anthropic expects base without forcing /v1 inconsistently;
  // keep user endpoint if provided, else SDK default.
  return trimmed;
}
