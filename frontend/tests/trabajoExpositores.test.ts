import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
function load(file: string, mocks: Record<string, unknown> = {}) {
  const module = { exports: {} as any };
  const code = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(code, { URL, module, exports: module.exports, require: (name: string) => {
    if (name in mocks) return mocks[name];
    if (name === "@/utils/eventDates") return require("../src/utils/eventDates.ts");
    if (name === "@/lib/liveValidation") return require("../src/lib/liveValidation.ts");
    if (name === "../../../lib/textValidation") return require("../src/lib/textValidation.ts");
    if (name === "@/utils/dateTime") return { toCivilDateString: (date: Date | null) => date?.toISOString().slice(0, 10) ?? "" };
    if (name === "@/modules/shared/hooks/useFormDraft") return { useFormDraft: () => ({ clearDraft() {}, saveStatus: "idle", blocker: { state: "unblocked" } }) };
    if (name.startsWith("@/components/") || name.includes("/components/")) return { default: name.split("/").at(-1) };
    if (name.includes("/utils/trabajoEnlace")) return load("src/modules/produccion/utils/trabajoEnlace.ts");
    if (name.includes("/utils/clasificacionTrabajo")) return load("src/modules/produccion/utils/clasificacionTrabajo.ts");
    if (name.startsWith("@/")) return {};
    return require(name);
  } });
  return module.exports;
}
const service = load("src/modules/produccion/services/trabajoExpositoresServices.ts");
const walk = (node: any): any[] => !node ? [] : Array.isArray(node) ? node.flatMap(walk) : typeof node === "object" && node.props ? [node, ...walk(node.props.children)] : [];
const investigador = { id: 1, rol: "investigador", tipo: "Investigador", nombre_apellido: "Ana", activo: true, grupo_utn_id: 1 };
const personal = { ...investigador, rol: "personal", tipo: "PTAA", nombre_apellido: "Eva" };
const externo = { rol: "externo", id: null, nombre_apellido: "José Pérez", tipo: "Externo", activo: true };

test("Expositores: normalización, categorías, diferencias, obligatorios y duplicados", () => {
  assert.equal(service.errorExpositores([]), "Agregue al menos un expositor.");
  assert.equal(service.errorExpositores([], false), undefined);
  assert.equal(service.errorExpositores([investigador, personal, externo]), undefined);
  assert.match(service.errorExpositores([externo, { ...externo, nombre_apellido: " JOSE  PEREZ " }]), /repetido/);
  assert.equal(service.mismosExpositores([externo, investigador], [investigador, { ...externo, nombre_apellido: " JOSE PEREZ " }]), true);
  assert.equal(service.mismosExpositores([investigador], [personal]), false);
  assert.match(service.errorExpositores([{ ...externo, nombre_apellido: "  " }]), /nombre externo/);
  assert.match(service.errorExpositores([{ ...investigador, identidad_id: 4 }, { ...personal, identidad_id: 4 }]), /repetido/);
  assert.equal(JSON.stringify(service.expositorReferencia(externo)), '{"rol":"externo","nombre_apellido":"José Pérez"}');
});

test("El selector incluye todas las categorías activas del grupo y conserva el tipo de personal", async () => {
  const api = load("src/modules/produccion/services/trabajoExpositoresServices.ts", { "@/lib/http": { http: async () => [investigador, personal,
    { ...personal, id: 2, tipo_personal: "Profesional", dni: "dato ajeno al selector" }, { ...personal, id: 3, grupo_utn_id: 2 }, { ...personal, id: 4, activo: false }] } });
  const result = await api.getIntegrantesExpositores(1);
  assert.equal(result.length, 3);
  assert.equal(result[2].tipo, "Profesional");
  assert.equal(result[2].dni, undefined);
});

