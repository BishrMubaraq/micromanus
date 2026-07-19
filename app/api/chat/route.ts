import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  type UIMessage,
} from "ai";

import { createResearchStream } from "@/features/agent/research-agent";
import type { ResearchUIMessage } from "@/features/agent/message-types";
import type { GeneratedReportDraft } from "@/features/agent/tools";
import { createInitialTimeline } from "@/features/agent/timeline";
import {
  calculateTokenCost,
  costToCents,
} from "@/features/analytics/pricing";
import { createLLMProvider } from "@/features/providers";
import { RESEARCH_CREDIT_COST } from "@/lib/env";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  assertSameOrigin,
  publicErrorMessage,
} from "@/lib/security/request";
import { createAdminClient } from "@/services/supabase/admin";
import { grantCreditsWithAdmin } from "@/services/credits";
import { createClient } from "@/services/supabase/server";
import {
  createChat,
  createReport,
  getChat,
  insertMessage,
  listMessages,
  renameChat,
  textFromUIMessage,
  titleFromPrompt,
  touchChat,
} from "@/services/chats";
import {
  getUserProviderConfig,
  persistUsageLog,
} from "@/services/providers";

export const maxDuration = 300;

type ChatRequestBody = {
  messages: UIMessage[];
  chatId?: string;
};

