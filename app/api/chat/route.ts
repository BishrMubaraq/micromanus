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
import { RESEARCH_CREDIT_COST } from "@/lib/env";
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

export const maxDuration = 60;

type ChatRequestBody = {
  messages: UIMessage[];
  chatId?: string;
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json()) as ChatRequestBody;
  const messages = body.messages ?? [];
  const latestUser = [...messages].reverse().find((message) => message.role === "user");

  if (!latestUser) {
    return new Response("Missing user message", { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", user.id)
    .maybeSingle();

  const balance = profile?.credits_balance ?? 0;
  if (balance < RESEARCH_CREDIT_COST) {
    return new Response("Insufficient credits", { status: 402 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response("Missing OPENAI_API_KEY", { status: 500 });
  }

  const promptText = textFromUIMessage(latestUser);
  let chatId = body.chatId;
  let chatTitle = titleFromPrompt(promptText);
  let isNewChat = false;

  if (chatId) {
    const existing = await getChat(chatId, user.id);
    if (!existing) {
      return new Response("Chat not found", { status: 404 });
    }
    chatTitle = existing.title;
    if (existing.title === "Untitled research" && promptText) {
      chatTitle = titleFromPrompt(promptText);
      await renameChat(chatId, user.id, chatTitle);
    }
  } else {
    const chat = await createChat(user.id, chatTitle);
    chatId = chat.id;
    isNewChat = true;
  }

  const existingMessages = await listMessages(chatId, user.id);
  const lastDb = existingMessages[existingMessages.length - 1];
  const previousUser = existingMessages
    .slice()
    .reverse()
    .find((message) => message.role === "user");
  const isRegenerate =
    lastDb?.role === "assistant" &&
    previousUser?.content === promptText;

  if (!isRegenerate) {
    await insertMessage({
      chatId,
      userId: user.id,
      role: "user",
      content: promptText,
      parts: latestUser.parts as unknown as import("@/types/database").Json,
    });
  }

  const admin = createAdminClient();
  await grantCreditsWithAdmin(admin, {
    userId: user.id,
    delta: -RESEARCH_CREDIT_COST,
    reason: "usage",
    metadata: { chatId, model: process.env.OPENAI_MODEL ?? "gpt-4o" },
  });

  const stream = createUIMessageStream<ResearchUIMessage>({
    originalMessages: messages as ResearchUIMessage[],
    generateId,
    execute: async ({ writer }) => {
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

      const [text, steps, usage] = await Promise.all([
        result.text,
        result.steps,
        result.usage,
      ]);

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
            userId: user.id,
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
        userId: user.id,
        role: "assistant",
        content: text,
        parts: assistantParts as unknown as import("@/types/database").Json,
      });

      await touchChat(chatId!, user.id);

      await admin.from("usage_logs").insert({
        user_id: user.id,
        chat_id: chatId,
        model: process.env.OPENAI_MODEL ?? "gpt-4o",
        input_tokens: usage.inputTokens ?? 0,
        output_tokens: usage.outputTokens ?? 0,
        credits_spent: RESEARCH_CREDIT_COST,
        metadata: { isNewChat, reportId },
      });
    },
    onError: (error) => {
      console.error("Research stream error", error);
      return error instanceof Error ? error.message : "Research failed";
    },
  });

  return createUIMessageStreamResponse({ stream });
}
