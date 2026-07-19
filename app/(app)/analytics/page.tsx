import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AnalyticsDashboardView } from "@/features/analytics/components/analytics-dashboard";
import { getSession } from "@/features/auth/get-session";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { getAnalyticsDashboard } from "@/services/analytics";

export const metadata: Metadata = {
  title: "Analytics",
  description: `Credits, spend, and research usage in ${APP_NAME}.`,
};

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) {
    redirect(ROUTES.home);
  }

  const data = await getAnalyticsDashboard(session.user.id);

  return <AnalyticsDashboardView data={data} />;
}
