"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { WELCOME_CREDITS } from "@/lib/env";
import { createAdminClient } from "@/services/supabase/admin";
import { grantCreditsWithAdmin } from "@/services/credits";
import { createClient } from "@/services/supabase/server";

/** Interim helper so existing zero-credit accounts can enter the workspace. */
export async function grantTestCredits() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const admin = createAdminClient();
  await grantCreditsWithAdmin(admin, {
    userId: user.id,
    delta: WELCOME_CREDITS,
    reason: "grant",
    metadata: { source: "settings_test_grant" },
  });

  revalidatePath("/settings");
  revalidatePath("/chat");
  revalidatePath("/paywall");
  revalidatePath("/");
  redirect(ROUTES.chat);
}
