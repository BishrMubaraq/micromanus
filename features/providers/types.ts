import type {
  generateText,
  LanguageModelUsage,
  ModelMessage,
  streamText,
  ToolSet,
} from "ai";

export const PROVIDER_IDS = ["openai", "anthropic", "kimi"] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export type ProviderModel = {
  id: string;
  label: string;
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheTokens: number;
  totalTokens: number;
};

export type ProviderToolCall = {
  toolCallId: string;
  toolName: string;
  input: unknown;
};

export type ProviderCallOptions = {
  model: string;
  system?: string;
  messages: ModelMessage[];
  tools?: ToolSet;
  abortSignal?: AbortSignal;
  stopWhen?: Parameters<typeof streamText>[0]["stopWhen"];
  onStepFinish?: Parameters<typeof streamText>[0]["onStepFinish"];
  onFinish?: Parameters<typeof streamText>[0]["onFinish"];
};

export type ProviderGenerateResult = Awaited<ReturnType<typeof generateText>>;
export type ProviderStreamResult = Awaited<ReturnType<typeof streamText>>;

/**
 * Provider contract. UI and chat routes depend only on this interface.
 */
export interface LLMProvider {
  readonly id: ProviderId;

  generate(options: ProviderCallOptions): Promise<ProviderGenerateResult>;

  stream(options: ProviderCallOptions): Promise<ProviderStreamResult>;

  toolCalls(result: {
    steps: Array<{ toolCalls: ProviderToolCall[] }>;
  }): ProviderToolCall[];

  usage(usage: LanguageModelUsage): TokenUsage;
}

export type UserProviderConfig = {
  provider: ProviderId;
  endpoint: string;
  apiKey: string;
  defaultModel: string;
};

export type UserProviderPublic = {
  provider: ProviderId;
  endpoint: string;
  defaultModel: string;
  apiKeyLastFour: string;
  hasApiKey: boolean;
};
