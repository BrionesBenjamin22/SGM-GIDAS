import assert from "node:assert/strict";
import test from "node:test";
import {
  formatFecha,
  formatFechaHora,
  getCivilYear,
  parseApiTimestamp,
  parseCivilDate,
  toCivilDateString,
} from "../src/utils/dateTime.ts";

process.env.TZ = "America/Argentina/Buenos_Aires";

test("mantiene una fecha civil de inicio de año en Argentina", () => {
  assert.equal(formatFecha("2026-01-01"), "01/01/2026");
  assert.equal(getCivilYear("2026-01-01"), 2026);
});

test("mantiene una fecha civil de fin de año en Argentina", () => {
  assert.equal(formatFecha("2026-12-31"), "31/12/2026");
  assert.equal(toCivilDateString(parseCivilDate("2026-12-31")), "2026-12-31");
});

test("rechaza fechas civiles inexistentes", () => {
  assert.equal(parseCivilDate("2026-02-31"), null);
  assert.equal(formatFecha("2026-02-31"), "—");
});

test("interpreta timestamps sin zona del contrato heredado como UTC", () => {
  const parsed = parseApiTimestamp("2026-09-07T02:13:31");
  assert.equal(
    parsed?.toISOString(),
    "2026-09-07T02:13:31.000Z"
  );
  assert.equal(parsed?.getDate(), 6);
  assert.equal(parsed?.getHours(), 23);
  assert.equal(
    formatFechaHora("2026-09-07T02:13:31"),
    new Date("2026-09-07T02:13:31Z").toLocaleString("es-AR")
  );
});

test("respeta timestamps que ya incluyen una zona explícita", () => {
  assert.equal(
    parseApiTimestamp("2026-09-07T02:13:31-03:00")?.toISOString(),
    "2026-09-07T05:13:31.000Z"
  );
});
