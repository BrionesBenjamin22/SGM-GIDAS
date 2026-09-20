import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { formatProyectoHistoryEntry, presentProyectoHistoryItem } from "../src/modules/proyectos/utils/proyectoHistory.ts";

test("el historial de Proyectos presenta cambios y relaciones sin JSON", () => {
  assert.deepEqual(
    formatProyectoHistoryEntry({ id: 1, campo: "nombre_proyecto", valor_anterior: "Anterior", valor_nuevo: "Actual" }),
    { title: "Nombre del proyecto", description: "Anterior → Actual" }
  );
  assert.deepEqual(
    formatProyectoHistoryEntry({ id: 2, campo: "investigadores_ids", valor_nuevo: { accion: "vincular", detalle: { id: 7, nombre_apellido: "Ada Lovelace" } } }),
    { title: "Investigador vinculado", description: "Ada Lovelace" }
  );
  assert.deepEqual(
    presentProyectoHistoryItem(
      { id: 3, campo: "becarios_ids", valor_nuevo: { accion: "vincular", detalle: { id: 2 } } },
      { becarios: [{ id: 2, nombre_apellido: "Grace Hopper" }] }
    ),
    { id: 3, campo: "Becario vinculado", valor_anterior: null, valor_nuevo: "Grace Hopper" }
  );
});

test("Proyectos usa la tabla comun y nomenclatura de acciones consistente", () => {
  const home = readFileSync("src/modules/proyectos/pages/ProyectosHome.tsx", "utf8");
  const field = readFileSync("src/modules/proyectos/components/PersonalProyectoField.tsx", "utf8");

  assert.match(home, /<Table/);
  assert.match(home, />Agregar nuevo<\/Button>/);
  assert.match(home, /title="Editar"/);
  assert.match(home, /title="Cerrar"/);
  assert.match(home, /title="Reabrir"/);
  assert.match(field, /import \{ X \} from "lucide-react"/);
  assert.match(field, /title="Quitar"/);
  assert.doesNotMatch(field, />\s*[Ã—✕xX]\s*<\/Button>/);
});
