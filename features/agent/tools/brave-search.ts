import { tool } from "ai";
import { z } from "zod";

export type BraveSearchResult = {
  title: string;
  url: string;
  description: string;
};

export type BraveSearchResponse = {
  query: string;
  results: BraveSearchResult[];
};

export async function searchBraveWeb(
  query: string,
  count = 5,
): Promise<BraveSearchResponse> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing BRAVE_API_KEY");
  }

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(Math.min(Math.max(count, 1), 10)));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brave Search failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    web?: {
      results?: Array<{
        title?: string;
        url?: string;
        description?: string;
      }>;
    };
  };

  const results =
    data.web?.results?.map((item) => ({
      title: item.title ?? "Untitled",
      url: item.url ?? "",
      description: item.description ?? "",
    })).filter((item) => item.url) ?? [];

  return { query, results };
}

/**
 * Brave web search tool for the research agent.
 * Future tools live alongside this file in features/agent/tools/.
 */
export const webSearchTool = tool({
  description:
    "Search the public web with Brave Search. Use when the question needs current facts, sources, or verification.",
  inputSchema: z.object({
    query: z
      .string()
      .min(2)
      .describe("Focused search query derived from the research plan"),
    count: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .describe("Number of results to return (1-10)"),
  }),
  execute: async ({ query, count }) => searchBraveWeb(query, count ?? 5),
});
