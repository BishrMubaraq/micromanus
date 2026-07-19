type NameSource = {
  fullName?: string | null;
  metadata?: Record<string, unknown> | null;
};

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Resolve a display name from profile + GitHub/OAuth metadata. */
export function resolveDisplayName(source: NameSource): string | null {
  const meta = source.metadata ?? {};
  return (
    asNonEmptyString(source.fullName) ??
    asNonEmptyString(meta.full_name) ??
    asNonEmptyString(meta.name) ??
    asNonEmptyString(meta.user_name) ??
    asNonEmptyString(meta.preferred_username) ??
    null
  );
}
