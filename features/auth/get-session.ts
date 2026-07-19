import { resolveDisplayName } from "@/lib/user-display";
import { createClient } from "@/services/supabase/server";
import type { Profile } from "@/types/database";

export type SessionUser = {
  id: string;
  email: string | null;
};

export type AppSession = {
  user: SessionUser;
  profile: Profile | null;
  displayName: string | null;
};

export async function getSession(): Promise<AppSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const displayName = resolveDisplayName({
    fullName: profile?.full_name,
    metadata,
  });

  // Backfill profile name/avatar from OAuth metadata when missing.
  if (profile && displayName && !profile.full_name) {
    const avatar =
      profile.avatar_url ||
      (typeof metadata.avatar_url === "string" ? metadata.avatar_url : null);

    const { error: syncError } = await supabase
      .from("profiles")
      .update({
        full_name: displayName,
        ...(avatar && !profile.avatar_url ? { avatar_url: avatar } : {}),
      })
      .eq("id", user.id);

    if (!syncError) {
      profile.full_name = displayName;
      if (avatar && !profile.avatar_url) {
        profile.avatar_url = avatar;
      }
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    profile,
    displayName: displayName ?? profile?.full_name ?? null,
  };
}

export async function requireSession(): Promise<AppSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
