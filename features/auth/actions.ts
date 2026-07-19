"use server";

import { redirect } from "next/navigation";

import { getAppUrl } from "@/lib/app-url";
import { ROUTES } from "@/lib/constants";
import {
  oauthProviderSchema,
  type OAuthProvider,
} from "@/lib/validations/auth";
import { createClient } from "@/services/supabase/server";

export async function signInWithOAuth(provider: OAuthProvider) {
  const parsed = oauthProviderSchema.safeParse(provider);
  if (!parsed.success) {
    throw new Error("Invalid OAuth provider");
  }

  const appUrl = getAppUrl();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: parsed.data,
    options: {
      redirectTo: `${appUrl}${ROUTES.authCallback}`,
    },
  });

  if (error || !data.url) {
    throw error ?? new Error("Failed to start OAuth flow");
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.home);
}
