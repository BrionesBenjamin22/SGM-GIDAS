import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function isPagesPath(path: string): boolean {
  return path.split(/[\\/]/).includes("pages");
}

function tsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.name.endsWith(".tsx") ? [path] : [];
  });
}

test("los formularios de captura usan validacion controlada", () => {
  const modulesDirectory = join(process.cwd(), "src", "modules");
  const forms = tsxFiles(modulesDirectory).filter((path) => {
    const source = readFileSync(path, "utf8");
    return (
      isPagesPath(path) &&
      source.includes("<form") &&
      !path.endsWith(join("search", "pages", "SearchPage.tsx"))
    );
  });

  assert.ok(forms.length > 0);
  for (const path of forms) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /<form[\s\S]{0,120}?noValidate/, `${path} debe usar noValidate`);
  }
});

test("detecta formularios dentro de pages en Windows y Linux", () => {
  assert.equal(isPagesPath("src\\modules\\personal\\pages\\PersonalForm.tsx"), true);
  assert.equal(isPagesPath("src/modules/personal/pages/PersonalForm.tsx"), true);
  assert.equal(isPagesPath("src/modules/personal/components/PersonalForm.tsx"), false);
});

test("personal muestra etiquetas claras y el error de catalogo profesional", () => {
  const pages = join(process.cwd(), "src", "modules", "personal", "pages");
  const selector = readFileSync(join(pages, "PersonalForm.tsx"), "utf8");
  const professionalForm = readFileSync(join(pages, "FormPTAAProfesional.tsx"), "utf8");

  assert.match(selector, /Técnico administrativo y de apoyo/);
  assert.doesNotMatch(selector, />PTAA</);
  assert.match(professionalForm, /errors\.tipoPersonal && !requiereSeleccionTipoPersonal/);
  assert.match(professionalForm, /role="alert"/);
});
