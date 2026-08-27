export type ApiErrorBody = {
  error?:
    | string
    | {
        code?: unknown;
        message?: unknown;
        details?: unknown;
      }
    | null;
  message?: unknown;
  detail?: unknown;
};

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getApiErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;

  const parsed = body as ApiErrorBody;
  if (parsed.error && typeof parsed.error === "object") {
    const nestedMessage = nonEmptyString(parsed.error.message);
    if (nestedMessage) return nestedMessage;
  }

  return (
    nonEmptyString(parsed.error) ??
    nonEmptyString(parsed.message) ??
    nonEmptyString(parsed.detail)
  );
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;

  const candidate = error as { body?: unknown; message?: unknown };
  return (
    getApiErrorMessage(candidate.body) ??
    nonEmptyString(candidate.message) ??
    fallback
  );
}
