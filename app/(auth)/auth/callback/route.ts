import { NextResponse } from "next/server";

import { ROUTES } from "@/lib/constants";
import { createClient } from "@/services/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}${ROUTES.home}?auth_error=1`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}${ROUTES.home}?auth_error=1`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let credits = 0;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("id", user.id)
      .maybeSingle();
    credits = profile?.credits_balance ?? 0;
  }

  let destination: string = credits > 0 ? ROUTES.chat : ROUTES.paywall;

  if (
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    isAllowedNext(next, credits > 0)
  ) {
    destination = next;
  }

  return NextResponse.redirect(`${origin}${destination}`);
}

function isAllowedNext(next: string, hasCredits: boolean) {
  if (next.startsWith(ROUTES.paywall)) {
    return true;
  }

  if (
    next.startsWith(ROUTES.chat) ||
    next.startsWith(ROUTES.analytics) ||
    next.startsWith(ROUTES.settings)
  ) {
    return hasCredits;
  }

  return false;
}
