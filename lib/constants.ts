export const APP_NAME = "MicroManus";
export const APP_DESCRIPTION =
  "AI Deep Research Workspace — minimal, fast, and built for serious work.";

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
