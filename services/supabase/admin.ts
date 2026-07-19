import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env";

/** Service-role client. Server-only — never import from Client Components. */
export function createAdminClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
