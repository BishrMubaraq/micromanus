import { z } from "zod";

import { PROVIDER_IDS } from "@/features/providers/types";

export const providerSettingsSchema = z.object({
  provider: z.enum(PROVIDER_IDS),
  endpoint: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.string().url().safeParse(value).success,
      "Enter a valid endpoint URL",
    ),
  apiKey: z.string().optional(),
  defaultModel: z.string().min(1, "Select a default model"),
});

export type ProviderSettingsInput = z.infer<typeof providerSettingsSchema>;
