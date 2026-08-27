import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const mainSource = await readFile(new URL("../src/main.tsx", import.meta.url), "utf8");
const sidebarSource = await readFile(new URL("../src/components/Sidebar.tsx", import.meta.url), "utf8");
const layoutSource = await readFile(new URL("../src/layouts/AppLayout.tsx", import.meta.url), "utf8");
const pageSource = await readFile(
  new URL("../src/modules/administracion/pages/AdministracionHome.tsx", import.meta.url),
  "utf8"
);
const usersHomeSource = await readFile(new URL("../src/modules/auth/pages/UsuariosHome.tsx", import.meta.url), "utf8");
const usersFormSource = await readFile(new URL("../src/modules/auth/pages/UsuariosForm.tsx", import.meta.url), "utf8");

test("protege el panel de administracion para ADMIN", () => {
  assert.match(mainSource, /path: "administracion"[\s\S]*?<ProtectedRoute requiredRole="ADMIN">/);
  assert.match(mainSource, /lazy\(\(\) => import\("@\/modules\/administracion\/pages\/AdministracionHome"\)\)/);
});

test("limita el menu administrativo a inicio, administracion y busqueda", () => {
  const adminItems = sidebarSource.match(/const adminItems:[\s\S]*?\];/)?.[0] ?? "";

  assert.match(adminItems, /Inicio/);
  assert.match(adminItems, /Administración/);
  assert.match(adminItems, /Búsqueda/);
  assert.match(adminItems, /\/inicio/);
  assert.match(adminItems, /\/administracion/);
  assert.match(adminItems, /\/busqueda/);
  assert.doesNotMatch(adminItems, /\/usuarios|\/catalogos/);
  assert.match(sidebarSource, /isAdmin\(\)[\s\S]*?\? adminItems/);
  assert.match(sidebarSource, /isGestor\(\)[\s\S]*?catalogosItem/);
});

test("ubica las acciones de usuario en el pie del menu lateral", () => {
  assert.match(sidebarSource, /user\?\.nombre_usuario/);
  assert.match(sidebarSource, /user\?\.mail/);
  assert.match(sidebarSource, /Mi perfil/);
  assert.match(sidebarSource, /Cambiar contraseña/);
  assert.match(sidebarSource, /Cerrar sesión/);
  assert.match(sidebarSource, /await logout\(\)/);
});

test("despliega las opciones del perfil desde el icono superior", () => {
  assert.match(layoutSource, /aria-label="Abrir opciones del perfil"/);
  assert.match(layoutSource, /aria-expanded=\{isProfileOpen\}/);
  assert.match(layoutSource, /Mi perfil/);
  assert.match(layoutSource, /Cambiar contraseña/);
  assert.match(layoutSource, /Cerrar sesión/);
  assert.match(layoutSource, /closeOnOutsideClick/);
  assert.match(layoutSource, /event\.key === "Escape"/);
  assert.match(layoutSource, /await logout\(\)/);
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
