import { redirect } from "next/navigation";

import { AnalyticsEmpty } from "@/features/analytics/components/analytics-empty";
import { getSession } from "@/features/auth/get-session";
import { ROUTES } from "@/lib/constants";
import { getUsageSummary } from "@/services/analytics";

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) {
    redirect(ROUTES.home);
  }

  const summary = await getUsageSummary(session.user.id);

  return (
    <div className="overflow-y-auto p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-medium tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Usage, credits, and research activity.
        </p>
      </div>

      {summary.requestCount === 0 ? (
        <AnalyticsEmpty />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Research runs" value={summary.requestCount} />
          <Metric label="Credits spent" value={summary.totalCreditsSpent} />
          <Metric
            label="Tokens"
            value={summary.totalInputTokens + summary.totalOutputTokens}
          />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 px-4 py-5">
      <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-medium tracking-tight">
        {value.toLocaleString()}
      </p>
    </div>
  );
}
