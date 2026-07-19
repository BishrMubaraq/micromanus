import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  isAuthenticatedRoute,
  isProtectedRoute,
  ROUTES,
} from "@/lib/constants";
import type { Database } from "@/types/database";

import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseConfig } from "./env";

/** App routes that require auth + credits > 0 */
function isCreditGatedPath(pathname: string): boolean {
  return isProtectedRoute(pathname);
}

/** Routes that require a session (credits optional) */
function isAuthenticatedPath(pathname: string): boolean {
  return isAuthenticatedRoute(pathname);
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}

/**
 * Next.js 16 proxy (middleware replacement).
 * - Refreshes Supabase session
 * - Unauthenticated users → landing
 * - Authenticated users with 0 credits → paywall (for gated routes)
 * - Webhooks / public APIs pass through
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // Never gate Lemon webhooks or static auth callback logic here beyond cookies.
  if (pathname.startsWith("/api/webhooks")) {
    return supabaseResponse;
  }

  if (!hasSupabaseConfig()) {
    if (isAuthenticatedPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = ROUTES.home;
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
    },
  );

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;

  if (!userId) {
    if (isAuthenticatedPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = ROUTES.home;
      const redirectResponse = NextResponse.redirect(url);
      copyCookies(supabaseResponse, redirectResponse);
      return redirectResponse;
    }
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", userId)
    .maybeSingle();

  const credits = profile?.credits_balance ?? 0;

  if (credits <= 0 && isCreditGatedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.paywall;
    const redirectResponse = NextResponse.redirect(url);
    copyCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  return supabaseResponse;
}
