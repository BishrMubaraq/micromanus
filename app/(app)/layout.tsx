import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { getSession } from "@/features/auth/get-session";
import { ROUTES } from "@/lib/constants";
import { listChats } from "@/services/chats";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect(ROUTES.home);
  }

  const credits = session.profile?.credits_balance ?? 0;
  if (credits <= 0) {
    redirect(ROUTES.paywall);
  }

  const chats = await listChats(session.user.id);

  return (
    <AppShell
      creditsBalance={credits}
      chats={chats}
      user={{
        email: session.user.email,
        fullName: session.displayName,
        avatarUrl: session.profile?.avatar_url ?? null,
      }}
    >
      <ErrorBoundary>{children}</ErrorBoundary>
    </AppShell>
  );
}
