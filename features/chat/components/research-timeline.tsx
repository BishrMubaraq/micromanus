"use client";

import { motion } from "framer-motion";
import {
  Check,
  FileText,
  GitCompareArrows,
  Globe,
  BookOpen,
  PenLine,
  Sparkles,
} from "lucide-react";

import type {
  ResearchTimelineState,
  ResearchTimelineStepId,
} from "@/features/agent/timeline";
import { cn } from "@/lib/utils";

const ICONS: Record<ResearchTimelineStepId, typeof Sparkles> = {
  planning: Sparkles,
  searching: Globe,
  reading: BookOpen,
  comparing: GitCompareArrows,
  writing: PenLine,
  report: FileText,
};

type ResearchTimelineProps = {
  timeline: ResearchTimelineState;
  className?: string;
};

export function ResearchTimeline({
  timeline,
  className,
}: ResearchTimelineProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card/40 px-4 py-3",
        className,
      )}
    >
      <p className="mb-3 text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        Research timeline
      </p>
      <ol className="space-y-2.5">
        {timeline.steps.map((step) => {
          if (step.status === "skipped") return null;
          const Icon = ICONS[step.id];
          const active = step.status === "active";
          const done = step.status === "done";

          return (
            <li key={step.id} className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                  active && "border-foreground/40 bg-foreground text-background",
                  done && "border-border bg-secondary text-foreground",
                  step.status === "pending" &&
                    "border-border text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="size-3.5" />
                ) : (
                  <Icon className="size-3.5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm",
                      active
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                  {active ? (
                    <motion.span
                      className="inline-flex gap-0.5"
                      initial={{ opacity: 0.4 }}
                      animate={{ opacity: 1 }}
                      transition={{ repeat: Infinity, duration: 1.1 }}
                    >
                      <span className="size-1 rounded-full bg-foreground/70" />
                      <span className="size-1 rounded-full bg-foreground/50" />
                      <span className="size-1 rounded-full bg-foreground/30" />
                    </motion.span>
                  ) : null}
                </div>
                {step.detail ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {step.detail}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
