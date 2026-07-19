import type { UIMessage } from "ai";

import { createClient } from "@/services/supabase/server";
import type { Chat, Json, Message, Report } from "@/types/database";

export function titleFromPrompt(prompt: string): string {
  const cleaned = prompt.replace(/\s+/g, " ").trim();
  if (!cleaned) return "Untitled research";
  return cleaned.length > 64 ? `${cleaned.slice(0, 61)}…` : cleaned;
}

export function textFromUIMessage(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export async function listChats(userId: string, limit = 40): Promise<Chat[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .neq("status", "deleted")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getChat(chatId: string, userId: string): Promise<Chat | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("id", chatId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createChat(userId: string, title: string): Promise<Chat> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chats")
    .insert({ user_id: userId, title })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function renameChat(
  chatId: string,
  userId: string,
  title: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("chats")
    .update({ title })
    .eq("id", chatId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function touchChat(chatId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("chats")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chatId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function listMessages(
  chatId: string,
  userId: string,
): Promise<Message[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function insertMessage(input: {
  chatId: string;
  userId: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  parts: Json;
}): Promise<Message> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      chat_id: input.chatId,
      user_id: input.userId,
      role: input.role,
      content: input.content,
      parts: input.parts,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export function dbMessagesToUIMessages(messages: Message[]): UIMessage[] {
  return messages.map((message) => {
    const parts = Array.isArray(message.parts)
      ? (message.parts as UIMessage["parts"])
      : message.content
        ? [{ type: "text" as const, text: message.content }]
        : [];

    return {
      id: message.id,
      role: message.role === "tool" ? "assistant" : message.role,
      parts,
    } as UIMessage;
  });
}

export async function createReport(input: {
  userId: string;
  chatId: string;
  title: string;
  content: string;
  metadata: Json;
}): Promise<Report> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .insert({
      user_id: input.userId,
      chat_id: input.chatId,
      title: input.title,
      content: input.content,
      metadata: input.metadata,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getReport(
  reportId: string,
  userId: string,
): Promise<Report | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listReportsForChat(
  chatId: string,
  userId: string,
): Promise<Report[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("chat_id", chatId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}
