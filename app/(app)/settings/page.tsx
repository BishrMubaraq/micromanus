import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/features/auth/get-session";
import { SettingsPanel } from "@/features/settings/components/settings-panel";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { getUserProviderPublic } from "@/services/providers";

export const metadata: Metadata = {
  title: "Settings",
  description: `Manage your ${APP_NAME} provider, profile, and session.`,
};

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect(ROUTES.home);
  }

  const provider = await getUserProviderPublic(session.user.id);

  return (
    <SettingsPanel
      email={session.user.email}
      fullName={session.displayName}
      creditsBalance={session.profile?.credits_balance ?? 0}
      provider={provider}
    />
  );
}
