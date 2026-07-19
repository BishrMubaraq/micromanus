import { tool } from "ai";
import { z } from "zod";

export type WebSearchResult = {
  title: string;
  url: string;
  description: string;
};

export type WebSearchResponse = {
  query: string;
  results: WebSearchResult[];
};

/**
 * Google organic search via SerpAPI.
 * Docs: https://serpapi.com/search-api
 */
export async function searchSerpApiWeb(
  query: string,
  count = 5,
): Promise<WebSearchResponse> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing SERPAPI_API_KEY");
  }

  const limit = Math.min(Math.max(count, 1), 10);
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(limit));
  url.searchParams.set("api_key", apiKey);

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SerpAPI search failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    error?: string;
    organic_results?: Array<{
      title?: string;
      link?: string;
      snippet?: string;
    }>;
  };

  if (data.error) {
    throw new Error(`SerpAPI search failed: ${data.error}`);
  }

  const results =
    data.organic_results
      ?.slice(0, limit)
      .map((item) => ({
        title: item.title ?? "Untitled",
        url: item.link ?? "",
        description: item.snippet ?? "",
      }))
      .filter((item) => item.url) ?? [];

  return { query, results };
}

/**
 * Web search tool for the research agent (SerpAPI / Google).
 */
export const webSearchTool = tool({
  description:
    "Search the public web (Google via SerpAPI). Use when the question needs current facts, sources, or verification.",
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
  execute: async ({ query, count }) => searchSerpApiWeb(query, count ?? 5),
});
