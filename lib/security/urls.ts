import { DEFAULT_ENDPOINTS } from "@/features/providers/catalog";
import type { ProviderId } from "@/features/providers/types";

const SAFE_LINK_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/** Returns a safe href for markdown/rendered links, or undefined if unsafe. */
export function sanitizeHref(href: string | undefined | null): string | undefined {
  if (!href) return undefined;
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#")) return trimmed;

  try {
    const url = new URL(trimmed, "https://example.invalid");
    if (!SAFE_LINK_PROTOCOLS.has(url.protocol)) return undefined;
    if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;
    return trimmed;
  } catch {
    return undefined;
  }
}

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^0\.0\.0\.0$/,
  /^\[::1\]$/,
  /^::1$/,
  /^169\.254\./,
  /^metadata\.google\.internal$/i,
];

/** Allowed hosts per provider (SSRF guard for BYOK endpoints). */
export const PROVIDER_ALLOWED_HOSTS: Record<ProviderId, string[]> = {
  openai: ["api.openai.com"],
  anthropic: ["api.anthropic.com"],
  kimi: ["api.moonshot.ai", "api.moonshot.cn"],
};

export function assertSafeProviderEndpoint(
  provider: ProviderId,
  endpoint: string,
): string {
  const fallback = DEFAULT_ENDPOINTS[provider];
  const raw = endpoint.trim() || fallback;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Enter a valid provider endpoint URL");
  }

  if (url.protocol !== "https:") {
    throw new Error("Provider endpoint must use HTTPS");
  }

  if (url.username || url.password) {
    throw new Error("Provider endpoint must not include credentials");
  }

  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(host))) {
    throw new Error("Provider endpoint host is not allowed");
  }

  const allowed = PROVIDER_ALLOWED_HOSTS[provider];
  if (!allowed.includes(host)) {
    throw new Error(
      `Endpoint host must be one of: ${allowed.join(", ")}`,
    );
  }

  return url.toString().replace(/\/+$/, "");
}

/** ASCII-safe Content-Disposition filename. */
export function safeContentDispositionFilename(name: string, fallback: string) {
  const cleaned = name
    .replace(/[\r\n"]/g, "")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return cleaned || fallback;
}
