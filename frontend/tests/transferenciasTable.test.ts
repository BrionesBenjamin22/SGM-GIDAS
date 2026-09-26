import assert from "node:assert/strict";
import test from "node:test";
import { formatTransferenciaHistory, presentTransferenciaHistory } from "../src/modules/transferencia/utils/transferenciaHistory.ts";

test("el historial presenta adoptantes por nombre y oculta inicializaciones", () => {
  const event = { id: 1, campo: "adoptantes", valor_nuevo: { accion: "desvincular", detalle: { nombre: "Municipalidad" } } };
  assert.deepEqual(formatTransferenciaHistory(event), { title: "Adoptante desvinculado", description: "Municipalidad" });
  assert.deepEqual(presentTransferenciaHistory([{ id: 2, campo: "accion" }, { id: 3, campo: "monto", valor_anterior: null, valor_nuevo: 100 }, event]), [event]);
  assert.doesNotMatch(formatTransferenciaHistory({ id: 4, campo: "grupo_utn_id", valor_anterior: { id: 1 }, valor_nuevo: { id: 2 } }).description, /\[object Object\]|\bID \d+/);
});
