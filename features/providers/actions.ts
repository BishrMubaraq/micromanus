"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/features/auth/get-session";
import { providerSettingsSchema } from "@/features/providers/validations";
import { upsertUserProvider } from "@/services/providers";

export type ProviderFormState = {
  error: string | null;
  success: boolean;
};

export async function saveProviderSettings(
  _prev: ProviderFormState,
  formData: FormData,
): Promise<ProviderFormState> {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized", success: false };
  }

  const parsed = providerSettingsSchema.safeParse({
    provider: formData.get("provider"),
    endpoint: formData.get("endpoint") ?? "",
    apiKey: formData.get("apiKey") || undefined,
    defaultModel: formData.get("defaultModel"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid provider settings",
      success: false,
    };
  }

  try {
    await upsertUserProvider({
      userId: session.user.id,
      provider: parsed.data.provider,
      endpoint: parsed.data.endpoint,
      defaultModel: parsed.data.defaultModel,
      apiKey: parsed.data.apiKey,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to save provider settings",
      success: false,
    };
  }

  revalidatePath("/settings");
  revalidatePath("/chat");
  return { error: null, success: true };
}
