const DRAFT_PREFIX = "gidas:form-draft:v1";
const SENSITIVE_KEY = /(token|password|contrase(?:n|ñ)a|secret|credential|authorization)/i;

export type FormDraft<T> = {
  version: 1;
  savedAt: string;
  data: T;
};

export function buildDraftKey(userId: number, module: string, recordId?: string | number) {
  const safeModule = module.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  return `${DRAFT_PREFIX}:${userId}:${safeModule}:${recordId ?? "new"}`;
}

export function sanitizeDraftValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeDraftValue);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SENSITIVE_KEY.test(key))
      .map(([key, child]) => [key, sanitizeDraftValue(child)])
  );
}

export function saveFormDraft<T>(storage: Storage, key: string, data: T) {
  const draft: FormDraft<unknown> = {
    version: 1,
    savedAt: new Date().toISOString(),
    data: sanitizeDraftValue(data),
  };
  storage.setItem(key, JSON.stringify(draft));
}

export function readFormDraft<T>(storage: Storage, key: string): FormDraft<T> | null {
  try {
    const parsed = JSON.parse(storage.getItem(key) ?? "null") as Partial<FormDraft<T>> | null;
    if (!parsed || parsed.version !== 1 || !parsed.savedAt || !("data" in parsed)) return null;
    return parsed as FormDraft<T>;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

export function removeFormDraft(storage: Storage, key: string) {
  storage.removeItem(key);
}
