export const RESEARCH_TIMELINE_STEPS = [
  "planning",
  "searching",
  "reading",
  "comparing",
  "writing",
  "report",
] as const;

export type ResearchTimelineStepId = (typeof RESEARCH_TIMELINE_STEPS)[number];

export type TimelineStepStatus = "pending" | "active" | "done" | "skipped";

export type ResearchTimelineStep = {
  id: ResearchTimelineStepId;
  label: string;
  status: TimelineStepStatus;
  detail?: string;
};

export type ResearchTimelineState = {
  steps: ResearchTimelineStep[];
  activeStep: ResearchTimelineStepId | null;
};

export const TIMELINE_LABELS: Record<ResearchTimelineStepId, string> = {
  planning: "Planning",
  searching: "Searching Web",
  reading: "Reading Sources",
  comparing: "Comparing Information",
  writing: "Writing Response",
  report: "Generating Report",
};

export function createInitialTimeline(): ResearchTimelineState {
  return {
    activeStep: "planning",
    steps: RESEARCH_TIMELINE_STEPS.map((id) => ({
      id,
      label: TIMELINE_LABELS[id],
      status: id === "planning" ? "active" : "pending",
    })),
  };
}

export function advanceTimeline(
  state: ResearchTimelineState,
  next: ResearchTimelineStepId,
  detail?: string,
): ResearchTimelineState {
  const currentIndex = state.activeStep
    ? RESEARCH_TIMELINE_STEPS.indexOf(state.activeStep)
    : -1;
  const nextIndex = RESEARCH_TIMELINE_STEPS.indexOf(next);

  return {
    activeStep: next,
    steps: state.steps.map((step) => {
      const index = RESEARCH_TIMELINE_STEPS.indexOf(step.id);
      if (step.id === next) {
        return { ...step, status: "active", detail };
      }
      if (index < nextIndex || (currentIndex >= 0 && index <= currentIndex && index < nextIndex)) {
        if (step.status === "pending" || step.status === "active") {
          return { ...step, status: "done" };
        }
      }
      return step;
    }),
  };
}

export function completeTimeline(
  state: ResearchTimelineState,
  options?: { skipReport?: boolean },
): ResearchTimelineState {
  return {
    activeStep: null,
    steps: state.steps.map((step) => {
      if (options?.skipReport && step.id === "report") {
        return { ...step, status: "skipped" };
      }
      if (step.status === "pending" || step.status === "active") {
        return { ...step, status: "done" };
      }
      return step;
    }),
  };
}
