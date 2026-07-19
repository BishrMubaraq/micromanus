import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/features/auth/get-session";
import { LandingPage } from "@/features/marketing/components/landing-page";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE, ROUTES } from "@/lib/constants";
import { hasSupabaseConfig } from "@/services/supabase/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: `${APP_NAME} — ${APP_TAGLINE}`,
  },
  description: APP_DESCRIPTION,
};

export default async function HomePage() {
  if (hasSupabaseConfig()) {
    const session = await getSession();
    if (session) {
      const credits = session.profile?.credits_balance ?? 0;
      redirect(credits > 0 ? ROUTES.chat : ROUTES.paywall);
    }
  }

  return <LandingPage />;
}
