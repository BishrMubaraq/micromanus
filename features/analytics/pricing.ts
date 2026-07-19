import type { ProviderId } from "@/features/providers/types";

/**
 * Prices are USD per 1M tokens.
 * Cache pricing uses provider cache-read rates where published.
 */
export type ModelTokenPricing = {
  inputPerMillion: number;
  outputPerMillion: number;
  cachePerMillion: number;
};

export type CostBreakdown = {
  inputCostUsd: number;
  outputCostUsd: number;
  cacheCostUsd: number;
  totalCostUsd: number;
};

const OPENAI_PRICING: Record<string, ModelTokenPricing> = {
  "gpt-4.1": { inputPerMillion: 2.0, outputPerMillion: 8.0, cachePerMillion: 0.5 },
  "gpt-4.1-mini": {
    inputPerMillion: 0.4,
    outputPerMillion: 1.6,
    cachePerMillion: 0.1,
  },
  "gpt-4.1-nano": {
    inputPerMillion: 0.1,
    outputPerMillion: 0.4,
    cachePerMillion: 0.025,
  },
  "gpt-4o": { inputPerMillion: 2.5, outputPerMillion: 10.0, cachePerMillion: 1.25 },
  "gpt-4o-mini": {
    inputPerMillion: 0.15,
    outputPerMillion: 0.6,
    cachePerMillion: 0.075,
  },
  o3: { inputPerMillion: 10.0, outputPerMillion: 40.0, cachePerMillion: 2.5 },
  "o4-mini": {
    inputPerMillion: 1.1,
    outputPerMillion: 4.4,
    cachePerMillion: 0.275,
  },
};

const ANTHROPIC_PRICING: Record<string, ModelTokenPricing> = {
  "claude-opus-4-5": {
    inputPerMillion: 15.0,
    outputPerMillion: 75.0,
    cachePerMillion: 1.5,
  },
  "claude-sonnet-4-5": {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
    cachePerMillion: 0.3,
  },
  "claude-haiku-4-5": {
    inputPerMillion: 1.0,
    outputPerMillion: 5.0,
    cachePerMillion: 0.1,
  },
  "claude-opus-4-1": {
    inputPerMillion: 15.0,
    outputPerMillion: 75.0,
    cachePerMillion: 1.5,
  },
  "claude-sonnet-4-0": {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
    cachePerMillion: 0.3,
  },
};

const KIMI_PRICING: Record<string, ModelTokenPricing> = {
  "kimi-k2-turbo-preview": {
    inputPerMillion: 0.15,
    outputPerMillion: 2.5,
    cachePerMillion: 0.05,
  },
  "kimi-k2-0711-preview": {
    inputPerMillion: 0.6,
    outputPerMillion: 2.5,
    cachePerMillion: 0.15,
  },
  "moonshot-v1-128k": {
    inputPerMillion: 2.0,
    outputPerMillion: 5.0,
    cachePerMillion: 0.5,
  },
  "moonshot-v1-32k": {
    inputPerMillion: 1.0,
    outputPerMillion: 3.0,
    cachePerMillion: 0.25,
  },
  "moonshot-v1-8k": {
    inputPerMillion: 0.5,
    outputPerMillion: 2.0,
    cachePerMillion: 0.125,
  },
};

const PROVIDER_DEFAULTS: Record<ProviderId, ModelTokenPricing> = {
  openai: { inputPerMillion: 2.5, outputPerMillion: 10.0, cachePerMillion: 1.25 },
  anthropic: {
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
    cachePerMillion: 0.3,
  },
  kimi: { inputPerMillion: 1.0, outputPerMillion: 3.0, cachePerMillion: 0.25 },
};

const CATALOG: Record<ProviderId, Record<string, ModelTokenPricing>> = {
  openai: OPENAI_PRICING,
  anthropic: ANTHROPIC_PRICING,
  kimi: KIMI_PRICING,
};

export function resolveProviderId(
  provider: string | null | undefined,
): ProviderId {
  if (provider === "anthropic" || provider === "kimi" || provider === "openai") {
    return provider;
  }
  return "openai";
}

export function getModelPricing(
  provider: string | null | undefined,
  model: string,
): ModelTokenPricing {
  const providerId = resolveProviderId(provider);
  return CATALOG[providerId][model] ?? PROVIDER_DEFAULTS[providerId];
}

export function calculateTokenCost(input: {
  provider?: string | null;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
}): CostBreakdown {
  const pricing = getModelPricing(input.provider, input.model);
  const inputCostUsd =
    (input.inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCostUsd =
    (input.outputTokens / 1_000_000) * pricing.outputPerMillion;
  const cacheCostUsd =
    (input.cacheTokens / 1_000_000) * pricing.cachePerMillion;
  const totalCostUsd = inputCostUsd + outputCostUsd + cacheCostUsd;

  return {
    inputCostUsd,
    outputCostUsd,
    cacheCostUsd,
    totalCostUsd,
  };
}

export function costToCents(usd: number): number {
  return Math.round(usd * 100);
}

export function formatUsd(amount: number): string {
  if (amount > 0 && amount < 0.01) {
    return `$${amount.toFixed(4)}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || ms < 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = Math.round(seconds % 60);
  return `${minutes}m ${rem}s`;
}
