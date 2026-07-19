"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type MessageActionsProps = {
  content: string;
  onRegenerate?: () => void;
  disabled?: boolean;
};

export function MessageActions({
  content,
  onRegenerate,
  disabled,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-3 flex items-center gap-1">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-muted-foreground"
        onClick={handleCopy}
        disabled={!content}
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </Button>
      {onRegenerate ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-muted-foreground"
          onClick={onRegenerate}
          disabled={disabled}
        >
          <RefreshCw className="size-3.5" />
          Regenerate
        </Button>
      ) : null}
    </div>
  );
}
