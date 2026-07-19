import type { Chat, Message } from "@/types/database";

export type ChatListItem = Pick<
  Chat,
  "id" | "title" | "status" | "updated_at" | "created_at"
>;

export type ChatThread = {
  chat: Chat;
  messages: Message[];
};
