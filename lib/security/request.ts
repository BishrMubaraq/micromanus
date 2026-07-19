import { env } from "@/lib/env";

/**
 * Same-origin guard for cookie-authenticated mutating API routes.
 * Rejects cross-site POSTs that would otherwise burn credits via CSRF.
 */
export function assertSameOrigin(request: Request): Response | null {
  const appUrl = env.appUrl.replace(/\/+$/, "");
  let expected: URL;
  try {
    expected = new URL(appUrl);
  } catch {
    return new Response("App URL is misconfigured", { status: 500 });
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const incoming = new URL(origin);
      if (
        incoming.protocol === expected.protocol &&
        incoming.host === expected.host
      ) {
        return null;
      }
    } catch {
      return new Response("Invalid origin", { status: 403 });
    }
    return new Response("Forbidden origin", { status: 403 });
  }

  // Non-browser clients may omit Origin; require a matching Referer host.
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const incoming = new URL(referer);
      if (
        incoming.protocol === expected.protocol &&
        incoming.host === expected.host
      ) {
        return null;
      }
    } catch {
      return new Response("Invalid referer", { status: 403 });
    }
    return new Response("Forbidden referer", { status: 403 });
  }

  // Allow server-to-server / curl in development only.
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return new Response("Missing origin", { status: 403 });
}

/** Sanitize error text returned to clients. */
export function publicErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const message = error.message.trim();
  if (!message) return fallback;
  // Avoid leaking upstream API keys / stack-like payloads.
  if (/api[_-]?key|sk-|bearer|password|secret/i.test(message)) {
    return fallback;
  }
  if (message.length > 280) {
    return fallback;
  }
  return message;
}
