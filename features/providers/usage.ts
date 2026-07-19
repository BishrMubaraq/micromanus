import type { LanguageModelUsage } from "ai";

import type { TokenUsage } from "@/features/providers/types";

export function normalizeUsage(usage: LanguageModelUsage): TokenUsage {
  const inputTokens = usage.inputTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;
  const cacheRead = usage.inputTokenDetails?.cacheReadTokens ?? 0;
  const cacheWrite = usage.inputTokenDetails?.cacheWriteTokens ?? 0;
  const cacheTokens = cacheRead + cacheWrite;
  const totalTokens =
    usage.totalTokens ?? inputTokens + outputTokens;

  return {
    inputTokens,
    outputTokens,
    cacheTokens,
    totalTokens,
  };
}

export function extractToolCalls(result: {
  steps: Array<{ toolCalls: Array<{ toolCallId: string; toolName: string; input: unknown }> }>;
}) {
  return result.steps.flatMap((step) =>
    step.toolCalls.map((call) => ({
      toolCallId: call.toolCallId,
      toolName: call.toolName,
      input: call.input,
    })),
  );
}
