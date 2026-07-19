import { generateText, streamText } from "ai";

import { createLanguageModel } from "@/features/providers/create-language-model";
import { extractToolCalls, normalizeUsage } from "@/features/providers/usage";
import type {
  LLMProvider,
  ProviderCallOptions,
  ProviderGenerateResult,
  ProviderId,
  ProviderStreamResult,
  ProviderToolCall,
  TokenUsage,
  UserProviderConfig,
} from "@/features/providers/types";
import type { LanguageModelUsage } from "ai";

class SdkLLMProvider implements LLMProvider {
  readonly id: ProviderId;

  constructor(private readonly config: UserProviderConfig) {
    this.id = config.provider;
  }

  async generate(options: ProviderCallOptions): Promise<ProviderGenerateResult> {
    const model = createLanguageModel({
      provider: this.config.provider,
      endpoint: this.config.endpoint,
      apiKey: this.config.apiKey,
      model: options.model,
    });

    return generateText({
      model,
      system: options.system,
      messages: options.messages,
      tools: options.tools,
      abortSignal: options.abortSignal,
      stopWhen: options.stopWhen,
      onStepFinish: options.onStepFinish,
      onFinish: options.onFinish,
    });
  }

  async stream(options: ProviderCallOptions): Promise<ProviderStreamResult> {
    const model = createLanguageModel({
      provider: this.config.provider,
      endpoint: this.config.endpoint,
      apiKey: this.config.apiKey,
      model: options.model,
    });

    return streamText({
      model,
      system: options.system,
      messages: options.messages,
      tools: options.tools,
      abortSignal: options.abortSignal,
      stopWhen: options.stopWhen,
      onStepFinish: options.onStepFinish,
      onFinish: options.onFinish,
    });
  }

  toolCalls(result: {
    steps: Array<{ toolCalls: ProviderToolCall[] }>;
  }): ProviderToolCall[] {
    return extractToolCalls(result);
  }

  usage(usage: LanguageModelUsage): TokenUsage {
    return normalizeUsage(usage);
  }
}

/** Factory — UI never constructs vendor clients directly. */
export function createLLMProvider(config: UserProviderConfig): LLMProvider {
  return new SdkLLMProvider(config);
}
