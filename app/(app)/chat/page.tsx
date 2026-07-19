import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { KeyRound } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ChatWorkspace } from "@/features/chat/components/chat-workspace";
import { getSession } from "@/features/auth/get-session";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { getUserProviderPublic } from "@/services/providers";

export const metadata: Metadata = {
  title: "Research",
  description: `Start a new deep research session in ${APP_NAME}.`,
};

export default async function ChatPage() {
  const session = await getSession();
  if (!session) {
    redirect(ROUTES.home);
  }

  const provider = await getUserProviderPublic(session.user.id);

  if (!provider?.hasApiKey) {
    return (
      <EmptyState
        icon={KeyRound}
        title="Connect a model provider"
        description={`${APP_NAME} uses your own key. Connect OpenAI, Anthropic, or Kimi in Settings to start researching.`}
        className="h-full"
        action={
          <Button asChild>
            <Link href={ROUTES.settings}>Open Settings</Link>
          </Button>
        }
      />
    );
  }

  return <ChatWorkspace />;
}
