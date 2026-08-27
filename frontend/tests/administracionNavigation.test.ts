import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const mainSource = await readFile(new URL("../src/main.tsx", import.meta.url), "utf8");
const sidebarSource = await readFile(
  new URL("../src/components/Sidebar.tsx", import.meta.url),
  "utf8"
);
const pageSource = await readFile(
  new URL(
    "../src/modules/administracion/pages/AdministracionHome.tsx",
    import.meta.url
  ),
  "utf8"
);
const usersHomeSource = await readFile(
  new URL("../src/modules/auth/pages/UsuariosHome.tsx", import.meta.url),
  "utf8"
);
const usersFormSource = await readFile(
  new URL("../src/modules/auth/pages/UsuariosForm.tsx", import.meta.url),
  "utf8"
);

test("protege el panel de administracion para ADMIN", () => {
  assert.match(mainSource, /path: "administracion"[\s\S]*?<ProtectedRoute requiredRole="ADMIN">/);
  assert.match(mainSource, /lazy\(\(\) => import\("@\/modules\/administracion\/pages\/AdministracionHome"\)\)/);
});

test("concentra accesos administrativos en una entrada del menu", () => {
  const adminItems = sidebarSource.match(/const adminItems:[\s\S]*?\];/)?.[0] ?? "";

  assert.match(adminItems, /Administración/);
  assert.match(adminItems, /\/administracion/);
  assert.doesNotMatch(adminItems, /\/usuarios|\/catalogos/);
  assert.match(sidebarSource, /isGestor\(\)[\s\S]*?catalogosItem/);
});

test("presenta informacion accionable sin un contrato backend nuevo", () => {
  assert.match(pageSource, /getUsuarios/);
  assert.match(pageSource, /useUct/);
  assert.match(pageSource, /useDirectivos/);
  assert.match(pageSource, /Atención requerida/);
  assert.match(pageSource, /Próxima etapa/);
  assert.doesNotMatch(pageSource, /\/api\/v1\/administracion\/resumen/);
});

test("ofrece una sola entrada para crear usuarios y retornos consistentes", () => {
  assert.match(pageSource, /title="Crear usuario"/);
  assert.match(pageSource, /to="\/usuarios\/nuevo"/);
  assert.doesNotMatch(usersHomeSource, /Nuevo Usuario|\/usuarios\/nuevo/);
  assert.match(usersHomeSource, /Volver a Administración/);
  assert.match(usersFormSource, /nav\("\/administracion"\)/);
  assert.match(pageSource, /onClick=\{\(\) => navigate\(-1\)\}/);
});