export async function POST(req: Request) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = user.id;

  const limited = enforceRateLimit({
    key: `chat:${userId}`,
    ...RATE_LIMITS.chat,
  });
  if (limited) return limited;

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const messages = body.messages ?? [];
  const latestUser = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!latestUser) {
    return new Response("Missing user message", { status: 400 });
  }

  let providerConfig;
  try {
    providerConfig = await getUserProviderConfig(userId);
  } catch (error) {
    console.error("Provider config error", error);
    return new Response(
      "Provider encryption is not configured. Set PROVIDER_ENCRYPTION_KEY.",
      { status: 500 },
    );
  }

  if (!providerConfig?.apiKey) {
    return new Response(
      "Configure your model provider and API key in Settings before researching.",
      { status: 400 },
    );
  }

  const llm = createLLMProvider(providerConfig);
  const model = providerConfig.defaultModel;

  const promptText = textFromUIMessage(latestUser);
  let chatId = body.chatId;
  let chatTitle = titleFromPrompt(promptText);
  let isNewChat = false;

  if (chatId) {
    const existing = await getChat(chatId, userId);
    if (!existing) {
      return new Response("Chat not found", { status: 404 });
    }
    chatTitle = existing.title;
    if (existing.title === "Untitled research" && promptText) {
      chatTitle = titleFromPrompt(promptText);
      await renameChat(chatId, userId, chatTitle);
    }
  } else {
    const chat = await createChat(userId, chatTitle);
    chatId = chat.id;
    isNewChat = true;
  }

  const existingMessages = await listMessages(chatId, userId);
  const lastDb = existingMessages[existingMessages.length - 1];
  const previousUser = existingMessages
    .slice()
    .reverse()
    .find((message) => message.role === "user");
  const isRegenerate =
    lastDb?.role === "assistant" && previousUser?.content === promptText;

  if (!isRegenerate) {
    await insertMessage({
      chatId,
      userId,
      role: "user",
      content: promptText,
      parts: latestUser.parts as unknown as import("@/types/database").Json,
    });
  }

  const admin = createAdminClient();
  const providerId = providerConfig.provider;

  // Atomic deduct — fails if balance is insufficient (no TOCTOU race).
  try {
    await grantCreditsWithAdmin(admin, {
      userId,
      delta: -RESEARCH_CREDIT_COST,
      reason: "usage",
      metadata: { chatId, model, provider: providerId },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("insufficient")) {
      return new Response("Insufficient credits", { status: 402 });
    }
    console.error("Credit deduct failed", error);
    return new Response("Unable to charge credits", { status: 500 });
  }

  let researchCompleted = false;
  const startedAt = Date.now();

  async function refundCredits(reason: string) {
    try {
      await grantCreditsWithAdmin(admin, {
        userId,
        delta: RESEARCH_CREDIT_COST,
        reason: "refund",
        metadata: {
          chatId,
          model,
          provider: providerId,
          reason,
        },
      });
    } catch (refundError) {
      console.error("Credit refund failed", refundError);
    }
  }

  const stream = createUIMessageStream<ResearchUIMessage>({
    originalMessages: messages as ResearchUIMessage[],
    generateId,
    execute: async ({ writer }) => {
      try {
        writer.write({
          type: "data-chatMeta",
          id: chatId,
          data: { chatId: chatId!, title: chatTitle },
        });

        writer.write({
          type: "data-timeline",
          id: `${chatId}-timeline`,
          data: createInitialTimeline(),
        });

        const result = await createResearchStream({
          provider: llm,
          model,
          messages,
          abortSignal: req.signal,
          onTimeline: (timeline) => {
            writer.write({
              type: "data-timeline",
              id: `${chatId}-timeline`,
              data: timeline,
            });
          },
        });

        writer.merge(
          result.toUIMessageStream({
            sendSources: true,
            originalMessages: messages as ResearchUIMessage[],
          }),
        );

        const [text, steps, rawUsage, totalUsage] = await Promise.all([
          result.text,
          result.steps,
          result.usage,
          result.totalUsage,
        ]);

        const usage = llm.usage(totalUsage ?? rawUsage);
        void llm.toolCalls({ steps });

        let reportId: string | null = null;
        let reportTitle: string | null = null;

        for (const step of steps) {
          for (const toolResult of step.toolResults ?? []) {
            if (toolResult.toolName !== "generate_report") continue;
            const draft = toolResult.output as GeneratedReportDraft;
            const content = [
              draft.summary,
              "",
              ...draft.sections.map(
                (section) => `## ${section.heading}\n\n${section.body}`,
              ),
              "",
              draft.sources.length
                ? `## Sources\n\n${draft.sources
                    .map((source) => `- [${source.title}](${source.url})`)
                    .join("\n")}`
                : "",
            ]
              .filter(Boolean)
              .join("\n");

            const report = await createReport({
              userId,
              chatId: chatId!,
              title: draft.title,
              content,
              metadata: {
                sources: draft.sources,
                summary: draft.summary,
                sections: draft.sections,
              },
            });

            reportId = report.id;
            reportTitle = report.title;

            writer.write({
              type: "data-report",
              id: report.id,
              data: { reportId: report.id, title: report.title },
            });
          }
        }

        const assistantParts: ResearchUIMessage["parts"] = [
          { type: "text", text },
        ];

        if (reportId && reportTitle) {
          assistantParts.push({
            type: "data-report",
            id: reportId,
            data: { reportId, title: reportTitle },
          });
        }

        await insertMessage({
          chatId: chatId!,
          userId,
          role: "assistant",
          content: text,
          parts: assistantParts as unknown as import("@/types/database").Json,
        });

        await touchChat(chatId!, userId);

        const durationMs = Date.now() - startedAt;
        const cost = calculateTokenCost({
          provider: providerId,
          model,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          cacheTokens: usage.cacheTokens,
        });

        await persistUsageLog({
          userId,
          chatId: chatId!,
          provider: providerId,
          model,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          cacheTokens: usage.cacheTokens,
          totalTokens: usage.totalTokens,
          creditsSpent: RESEARCH_CREDIT_COST,
          costCents: costToCents(cost.totalCostUsd),
          durationMs,
          metadata: {
            isNewChat,
            reportId,
            cost: {
              input: cost.inputCostUsd,
              output: cost.outputCostUsd,
              cache: cost.cacheCostUsd,
              total: cost.totalCostUsd,
            },
          },
        });

        researchCompleted = true;
      } catch (error) {
        if (!researchCompleted) {
          const aborted = req.signal.aborted;
          await refundCredits(aborted ? "client_abort" : "stream_error");
        }
        throw error;
      }
    },
    onError: (error) => {
      console.error("Research stream error", error);
      return publicErrorMessage(error, "Research failed. Please try again.");
    },
  });

  return createUIMessageStreamResponse({ stream });
}
