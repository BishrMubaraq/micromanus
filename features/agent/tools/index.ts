import { generateReportTool } from "./generate-report";
import { webSearchTool } from "./brave-search";

export const researchTools = {
  web_search: webSearchTool,
  generate_report: generateReportTool,
};

export type ResearchTools = typeof researchTools;

export { searchBraveWeb, webSearchTool } from "./brave-search";
export { generateReportTool } from "./generate-report";
export type { BraveSearchResponse, BraveSearchResult } from "./brave-search";
export type { GeneratedReportDraft } from "./generate-report";
