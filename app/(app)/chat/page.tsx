import Link from "next/link";
import { redirect } from "next/navigation";

import { ChatWorkspace } from "@/features/chat/components/chat-workspace";
import { getSession } from "@/features/auth/get-session";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import { getUserProviderPublic } from "@/services/providers";

export default async function ChatPage() {
  const session = await getSession();
  if (!session) {
    redirect(ROUTES.home);
  }

  const provider = await getUserProviderPublic(session.user.id);

  if (!provider?.hasApiKey) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-medium tracking-tight">
          Connect a model provider
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          MicroManus uses your own API key. Add OpenAI, Anthropic, or Kimi in
          Settings to start researching.
        </p>
        <Button asChild>
          <Link href={ROUTES.settings}>Open Settings</Link>
        </Button>
      </div>
    );
  }

  return <ChatWorkspace />;
}
