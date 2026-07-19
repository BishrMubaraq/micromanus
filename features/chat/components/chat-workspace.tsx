"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Compass } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Composer } from "@/features/chat/components/composer";
import { MessageActions } from "@/features/chat/components/message-actions";
import { ReportCard } from "@/features/chat/components/report-card";
import { ResearchTimeline } from "@/features/chat/components/research-timeline";
import type { ResearchUIMessage } from "@/features/agent/message-types";
import type { ResearchTimelineState } from "@/features/agent/timeline";
import { createInitialTimeline } from "@/features/agent/timeline";
import { APP_NAME, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const MarkdownMessage = dynamic(
  () =>
    import("@/features/chat/components/markdown-message").then(
      (mod) => mod.MarkdownMessage,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-20 animate-pulse rounded-lg bg-muted/40" aria-hidden />
    ),
  },
);

type ChatWorkspaceProps = {
  chatId?: string;
  initialMessages?: UIMessage[];
  title?: string;
};

function extractText(message: UIMessage) {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function extractTimeline(messages: ResearchUIMessage[]): ResearchTimelineState | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    for (let j = message.parts.length - 1; j >= 0; j -= 1) {
      const part = message.parts[j];
      if (part.type === "data-timeline") {
        return part.data;
      }
    }
  }
  return null;
}

function extractReports(message: ResearchUIMessage) {
  return message.parts.flatMap((part) =>
    part.type === "data-report" ? [part.data] : [],
  );
}

export function ChatWorkspace({
  chatId: initialChatId,
  initialMessages = [],
  title,
}: ChatWorkspaceProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState(initialChatId);
  const chatIdRef = useRef(initialChatId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  chatIdRef.current = chatId;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, body, headers, credentials, api }) => ({
          api,
          headers,
          credentials,
          body: {
            ...body,
            messages,
            chatId: chatIdRef.current,
          },
        }),
      }),
    [],
  );

  const { messages, sendMessage, status, stop, regenerate, error } =
    useChat<ResearchUIMessage>({
      id: initialChatId ?? "new-research",
      messages: initialMessages as ResearchUIMessage[],
      transport,
      onData: (dataPart) => {
        if (dataPart.type === "data-chatMeta") {
          const nextId = dataPart.data.chatId;
          if (!nextId) return;
          setChatId((current) => {
            if (current) return current;
            chatIdRef.current = nextId;
            return nextId;
          });
        }
      },
      onFinish: () => {
        router.refresh();
      },
    });

  const isStreaming = status === "submitted" || status === "streaming";
  const timeline = extractTimeline(messages) ?? (isStreaming ? createInitialTimeline() : null);

  useEffect(() => {
    if (!chatId || initialChatId) return;
    if (window.location.pathname !== ROUTES.chat) return;
    window.history.replaceState(null, "", `${ROUTES.chat}/${chatId}`);
  }, [chatId, initialChatId]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function onScroll() {
      if (!el) return;
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      stickToBottom.current = distance < 80;
    }

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!stickToBottom.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, timeline, isStreaming]);

  async function handleSubmit() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    stickToBottom.current = true;
    await sendMessage({ text });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 md:px-6">
          {title ? (
            <div>
              <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Research
              </p>
              <h1 className="mt-1 text-xl font-medium tracking-tight">{title}</h1>
            </div>
          ) : null}

          {messages.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="What should we investigate?"
              description={`Ask a complex question. ${APP_NAME} will plan, search the web, compare sources, and stream a grounded answer.`}
              className="py-16"
            />
          ) : null}

          <div
            aria-live="polite"
            aria-relevant="additions text"
            className="flex flex-col gap-6"
          >
          {messages.map((message, index) => {
            const text = extractText(message);
            const reports = extractReports(message);
            const isLastAssistant =
              message.role === "assistant" &&
              index === messages.length - 1;

            return (
              <article
                key={message.id}
                className={cn(
                  "rounded-2xl border border-border px-4 py-4 md:px-5",
                  message.role === "user"
                    ? "bg-secondary/40"
                    : "bg-card/30",
                )}
              >
                <p className="mb-3 text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                  {message.role === "user" ? "You" : APP_NAME}
                </p>

                {message.role === "assistant" && isLastAssistant && timeline ? (
                  <ResearchTimeline timeline={timeline} className="mb-4" />
                ) : null}

                {text ? (
                  message.role === "user" ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {text}
                    </p>
                  ) : (
                    <MarkdownMessage content={text} />
                  )
                ) : null}

                {message.role === "assistant" && !text && isStreaming && isLastAssistant ? (
                  <p className="text-sm text-muted-foreground">
                    Gathering sources and composing the answer…
                  </p>
                ) : null}

                {reports.map((report) => (
                  <ReportCard
                    key={report.reportId}
                    reportId={report.reportId}
                    title={report.title}
                  />
                ))}

                {message.role === "assistant" && text ? (
                  <MessageActions
                    content={text}
                    disabled={isStreaming}
                    onRegenerate={
                      isLastAssistant
                        ? () => {
                            void regenerate();
                          }
                        : undefined
                    }
                  />
                ) : null}
              </article>
            );
          })}

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error.message}
            </div>
          ) : null}
          </div>

          <div ref={bottomRef} />
        </div>
      </div>

      <Composer
        value={input}
        onChange={setInput}
        onSubmit={() => {
          void handleSubmit();
        }}
        onStop={() => stop()}
        isStreaming={isStreaming}
      />
    </div>
  );
}
