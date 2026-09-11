import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildDraftKey,
  readFormDraft,
  removeFormDraft,
  saveFormDraft,
} from "../src/modules/shared/utils/formDraft.ts";

const hookSource = readFileSync(
  new URL("../src/modules/shared/hooks/useFormDraft.ts", import.meta.url),
  "utf8"
);
const recoveryNoticeSource = readFileSync(
  new URL("../src/modules/shared/components/DraftRecoveryNotice.tsx", import.meta.url),
  "utf8"
);

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

test("guarda y recupera un borrador aislado por usuario modulo y registro", () => {
  const storage = new MemoryStorage();
  const key = buildDraftKey(42, "proyectos", 7);
  saveFormDraft(storage, key, { nombre: "Proyecto", relaciones: [2, 5] });

  const draft = readFormDraft<{ nombre: string; relaciones: number[] }>(storage, key);
  assert.deepEqual(draft?.data, { nombre: "Proyecto", relaciones: [2, 5] });
  assert.equal(draft?.version, 1);
});

test("omite credenciales y tokens incluso en objetos anidados", () => {
  const storage = new MemoryStorage();
  const key = buildDraftKey(9, "uct");
  saveFormDraft(storage, key, {
    nombre: "UCT",
    accessToken: "no-guardar",
    nested: { password: "no-guardar", objetivo: "Investigar" },
  });

  assert.deepEqual(readFormDraft<Record<string, unknown>>(storage, key)?.data, {
    nombre: "UCT",
    nested: { objetivo: "Investigar" },
  });
});

test("el descarte o guardado exitoso elimina el borrador", () => {
  const storage = new MemoryStorage();
  const key = buildDraftKey(1, "proyectos", "new");
  saveFormDraft(storage, key, { nombre: "Temporal" });
  removeFormDraft(storage, key);
  assert.equal(readFormDraft(storage, key), null);
});

test("fuerza el guardado pendiente al abandonar o desmontar el formulario", () => {
  assert.match(hookSource, /window\.addEventListener\("pagehide", flushDraft\)/);
  assert.match(
    hookSource,
    /window\.removeEventListener\("pagehide", flushDraft\);\s+flushDraft\(\);/
  );
  assert.match(hookSource, /window\.setTimeout\(flushDraft, 600\)/);
});

test("exige resolver el borrador antes de interactuar con el formulario", () => {
  assert.match(recoveryNoticeSource, /<dialog/);
  assert.match(recoveryNoticeSource, /dialog\.showModal\(\)/);
  assert.match(recoveryNoticeSource, /role="alertdialog"/);
  assert.match(recoveryNoticeSource, /aria-modal="true"/);
  assert.match(recoveryNoticeSource, /event\.preventDefault\(\)/);
});
