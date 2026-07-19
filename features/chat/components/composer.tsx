"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  disabled,
  placeholder = "Ask a research question…",
}: ComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  return (
    <div className="border-t border-border bg-background/80 px-4 py-4 backdrop-blur md:px-6">
      <div
        className={cn(
          "mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-card/50 p-2 shadow-sm",
        )}
      >
        <label htmlFor="research-composer" className="sr-only">
          Research prompt
        </label>
        <textarea
          id="research-composer"
          ref={ref}
          value={value}
          disabled={disabled || isStreaming}
          rows={1}
          placeholder={placeholder}
          aria-label="Research prompt"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!isStreaming && value.trim()) onSubmit();
            }
          }}
          className="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        {isStreaming ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="mb-0.5 size-10 shrink-0 rounded-xl"
            onClick={onStop}
            aria-label="Stop generation"
          >
            <Square className="size-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            className="mb-0.5 size-10 shrink-0 rounded-xl"
            disabled={disabled || !value.trim()}
            onClick={onSubmit}
            aria-label="Send research prompt"
          >
            <ArrowUp className="size-4" />
          </Button>
        )}
      </div>
      <p className="mx-auto mt-2 max-w-3xl px-1 text-[11px] text-muted-foreground">
        Enter to send · Shift+Enter for newline · ⌘K to navigate
      </p>
    </div>
  );
}
