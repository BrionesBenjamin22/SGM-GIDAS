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
  const keyRef = useRef(key);
  const readyRef = useRef(ready);
  const canSaveRef = useRef(canSave);
  restoreRef.current = onRestore;
  hasContentRef.current = hasContent;
  valueRef.current = value;
  keyRef.current = key;
  readyRef.current = ready;
  canSaveRef.current = canSave;

  const serializedValue = useMemo(
    () => JSON.stringify(sanitizeDraftValue(value)),
    [value]
  );

  useEffect(() => {
    setAvailableDraft(null);
    setCanSave(false);
    canSaveRef.current = false;
    if (!key || !ready) return;

    baseline.current = serializedValue;
    const draft = readFormDraft<T>(localStorage, key);
    setAvailableDraft(draft);
    setCanSave(!draft);
    canSaveRef.current = !draft;
  }, [key, ready]);

  const flushDraft = useCallback(() => {
    const activeKey = keyRef.current;
    if (!activeKey || !readyRef.current || !canSaveRef.current) return;

    const currentValue = valueRef.current;
    const currentSerializedValue = JSON.stringify(sanitizeDraftValue(currentValue));
    if (currentSerializedValue === baseline.current) return;

    if (hasContentRef.current(currentValue)) {
      saveFormDraft(localStorage, activeKey, currentValue);
    }
    else localStorage.removeItem(activeKey);
    baseline.current = currentSerializedValue;
  }, []);

  useEffect(() => {
    if (!key || !ready || !canSave || serializedValue === baseline.current) return;
    const timer = window.setTimeout(flushDraft, 600);
    return () => window.clearTimeout(timer);
  }, [canSave, flushDraft, key, ready, serializedValue]);

  useEffect(() => {
    window.addEventListener("pagehide", flushDraft);
    return () => {
      window.removeEventListener("pagehide", flushDraft);
      flushDraft();
    };
  }, [flushDraft]);

  const restoreDraft = useCallback(() => {
    if (!availableDraft) return;
    restoreRef.current(availableDraft.data);
    setAvailableDraft(null);
    setCanSave(true);
    canSaveRef.current = true;
  }, [availableDraft]);

  const discardDraft = useCallback(() => {
    if (key) localStorage.removeItem(key);
    baseline.current = serializedValue;
    setAvailableDraft(null);
    setCanSave(true);
    canSaveRef.current = true;
  }, [key, serializedValue]);

  const clearDraft = useCallback(() => {
    if (key) localStorage.removeItem(key);
    baseline.current = serializedValue;
    setAvailableDraft(null);
  }, [key, serializedValue]);

  return { availableDraft, restoreDraft, discardDraft, clearDraft };
}
