import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

export function AnalyticsEmpty() {
  return (
    <EmptyState
      icon={BarChart3}
      title="No usage yet"
      description="Run a research chat to see credits, estimated cost, and token usage here."
      className="py-20"
    />
  );
}
