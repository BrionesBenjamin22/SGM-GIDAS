import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { transformSync } from "esbuild";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { applyFieldErrors, focusFieldErrors, getApiErrorMessage, getApiFieldErrors, getErrorMessage, mapFieldErrors } from "../src/lib/httpError.ts";

test("Field muestra el error junto al control sin duplicar el mensaje heredado", () => {
  const source = readFileSync(new URL("../src/components/Field.tsx", import.meta.url), "utf8");
  const compiled = transformSync(source, { loader: "tsx", format: "cjs", jsx: "automatic" }).code;
  const module = { exports: {} as { default: React.ComponentType<Record<string, unknown>> } };
  runInNewContext(compiled, { module, exports: module.exports, require: createRequire(import.meta.url) });
  const Field = module.exports.default;
  const error = "Use letras y números.";
  const control = createElement("input", { name: "codigoProyecto" });
  const markup = renderToStaticMarkup(createElement(Field, { label: "Código", name: "codigoProyecto", error }, control));
  assert.match(markup, /data-error-field="codigoProyecto"/);
  assert.match(markup, /role="alert"/);
  assert.ok(markup.indexOf("<input") < markup.indexOf(error));
  const legacy = renderToStaticMarkup(createElement(Field, { label: "Código", name: "codigoProyecto", error },
    control, createElement("p", {}, error)));
  assert.equal(legacy.split(error).length - 1, 1);
  const initial = renderToStaticMarkup(createElement(Field, { label: "Código", name: "codigoProyecto" }, control));
  assert.doesNotMatch(initial, /role="alert"|border-rose-500/);
});

test("mapea campos y conserva los errores desconocidos", () => {
  const error = { body: { error: { details: { fields: {
    codigo_proyecto: "Use letras y números.",
    id_investigador: "Seleccione un investigador disponible.",
    campo_futuro: "Revise la selección.",
  } } } } };
  assert.deepEqual(mapFieldErrors(error, ["codigoProyecto", "investigadoresIds"]), {
    codigoProyecto: "Use letras y números.", investigadoresIds: "Seleccione un investigador disponible.",
  });
  assert.equal(Object.keys(getApiFieldErrors(error)).length, 3);
  assert.deepEqual(mapFieldErrors({ body: { fields: { mail: "Revise el correo." } } }, ["email"]), { email: "Revise el correo." });
});

test("descarta detalles técnicos y muestra una referencia segura", () => {
  const fallback = "Intente nuevamente.";
  assert.equal(getErrorMessage({ body: { error: { message: "SELECT password FROM users", details: { request_id: "req-09" } } } }, fallback),
    "Intente nuevamente. Referencia de seguimiento: req-09.");
  assert.equal(getErrorMessage({ body: { requestId: "<script>" } }, fallback), fallback);
  assert.deepEqual(getApiFieldErrors({ body: { fields: { nombre: "SQLAlchemy column secret", mail: 123 } } }), {});
});

test("puede ocultar la referencia interna sin perder el mensaje seguro", () => {
  const fallback = "Lo sentimos, no pudimos guardar los cambios. Intente nuevamente.";
  const error = {
    body: {
      error: {
        message: "Revise la fecha de presentación e intente nuevamente.",
        details: { request_id: "req-interno-17" },
      },
    },
  };

  assert.equal(
    getErrorMessage(error, fallback, { includeTrackingReference: false }),
    "Revise la fecha de presentación e intente nuevamente.",
  );
  assert.equal(
    getErrorMessage(
      { body: { error: { message: "SELECT password FROM users", details: { request_id: "req-interno-17" } } } },
      fallback,
      { includeTrackingReference: false },
    ),
    fallback,
  );
});

test("enfoca el primer campo inválido en el orden visual", () => {
  const previous = globalThis.requestAnimationFrame;
  const focused: string[] = [];
  globalThis.requestAnimationFrame = callback => { callback(0); return 0; };
  try {
    const root = { querySelectorAll: () => ["nombre", "codigoProyecto", "fechaFin"].map(name => ({
      dataset: { errorField: name }, querySelector: () => ({ focus: () => focused.push(name) }),
    })) } as unknown as ParentNode;
    focusFieldErrors({ fechaFin: "Revise la fecha.", codigoProyecto: "Use letras y números." }, root);
    assert.deepEqual(focused, ["codigoProyecto"]);
  } finally { globalThis.requestAnimationFrame = previous; }
});

test("un error sin control conocido conserva el aviso general", () => {
  let updated = false;
  assert.equal(applyFieldErrors({ body: { fields: { desconocido: "Revise el valor." } } },
    () => { updated = true; }, ["nombre"]), false);
  assert.equal(updated, false);
});

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
