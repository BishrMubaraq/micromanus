export const APP_NAME = "MicroManus";
export const APP_DESCRIPTION =
  "MicroManus is a premium AI deep-research workspace — plan, search, and ship grounded answers with clarity.";
export const APP_TAGLINE = "Deep research, without the noise.";
export const APP_INITIALS = "MM";

export const ROUTES = {
  home: "/",
  chat: "/chat",
  analytics: "/analytics",
  settings: "/settings",
  paywall: "/paywall",
  authCallback: "/auth/callback",
} as const;

export const PROTECTED_ROUTES = [
  ROUTES.chat,
  ROUTES.analytics,
  ROUTES.settings,
] as const;

export const AUTHENTICATED_ROUTES = [
  ...PROTECTED_ROUTES,
  ROUTES.paywall,
] as const;

export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isAuthenticatedRoute(pathname: string): boolean {
  return (
    isProtectedRoute(pathname) ||
    pathname === ROUTES.paywall ||
    pathname.startsWith(`${ROUTES.paywall}/`)
  );
}
