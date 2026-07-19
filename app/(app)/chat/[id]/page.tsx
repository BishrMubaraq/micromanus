import { notFound, redirect } from "next/navigation";

import { ChatWorkspace } from "@/features/chat/components/chat-workspace";
import { getSession } from "@/features/auth/get-session";
import { ROUTES } from "@/lib/constants";
import {
  dbMessagesToUIMessages,
  getChat,
  listMessages,
} from "@/services/chats";

type ChatIdPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatIdPage({ params }: ChatIdPageProps) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    redirect(ROUTES.home);
  }

  const chat = await getChat(id, session.user.id);
  if (!chat) {
    notFound();
  }

  const messages = await listMessages(id, session.user.id);

  return (
    <ChatWorkspace
      chatId={chat.id}
      title={chat.title}
      initialMessages={dbMessagesToUIMessages(messages)}
    />
  );
}
