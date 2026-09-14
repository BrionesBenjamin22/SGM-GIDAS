import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
function load(file: string, mocks: Record<string, unknown> = {}) {
  const module = { exports: {} as any };
  const code = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  runInNewContext(code, { module, exports: module.exports, require: (name: string) => {
    if (name in mocks) return mocks[name];
    if (name.startsWith("@/components/")) return { default: name.split("/").at(-1) };
    if (name.startsWith("@/")) return {};
    return require(name);
  } });
  return module.exports.default;
}
const walk = (node: any): any[] => !node ? [] : Array.isArray(node) ? node.flatMap(walk)
  : typeof node === "object" && node.props ? [node, ...walk(node.props.children)] : [];

test("Feedback distingue carga, vacio y fallo; reintenta y conserva contenido durante refetch", () => {
  const Button = load("src/components/Button.tsx");
  const Feedback = load("src/modules/produccion/components/InvestigadoresQueryFeedback.tsx", {
    "@/components/Button": { default: Button },
  });
  let retries = 0;
  const query = { data: undefined as any, isError: false, isFetching: true,
    refetch: () => { retries++; return Promise.resolve(); } };
  const html = () => renderToStaticMarkup(createElement(Feedback, { query }));
  assert.match(html(), /role="status".*Cargando investigadores/);
  query.isError = true; query.isFetching = false;
  assert.match(html(), /role="alert"/);
  assert.doesNotMatch(html(), /No hay investigadores/);
  const retry = walk(Feedback({ query })).find(node => node.type === Button);
  retry.props.onClick(); assert.equal(retries, 1);
  query.isFetching = true;
  assert.equal(walk(Feedback({ query })).find(node => node.type === Button).props.loading, true);
  query.isError = false; query.data = []; query.isFetching = false;
  assert.match(html(), /No hay investigadores activos disponibles/);
  query.data = [{ id: 1, nombre_apellido: "Investigador" }]; query.isFetching = true;
  assert.equal(html(), "");
});

for (const page of ["TrabajosReunionForm", "TrabajosRevistasForm"]) {
  test(`${page}: bloqueo inicial y selecciones conservadas ante fallo y recuperacion`, async () => {
    let cursor = 0;
    const state: any[] = [];
    const query = { data: undefined as any, isError: false, isFetching: true, refetch() {} };
    const Form = load(`src/modules/produccion/pages/${page}.tsx`, {
      react: { useEffect() {}, useState(initial: unknown) {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], (value: unknown) => { state[index] = value; }];
      } },
      "react-router-dom": { useParams: () => ({}), useNavigate: () => () => {} },
      "@tanstack/react-query": { useQueryClient: () => ({}), useQuery: () => ({}),
        useMutation: () => ({ isPending: false, mutateAsync: () => { throw new Error("No debe guardar"); } }) },
      "@/modules/grupo/hooks/useUctGuard": { useUctGuard: () => ({ uct: { id: 1 } }) },
      "@/modules/produccion/hooks/useTiposReunion": { useTiposReunion: () => ({ tipos: [] }) },
      "@/modules/personal/hooks/useInvestigadores": { useInvestigadores: () => query },
    });
    const render = () => { cursor = 0; return walk(Form()); };
    const selector = () => render().find(node => node.type === "PersonalProyectoField");
    const save = () => render().find(node => node.type === "Button" && node.props.type === "submit");
    assert.equal(save().props.disabled, true);
    assert.equal(selector().props.disabled, true);
    await render().find(node => node.type === "form").props.onSubmit({ preventDefault() {} });
    query.data = [{ id: 1, nombre_apellido: "Uno" }, { id: 2, nombre_apellido: "Dos" }];
    query.isFetching = false;
    selector().props.onChange([1, 2]);
    assert.equal(save().props.disabled, false);
    query.isFetching = true;
    assert.equal(selector().props.disabled, false);
    query.isError = true; query.isFetching = false;
    assert.equal(JSON.stringify(selector().props.value), "[1,2]");
    assert.equal(save().props.disabled, false); // cache utilizable
    query.data = undefined;
    assert.equal(save().props.disabled, true);
    assert.equal(JSON.stringify(selector().props.value), "[1,2]");
    query.data = [{ id: 1, nombre_apellido: "Uno" }, { id: 2, nombre_apellido: "Dos" }];
    query.isError = false;
    assert.equal(save().props.disabled, false);
    assert.equal(JSON.stringify(selector().props.value), "[1,2]");
  });
}
