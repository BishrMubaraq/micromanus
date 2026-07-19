import { env } from "@/lib/env";

/** Canonical app origin — never trust request Origin for redirects. */
export function getAppUrl(): string {
  return env.appUrl.replace(/\/+$/, "");
}