test("Selector: altas externas e internas y bajas son locales; escribir no guarda ni añade", () => {
  let value: any[] = [{ ...investigador, activo: false }], cursor = 0;
  const states: any[] = [];
  const Selector = load("src/modules/produccion/components/ExpositoresField.tsx", {
    react: { useId: () => "expo", useState(initial: any) { const index = cursor++; if (!(index in states)) states[index] = initial;
      return [states[index], (next: any) => { states[index] = next; }]; } },
    "@/modules/produccion/services/trabajoExpositoresServices": service,
  }).default;
  const render = (disabled = false) => { cursor = 0; return walk(Selector({ value, options: [personal], disabled, onChange: (next: any[]) => { value = next; } })); };
  const button = (label: string) => render().find(node => node.type === "Button" && node.props.children === label);
  button("Añadir").props.onClick();
  assert.equal(value.length, 2);
  const input = () => render().find(node => node.type === "input" && node.props.placeholder === "Nombre y apellido");
  input().props.onChange({ target: { value: "  José   Pérez " } });
  assert.equal(value.length, 2);
  let prevented = false;
  input().props.onKeyDown({ key: "Enter", preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  button("Añadir externo").props.onClick();
  assert.equal(value[2].nombre_apellido, "José Pérez");
  input().props.onChange({ target: { value: "JOSE PEREZ" } });
  button("Añadir externo").props.onClick();
  assert.equal(value.length, 3);
  assert.ok(render().some(node => node.props.role === "alert"));
  button("Quitar").props.onClick();
  assert.equal(value.length, 2);
  assert.ok(render(true).filter(node => node.type === "Button").every(node => node.props.disabled));
});

test("Formulario: registro legado sin expositores edita otros campos, alta exige uno y fallo de consulta permite externos", async () => {
  let cursor = 0, params: any = { id: "8" }, saved: any, calls = 0;
  const states: any[] = [], refs: any[] = [], effects: Array<() => void> = [];
  let initial: any = { id: 8, titulo_trabajo: "Estudio", nombre_reunion: "Congreso", procedencia: "Ciudad", tipo_reunion: { id: 1 }, fecha_presentacion: "2026-03-20", referato: true, alcance: "nacional", expositores: [], activo: true };
  const Form = load("src/modules/produccion/pages/TrabajosReunionForm.tsx", {
    react: { useState(initial: any) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], (next: any) => { states[index] = typeof next === "function" ? next(states[index]) : next; }]; },
      useRef(initial: any) { const index = cursor++; return refs[index] ??= { current: initial }; }, useEffect(effect: () => void) { effects.push(effect); } },
    "react-router-dom": { useParams: () => params, useNavigate: () => () => {} },
    "@tanstack/react-query": { useQueryClient: () => ({ invalidateQueries: async () => {} }), useQuery: () => ({ data: initial }),
      useMutation: (options: any) => ({ isPending: false, mutateAsync: async (body: any) => { saved = body; calls++; await options.onSuccess({ id: 8 }); } }) },
    "@/modules/produccion/services/trabajoExpositoresServices": service,
    "@/modules/produccion/hooks/useIntegrantesExpositores": { useIntegrantesExpositores: () => ({ data: undefined, isError: true }) },
    "@/modules/produccion/hooks/useTiposReunion": { useTiposReunion: () => ({ tipos: [] }) },
    "@/modules/grupo/hooks/useUctGuard": { useUctGuard: () => ({ uct: { id: 1 } }) },
    "@/context/AuthContext": { useAuth: () => ({ canEditRecords: () => true, canCreateRecords: () => true }) },
    "@/utils/format": { toTitleCase: (text: string) => text },
  }).default;
  const render = () => { cursor = 0; effects.length = 0; const nodes = walk(Form()); effects.splice(0).forEach(effect => effect()); return nodes; };
  const submit = () => render().find(node => node.type === "form").props.onSubmit({ preventDefault() {} });
  render(); render();
  await submit();
  assert.equal(calls, 0);
  const title = render().find(node => node.type === "Field" && node.props.name === "titulo");
  walk(title).find(node => node.type === "input").props.onChange({ target: { value: "Estudio actualizado" } });
  await submit();
  assert.equal(JSON.stringify(saved), '{"titulo_trabajo":"Estudio actualizado"}');
  params = {};
  await submit();
  assert.equal(calls, 1);
  assert.ok(render().find(node => node.props.name === "expositores").props.error);
  render().find(node => node.type === "ExpositoresField").props.onChange([externo, personal]);
  await submit();
  assert.equal(calls, 2);
  assert.equal(saved.expositores.length, 2);
  assert.equal(saved.expositores[0].rol, "externo");
});
