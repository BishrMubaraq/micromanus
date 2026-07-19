import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";

import { RESEARCH_MODEL } from "@/lib/env";
import { RESEARCH_SYSTEM_PROMPT } from "@/features/agent/prompts";
import { researchTools } from "@/features/agent/tools";
import type {
  ResearchTimelineStepId,
  ResearchTimelineState,
} from "@/features/agent/timeline";
import {
  advanceTimeline,
  completeTimeline,
  createInitialTimeline,
} from "@/features/agent/timeline";

export type TimelineListener = (timeline: ResearchTimelineState) => void;

export async function createResearchStream(options: {
  messages: UIMessage[];
  abortSignal?: AbortSignal;
  onTimeline?: TimelineListener;
}) {
  let timeline = createInitialTimeline();
  const emit = (next: ResearchTimelineStepId, detail?: string) => {
    timeline = advanceTimeline(timeline, next, detail);
    options.onTimeline?.(timeline);
  };

  options.onTimeline?.(timeline);

  const modelMessages = await convertToModelMessages(options.messages);

  return streamText({
    model: openai(RESEARCH_MODEL),
    system: RESEARCH_SYSTEM_PROMPT,
    messages: modelMessages,
    tools: researchTools,
    stopWhen: stepCountIs(8),
    abortSignal: options.abortSignal,
    onStepFinish: async ({ toolCalls, toolResults, text }) => {
      const searchCall = toolCalls.find((call) => call.toolName === "web_search");
      const reported = toolCalls.some(
        (call) => call.toolName === "generate_report",
      );

      if (searchCall) {
        const query =
          searchCall.input &&
          typeof searchCall.input === "object" &&
          "query" in searchCall.input
            ? String((searchCall.input as { query?: string }).query ?? "")
            : undefined;

        emit("searching", query ? `Query: ${query}` : undefined);
        emit("reading", `${toolResults.length} tool result(s) ready`);
        emit("comparing");
      }

      if (reported) {
        emit("report");
      }

      if (text?.trim()) {
        emit("writing");
      }
    },
    onFinish: async () => {
      const hadReport = timeline.steps.some(
        (step) => step.id === "report" && step.status !== "pending",
      );
      timeline = completeTimeline(timeline, { skipReport: !hadReport });
      options.onTimeline?.(timeline);
    },
  });
}
