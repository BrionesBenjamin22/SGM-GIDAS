import assert from "node:assert/strict";
import test from "node:test";

import { getApiErrorMessage, getErrorMessage } from "../src/lib/httpError.ts";

test("lee el mensaje del contrato tipado del backend", () => {
  assert.equal(
    getApiErrorMessage({
      data: null,
      error: { code: "VALIDATION_ERROR", message: "Revise los datos." },
    }),
    "Revise los datos."
  );
});

test("mantiene compatibilidad con contratos heredados", () => {
  assert.equal(getApiErrorMessage({ error: "Error heredado" }), "Error heredado");
  assert.equal(getApiErrorMessage({ message: "Mensaje heredado" }), "Mensaje heredado");
  assert.equal(getApiErrorMessage({ detail: "Detalle heredado" }), "Detalle heredado");
});

test("no refleja respuestas de texto o estructuras desconocidas", () => {
  assert.equal(getApiErrorMessage("SQL connection failed at internal-host"), null);
  assert.equal(getApiErrorMessage({ error: { details: { trace: "secret" } } }), null);
});

test("usa un fallback accionable cuando no existe un mensaje seguro", () => {
  const fallback = "Lo sentimos, no pudimos guardar los cambios. Intente nuevamente.";
  assert.equal(getErrorMessage({ body: "proxy failure" }, fallback), fallback);
  assert.equal(
    getErrorMessage({ body: { error: { message: "Conflicto de estado" } } }, fallback),
    "Conflicto de estado"
  );
});
