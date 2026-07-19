"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [showApiKey, setShowApiKey] = useState(false);
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
      <input type="hidden" name="provider" value={provider} />
      <input type="hidden" name="defaultModel" value={selectedModel} />

      <div className="space-y-2">
        <Label htmlFor="provider">Provider</Label>
        <Select
          value={provider}
          onValueChange={(value) => handleProviderChange(value as ProviderId)}
        >
          <SelectTrigger id="provider" className="w-full">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_IDS.map((id) => (
              <SelectItem key={id} value={id}>
                {PROVIDER_LABELS[id]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            ? "Must be api.moonshot.ai or api.moonshot.cn (HTTPS)."
            : provider === "openai"
              ? "Must be api.openai.com (HTTPS)."
              : "Must be api.anthropic.com (HTTPS)."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key</Label>
        <div className="relative">
          <Input
            id="apiKey"
            name="apiKey"
            type={showApiKey ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            placeholder={
              initial?.hasApiKey
                ? `Stored key ending in ${initial.apiKeyLastFour}`
                : "sk-…"
            }
            className="h-10 border-border bg-background/60 pr-10 font-mono text-xs"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowApiKey((value) => !value)}
            aria-label={showApiKey ? "Hide API key" : "Show API key"}
            aria-pressed={showApiKey}
          >
            {showApiKey ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Your key is encrypted and stored securely. Leave blank to keep your
          existing key.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="defaultModel">Default Model</Label>
        <Select value={selectedModel} onValueChange={setDefaultModel}>
          <SelectTrigger id="defaultModel" className="w-full">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
