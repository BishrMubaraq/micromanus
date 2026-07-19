import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";

export function AnalyticsEmpty() {
  return (
    <EmptyState
      icon={BarChart3}
      title="No usage yet"
      description="Once research runs consume credits, token and spend analytics will show up here."
      className="py-24"
    />
  );
}
