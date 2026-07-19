import type { Json } from "@/types/database";

/**
 * Agent contracts for the future research runtime.
 * No Vercel AI SDK wiring in this architecture pass.
 */

export type AgentToolName =
  | "web_search"
  | "fetch_url"
  | "summarize"
  | "cite_sources";

export type AgentToolDefinition = {
  name: AgentToolName;
  description: string;
  parameters: Json;
};

export type AgentMessagePart =
  | { type: "text"; text: string }
  | { type: "tool-call"; toolName: AgentToolName; args: Json }
  | { type: "tool-result"; toolName: AgentToolName; result: Json }
  | { type: "source"; url: string; title?: string };

export type AgentTurnInput = {
  chatId: string;
  userId: string;
  prompt: string;
  history: AgentMessagePart[];
};

export type AgentTurnEvent =
  | { type: "status"; status: string }
  | { type: "delta"; text: string }
  | { type: "tool"; part: AgentMessagePart }
  | { type: "error"; message: string }
  | { type: "done"; parts: AgentMessagePart[] };

export interface ResearchAgent {
  readonly tools: readonly AgentToolDefinition[];
  run(input: AgentTurnInput): AsyncIterable<AgentTurnEvent>;
}

export const RESEARCH_TOOLS: readonly AgentToolDefinition[] = [
  {
    name: "web_search",
    description: "Search the public web for relevant sources.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
  },
  {
    name: "fetch_url",
    description: "Fetch and extract readable content from a URL.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string" },
      },
      required: ["url"],
    },
  },
  {
    name: "summarize",
    description: "Summarize a body of research notes.",
    parameters: {
      type: "object",
      properties: {
        content: { type: "string" },
      },
      required: ["content"],
    },
  },
  {
    name: "cite_sources",
    description: "Format citations for selected sources.",
    parameters: {
      type: "object",
      properties: {
        sources: { type: "array", items: { type: "string" } },
      },
      required: ["sources"],
    },
  },
] as const;
