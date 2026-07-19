import { generateReportTool } from "./generate-report";
import { webSearchTool } from "./serp-search";

export const researchTools = {
  web_search: webSearchTool,
  generate_report: generateReportTool,
};

export type ResearchTools = typeof researchTools;

export { searchSerpApiWeb, webSearchTool } from "./serp-search";
export { generateReportTool } from "./generate-report";
export type { WebSearchResponse, WebSearchResult } from "./serp-search";
export type { GeneratedReportDraft } from "./generate-report";
