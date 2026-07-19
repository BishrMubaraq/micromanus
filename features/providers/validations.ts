import { z } from "zod";

import { PROVIDER_IDS } from "@/features/providers/types";
import { assertSafeProviderEndpoint } from "@/lib/security/urls";

export const providerSettingsSchema = z
  .object({
    provider: z.enum(PROVIDER_IDS),
    endpoint: z.string().trim(),
    apiKey: z.string().optional(),
    defaultModel: z.string().min(1, "Select a default model"),
  })
  .superRefine((value, ctx) => {
    try {
      assertSafeProviderEndpoint(value.provider, value.endpoint);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        path: ["endpoint"],
        message:
          error instanceof Error
            ? error.message
            : "Enter a valid provider endpoint URL",
      });
    }
  });

export type ProviderSettingsInput = z.infer<typeof providerSettingsSchema>;
