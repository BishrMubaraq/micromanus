import { tool } from "ai";
import { z } from "zod";

export type GeneratedReportDraft = {
  title: string;
  summary: string;
  sections: Array<{ heading: string; body: string }>;
  sources: Array<{ title: string; url: string }>;
};

/**
 * Structured report draft tool. Persistence happens in the chat route after the agent finishes.
 */
export const generateReportTool = tool({
  description:
    "Produce a structured research report when the user asks for a report, briefing, or downloadable summary.",
  inputSchema: z.object({
    title: z.string().min(3).describe("Report title"),
    summary: z.string().min(20).describe("Executive summary"),
    sections: z
      .array(
        z.object({
          heading: z.string(),
          body: z.string(),
        }),
      )
      .min(1)
      .describe("Report sections"),
    sources: z
      .array(
        z.object({
          title: z.string(),
          url: z.string(),
        }),
      )
      .optional()
      .describe("Cited sources"),
  }),
  execute: async (input): Promise<GeneratedReportDraft> => ({
    title: input.title,
    summary: input.summary,
    sections: input.sections,
    sources: input.sources ?? [],
  }),
});
