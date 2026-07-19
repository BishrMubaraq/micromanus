import { redirect } from "next/navigation";

import { getSession } from "@/features/auth/get-session";
import { SettingsPanel } from "@/features/settings/components/settings-panel";
import { ROUTES } from "@/lib/constants";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect(ROUTES.home);
  }

  return (
    <SettingsPanel
      email={session.user.email}
      fullName={session.profile?.full_name ?? null}
      creditsBalance={session.profile?.credits_balance ?? 0}
    />
  );
}
