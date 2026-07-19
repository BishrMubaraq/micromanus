import { createClient } from "@/services/supabase/server";
import type { Profile } from "@/types/database";

export type SessionUser = {
  id: string;
  email: string | null;
};

export type AppSession = {
  user: SessionUser;
  profile: Profile | null;
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

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    profile,
  };
}

export async function requireSession(): Promise<AppSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
