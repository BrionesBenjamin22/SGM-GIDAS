import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildDraftKey,
  readFormDraft,
  sanitizeDraftValue,
  saveFormDraft,
  type FormDraft,
} from "@/modules/shared/utils/formDraft";

type Params<T> = {
  userId: number | undefined;
  module: string;
  recordId?: string | number;
  value: T;
  ready?: boolean;
  hasContent: (value: T) => boolean;
  onRestore: (value: T) => void;
};

export function useFormDraft<T>({
  userId,
  module,
  recordId,
  value,
  ready = true,
  hasContent,
  onRestore,
}: Params<T>) {
  const key = useMemo(
    () => userId ? buildDraftKey(userId, module, recordId) : null,
    [module, recordId, userId]
  );
  const [availableDraft, setAvailableDraft] = useState<FormDraft<T> | null>(null);
  const [canSave, setCanSave] = useState(false);
  const baseline = useRef("");
  const valueRef = useRef(value);
  const restoreRef = useRef(onRestore);
  const hasContentRef = useRef(hasContent);
  restoreRef.current = onRestore;
  hasContentRef.current = hasContent;
  valueRef.current = value;

  const serializedValue = useMemo(
    () => JSON.stringify(sanitizeDraftValue(value)),
    [value]
  );

  useEffect(() => {
    setAvailableDraft(null);
    setCanSave(false);
    if (!key || !ready) return;

    baseline.current = serializedValue;
    const draft = readFormDraft<T>(localStorage, key);
    setAvailableDraft(draft);
    setCanSave(!draft);
  }, [key, ready]);

  useEffect(() => {
    if (!key || !ready || !canSave || serializedValue === baseline.current) return;
    const timer = window.setTimeout(() => {
      if (hasContentRef.current(valueRef.current)) {
        saveFormDraft(localStorage, key, valueRef.current);
      }
      else localStorage.removeItem(key);
      baseline.current = serializedValue;
    }, 600);
    return () => window.clearTimeout(timer);
  }, [canSave, key, ready, serializedValue]);

  const restoreDraft = useCallback(() => {
    if (!availableDraft) return;
    restoreRef.current(availableDraft.data);
    setAvailableDraft(null);
    setCanSave(true);
  }, [availableDraft]);

  const discardDraft = useCallback(() => {
    if (key) localStorage.removeItem(key);
    baseline.current = serializedValue;
    setAvailableDraft(null);
    setCanSave(true);
  }, [key, serializedValue]);

  const clearDraft = useCallback(() => {
    if (key) localStorage.removeItem(key);
    baseline.current = serializedValue;
    setAvailableDraft(null);
  }, [key, serializedValue]);

  return { availableDraft, restoreDraft, discardDraft, clearDraft };
}
