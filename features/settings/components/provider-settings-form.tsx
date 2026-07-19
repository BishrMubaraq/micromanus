"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_ENDPOINTS,
  PROVIDER_IDS,
  PROVIDER_LABELS,
  getDefaultModel,
  getModelsForProvider,
  type ProviderId,
  type UserProviderPublic,
} from "@/features/providers";
import {
  saveProviderSettings,
  type ProviderFormState,
} from "@/features/providers/actions";
import { cn } from "@/lib/utils";

const initialState: ProviderFormState = {
  error: null,
  success: false,
};

type ProviderSettingsFormProps = {
  initial: UserProviderPublic | null;
};

export function ProviderSettingsForm({ initial }: ProviderSettingsFormProps) {
  const [provider, setProvider] = useState<ProviderId>(
    initial?.provider && PROVIDER_IDS.includes(initial.provider)
      ? initial.provider
      : "openai",
  );
  const [endpoint, setEndpoint] = useState(
    initial?.endpoint ?? DEFAULT_ENDPOINTS.openai,
  );
  const [defaultModel, setDefaultModel] = useState(
    initial?.defaultModel ?? getDefaultModel("openai"),
  );
  const [state, formAction, pending] = useActionState(
    saveProviderSettings,
    initialState,
  );

  const models = useMemo(() => getModelsForProvider(provider), [provider]);
  const selectedModel = models.some((model) => model.id === defaultModel)
    ? defaultModel
    : (models[0]?.id ?? "");

  useEffect(() => {
    if (state.success) toast.success("Provider settings saved");
    if (state.error) toast.error(state.error);
  }, [state.error, state.success]);

  function handleProviderChange(next: ProviderId) {
    setProvider(next);
    setEndpoint(DEFAULT_ENDPOINTS[next]);
    setDefaultModel(getDefaultModel(next));
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="provider">Provider</Label>
        <select
          id="provider"
          name="provider"
          value={provider}
          onChange={(event) =>
            handleProviderChange(event.target.value as ProviderId)
          }
          className={selectClassName}
        >
          {PROVIDER_IDS.map((id) => (
            <option key={id} value={id}>
              {PROVIDER_LABELS[id]}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Bring your own key for OpenAI, Anthropic, or Kimi.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endpoint">Endpoint</Label>
        <Input
          id="endpoint"
          name="endpoint"
          value={endpoint}
          onChange={(event) => setEndpoint(event.target.value)}
          placeholder={DEFAULT_ENDPOINTS[provider]}
          className="h-10 border-border bg-background/60 font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          {provider === "kimi"
            ? "Moonshot / Kimi OpenAI-compatible base URL."
            : provider === "openai"
              ? "OpenAI API base (Chat Completions)."
              : "Anthropic API base URL."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <Input
          id="apiKey"
          name="apiKey"
          type="password"
          autoComplete="off"
          placeholder={
            initial?.hasApiKey
              ? `Stored key ending in ${initial.apiKeyLastFour}`
              : "sk-…"
          }
          className="h-10 border-border bg-background/60 font-mono text-xs"
        />
        <p className="text-xs text-muted-foreground">
          Stored encrypted in Supabase. Leave blank to keep the existing key.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultModel">Default Model</Label>
        <select
          id="defaultModel"
          name="defaultModel"
          value={selectedModel}
          onChange={(event) => setDefaultModel(event.target.value)}
          className={selectClassName}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label}
            </option>
          ))}
        </select>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save provider"}
      </Button>
    </form>
  );
}

const selectClassName = cn(
  "h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "dark:bg-input/30",
);
