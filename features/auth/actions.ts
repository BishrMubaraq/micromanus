"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { ROUTES } from "@/lib/constants";
import { env } from "@/lib/env";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  authModeSchema,
  emailPasswordSchema,
  oauthProviderSchema,
  type OAuthProvider,
} from "@/lib/validations/auth";
import { createClient } from "@/services/supabase/server";

export type AuthFormState = {
  error: string | null;
  message: string | null;
};

function getAppUrl(headerStore: Headers): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    headerStore.get("origin") ??
    env.appUrl
  );
}

function authRateLimited(headerStore: Headers, email: string): boolean {
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown";
  const result = rateLimit({
    key: `auth:${ip}:${email.toLowerCase()}`,
    ...RATE_LIMITS.auth,
  });
  return !result.success;
}

async function redirectAfterAuth(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", userId)
    .maybeSingle();

  const credits = profile?.credits_balance ?? 0;
  redirect(credits > 0 ? ROUTES.chat : ROUTES.paywall);
}

export async function signInWithOAuth(provider: OAuthProvider) {
  const parsed = oauthProviderSchema.safeParse(provider);
  if (!parsed.success) {
    throw new Error("Invalid OAuth provider");
  }

  const headerStore = await headers();
  const appUrl = getAppUrl(headerStore);
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

export async function authenticateWithPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const modeParsed = authModeSchema.safeParse(formData.get("mode"));
  const parsed = emailPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!modeParsed.success || !parsed.success) {
    return {
      error: parsed.success
        ? "Invalid auth mode"
        : (parsed.error.issues[0]?.message ?? "Invalid credentials"),
      message: null,
    };
  }

  const headerStore = await headers();
  const { email, password } = parsed.data;
  if (authRateLimited(headerStore, email)) {
    return {
      error: "Too many attempts. Please wait a moment and try again.",
      message: null,
    };
  }

  const supabase = await createClient();
  const mode = modeParsed.data;

  if (mode === "sign_in") {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return {
        error: error?.message ?? "Unable to sign in",
        message: null,
      };
    }

    await redirectAfterAuth(data.user.id);
  }

  const appUrl = getAppUrl(headerStore);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}${ROUTES.authCallback}`,
    },
  });

  if (error) {
    return {
      error: error.message,
      message: null,
    };
  }

  // Session present when email confirmation is disabled (recommended for local testing).
  if (data.session?.user) {
    await redirectAfterAuth(data.session.user.id);
  }

  return {
    error: null,
    message:
      "Account created. Confirm your email if required, then sign in. For faster local testing, disable email confirmation in Supabase Auth settings.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(ROUTES.home);
}
