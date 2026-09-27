import assert from "node:assert/strict";
import test from "node:test";
import { excedeSaldoDisponible } from "../src/modules/recursos/utils/movimientoSaldo.ts";

test("un egreso igual al saldo disponible puede guardarse y uno superior no", () => {
  assert.equal(excedeSaldoDisponible("91.00", "91.00"), false);
  assert.equal(excedeSaldoDisponible("91.01", "91.00"), true);
  assert.equal(excedeSaldoDisponible("0.01", "0.00"), true);
});

test("al editar un egreso se reintegra su monto anterior antes de comparar", () => {
  assert.equal(excedeSaldoDisponible("250.00", "200.00", "50.00"), false);
  assert.equal(excedeSaldoDisponible("250.01", "200.00", "50.00"), true);
  assert.equal(excedeSaldoDisponible("40.00", "0.00", "50.00"), false);
});

test("compara centavos exactos aun con importes grandes", () => {
  assert.equal(excedeSaldoDisponible("9999999999999999.01", "9999999999999999.00"), true);
});
