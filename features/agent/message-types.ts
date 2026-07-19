import type { UIMessage } from "ai";

import type { ResearchTimelineState } from "@/features/agent/timeline";

export type ResearchDataParts = {
  timeline: ResearchTimelineState;
  chatMeta: {
    chatId: string;
    title: string;
  };
  report: {
    reportId: string;
    title: string;
  };
};

export type ResearchUIMessage = UIMessage<unknown, ResearchDataParts>;
