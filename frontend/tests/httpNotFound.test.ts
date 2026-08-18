import assert from "node:assert/strict";
import test from "node:test";
import { allowsNotFound } from "../src/lib/httpPolicy.ts";

test("mantiene compatibilidad nullable para lecturas GET", () => {
  assert.equal(allowsNotFound(), true);
  assert.equal(allowsNotFound({ method: "GET" }), true);
});

test("los 404 de mutaciones se tratan como errores", () => {
  assert.equal(allowsNotFound({ method: "POST" }), false);
  assert.equal(allowsNotFound({ method: "PUT" }), false);
  assert.equal(allowsNotFound({ method: "DELETE" }), false);
});

test("allowNotFound permite declarar la semantica de forma explicita", () => {
  assert.equal(allowsNotFound({ method: "GET", allowNotFound: false }), false);
  assert.equal(allowsNotFound({ method: "POST", allowNotFound: true }), true);
});
