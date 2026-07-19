import type { ProviderId, ProviderModel } from "@/features/providers/types";

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  kimi: "Kimi (Moonshot)",
};

export const DEFAULT_ENDPOINTS: Record<ProviderId, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  kimi: "https://api.moonshot.ai/v1",
};

export const PROVIDER_MODELS: Record<ProviderId, ProviderModel[]> = {
  openai: [
    { id: "gpt-4.1", label: "GPT-4.1" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { id: "gpt-4.1-nano", label: "GPT-4.1 Nano" },
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini" },
    { id: "o3", label: "o3" },
    { id: "o4-mini", label: "o4-mini" },
  ],
  anthropic: [
    { id: "claude-opus-4-5", label: "Claude Opus 4.5" },
    { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
    { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
    { id: "claude-opus-4-1", label: "Claude Opus 4.1" },
    { id: "claude-sonnet-4-0", label: "Claude Sonnet 4" },
  ],
  kimi: [
    { id: "kimi-k2-turbo-preview", label: "Kimi K2 Turbo" },
    { id: "kimi-k2-0711-preview", label: "Kimi K2" },
    { id: "moonshot-v1-128k", label: "Moonshot v1 128K" },
    { id: "moonshot-v1-32k", label: "Moonshot v1 32K" },
    { id: "moonshot-v1-8k", label: "Moonshot v1 8K" },
  ],
};

/** Providers that use OpenAI Chat Completions (not Responses API). */
export const OPENAI_COMPATIBLE_PROVIDERS: ProviderId[] = ["openai", "kimi"];

export function getModelsForProvider(provider: ProviderId): ProviderModel[] {
  return PROVIDER_MODELS[provider];
}

export function getDefaultModel(provider: ProviderId): string {
  return PROVIDER_MODELS[provider][0]?.id ?? "";
}

export function getDefaultEndpoint(provider: ProviderId): string {
  return DEFAULT_ENDPOINTS[provider];
}

export function isKnownModel(provider: ProviderId, model: string): boolean {
  const trimmed = model.trim();
  if (!trimmed) return false;
  return PROVIDER_MODELS[provider].some((item) => item.id === trimmed);
}

export function resolveModelId(provider: ProviderId, model: string): string {
  const trimmed = model.trim();
  if (isKnownModel(provider, trimmed)) return trimmed;
  return getDefaultModel(provider);
}
