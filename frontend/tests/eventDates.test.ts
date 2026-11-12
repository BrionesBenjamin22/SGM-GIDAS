import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { civilDate, dateKey, dateRange, draftEventDates, errorEventDates, formatEventDates, sameDates } from "../src/utils/eventDates.ts";
import { formatTrabajoReunionHistoryEntry } from "../src/modules/produccion/utils/trabajoReunionHistory.ts";
import { calendarPosition } from "../src/utils/calendarPosition.ts";

test("Jornadas civiles: rangos invertidos entre años, bisiestos y huecos", () => {
  assert.deepEqual(dateRange(civilDate("2026-01-02"), civilDate("2025-12-30")).map(dateKey), ["2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02"]);
  assert.equal(dateRange(civilDate("2024-02-28"), civilDate("2024-03-01")).length, 3);
  assert.equal(formatEventDates(["2026-03-23", "2026-03-20", "2026-03-21"]), "20/03/2026 – 21/03/2026; 23/03/2026");
  assert.equal(sameDates(["2026-01-02", "2026-01-01"], ["2026-01-01", "2026-01-02", "2026-01-02"]), true);
  assert.deepEqual(draftEventDates({ fechaPresentacion: "2026-03-20" }), ["2026-03-20"]);
  assert.ok(errorEventDates([]));
  assert.ok(errorEventDates([civilDate("2009-12-31")]));
  assert.equal(errorEventDates([civilDate("2099-01-01")]), undefined);
  assert.equal(formatTrabajoReunionHistoryEntry({ id: 1, campo: "fechas_presentacion", valor_anterior: ["2026-03-20"], valor_nuevo: ["2026-03-20", "2026-03-22"] }).description,
    "20/03/2026 → 20/03/2026; 22/03/2026");
});

const require = createRequire(import.meta.url);
const walk = (node: any): any[] => !node ? [] : Array.isArray(node) ? node.flatMap(walk) : node.props ? [node, ...walk(node.props.children)] : [];

function calendarHarness(value: Date[], mode = "multiple") {
  const states: any[] = [];
  let cursor = 0, current = value, calls = 0;
  const module = { exports: {} as any };
  const code = ts.transpileModule(readFileSync("src/components/Calendar.tsx", "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(code, { Date, Set, document: { body: {} }, module, exports: module.exports, require(name: string) {
    if (name === "react-dom") return { createPortal: (node: any) => node };
    if (name === "react") return { useId: () => "calendar", useRef: () => ({ current: null }), useEffect() {}, useLayoutEffect() {}, useMemo: (f: any) => f(),
      useState(initial: any) { const i = cursor++; if (!(i in states)) states[i] = typeof initial === "function" ? initial() : initial;
        return [states[i], (next: any) => { states[i] = typeof next === "function" ? next(states[i]) : next; }]; } };
    if (name.startsWith("@/utils/")) return require(`../src/utils/${name.split("/").at(-1)}.ts`);
    return require(name);
  } });
  const wrapper = () => module.exports.default({ mode, value: current, onChange(next: Date[]) { current = next; calls++; } });
  const render = () => { cursor = 0; const node = wrapper(); return walk(node.type(node.props)); };
  const button = (text: string) => render().find(node => node.type === "button" && node.props.children === text);
  const day = (date: string) => render().find(node => node.type === "button" && node.props["aria-label"] === date);
  const open = () => render().find(node => node.type === "button").props.onClick();
  return { render, button, day, open, wrapper, value: () => current, calls: () => calls };
}

test("Calendar múltiple: cambios locales, cancelar, limpiar y confirmar", () => {
  const h = calendarHarness([civilDate("2026-03-20")]);
  h.open();
  h.day("22/03/2026").props.onClick();
  assert.equal(h.calls(), 0);
  h.button("Cancelar").props.onClick();
  assert.deepEqual(h.value().map(dateKey), ["2026-03-20"]);
  h.open();
  assert.equal(h.day("22/03/2026").props["aria-pressed"], false);
  h.day("22/03/2026").props.onClick();
  h.button("Confirmar").props.onClick();
  assert.equal(h.calls(), 1);
  assert.deepEqual(Array.from(h.value(), dateKey), ["2026-03-22"]);
  h.open(); h.button("Limpiar").props.onClick(); h.button("Confirmar").props.onClick();
  assert.equal(h.value().length, 0);
});

test("Calendar rango: extremos entre meses, selección invertida y límites", () => {
  const h = calendarHarness([civilDate("2026-01-02")]);
  h.open();
  assert.equal(h.button("Rango"), undefined);
  assert.equal(h.button("Días sueltos"), undefined);
  h.day("02/01/2026").props.onClick();
  assert.equal(h.button("Confirmar").props.disabled, false);
  h.render().find(node => node.props["aria-label"] === "Mes anterior").props.onClick();
  h.day("30/12/2025").props.onClick();
  assert.equal(h.button("Confirmar").props.disabled, false);
  h.button("Confirmar").props.onClick();
  assert.deepEqual(Array.from(h.value(), dateKey), ["2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02"]);
  const min = calendarHarness([civilDate("2010-01-01")]);
  min.open(); min.render().find(node => node.props["aria-label"] === "Mes anterior").props.onClick();
  assert.equal(min.day("31/12/2009").props.disabled, true);
});

test("Calendar: un tercer clic comienza otro rango y Añadir fechas conserva jornadas separadas", () => {
  const h = calendarHarness([civilDate("2026-03-20")]);
  h.open(); h.day("20/03/2026").props.onClick(); h.day("22/03/2026").props.onClick();
  h.day("25/03/2026").props.onClick(); h.button("Confirmar").props.onClick();
  assert.deepEqual(Array.from(h.value(), dateKey), ["2026-03-25"]);
  h.open(); h.button("Añadir fechas").props.onClick(); h.day("28/03/2026").props.onClick();
  h.button("Confirmar").props.onClick();
  assert.deepEqual(Array.from(h.value(), dateKey), ["2026-03-25", "2026-03-28"]);
});

test("Calendar: posición acotada al viewport en 375, 768, 1024 y 1440 px", () => {
  for (const width of [375, 768, 1024, 1440]) {
    const above = calendarPosition({ top: 620, bottom: 660, left: width - 120 }, 420, width, 740);
    assert.ok(above.top + 420 < 620);
    assert.ok(above.left >= 8 && above.left + above.width <= width - 8);
    const below = calendarPosition({ top: 30, bottom: 70, left: 20 }, 420, width, 740);
    assert.equal(below.top, 76);
    const small = calendarPosition({ top: 150, bottom: 190, left: 0 }, 420, width, 320);
    assert.ok(small.top >= 8 && small.top + small.maxHeight <= 312);
  }
});

test("Calendar: vista previa no persiste y entrada manual completa un rango", () => {
  const h = calendarHarness([civilDate("2026-03-20")]);
  h.open(); h.day("20/03/2026").props.onClick(); h.day("23/03/2026").props.onMouseEnter();
  assert.equal(h.day("22/03/2026").props["aria-pressed"], false);
  assert.match(h.day("22/03/2026").props.className, /bg-slate-200/);
  assert.equal(h.calls(), 0);
  const inputs = () => h.render().filter(node => node.type === "input");
  inputs()[0].props.onChange({ target: { value: "28/12/2025" } }); inputs()[0].props.onBlur();
  inputs()[1].props.onChange({ target: { value: "02/01/2026" } }); inputs()[1].props.onBlur();
  h.button("Confirmar").props.onClick();
  assert.deepEqual(Array.from(h.value(), dateKey), ["2025-12-28", "2025-12-29", "2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02"]);
});

test("Calendar: cambiar entre meses de cuatro, cinco y seis semanas conserva las seis filas y el diálogo", () => {
  const h = calendarHarness([civilDate("2021-02-01")]);
  h.open();
  for (let month = 0; month < 14; month++) {
    const nodes = h.render();
    const dialog = nodes.find(node => node.props.role === "dialog");
    const grid = nodes.find(node => node.type === "div" && node.props.className?.includes("grid-cols-7"));
    const slots = walk(grid).filter(node => node.type === "button" || (node.type === "span" && node.props.className === "h-9"));
    assert.equal(slots.length, 42);
    assert.equal(slots.filter(node => node.type === "button").every(node => node.props.className.includes("h-9")), true);
    assert.equal(dialog.props.id, "calendar-panel");
    assert.equal(h.calls(), 0);
    nodes.find(node => node.props["aria-label"] === "Mes siguiente").props.onClick();
    assert.ok(h.render().some(node => node.props.role === "dialog"));
  }
  h.button("Cancelar").props.onClick();
  assert.deepEqual(h.value().map(dateKey), ["2021-02-01"]);
});

test("Calendar conserva el modo único predeterminado", () => {
  // An omitted discriminant continues to route to the original single-date implementation.
  const module = { exports: {} as any };
  const code = ts.transpileModule(readFileSync("src/components/Calendar.tsx", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(code, { module, exports: module.exports, require: (name: string) => name.startsWith("@/utils/") ? require(`../src/utils/${name.split("/").at(-1)}.ts`) : require(name) });
  assert.equal(module.exports.default({ value: null, onChange() {} }).type.name, "SingleDatePicker");
});

test("Formulario: borrador escalar, fechas como conjunto, errores por campo y guardado consolidado", async () => {
  let cursor = 0, draft: any, mutation: any, saved: any, calls = 0;
  const states: any[] = [], refs: any[] = [], effects: Array<() => void> = [];
  let initial: any = { id: 8, titulo_trabajo: "Estudio", nombre_reunion: "Congreso", procedencia: "Ciudad", tipo_reunion: { id: 1 },
    fecha_presentacion: "2026-03-20", fechas_presentacion: ["2026-03-20", "2026-03-22"], referato: true, alcance: "nacional", expositores: [] };
  const mocks: Record<string, any> = {
    react: { useState(value: any) { const i = cursor++; if (!(i in states)) states[i] = value;
      return [states[i], (value: any) => { states[i] = typeof value === "function" ? value(states[i]) : value; }]; },
      useRef(value: any) { const i = cursor++; return refs[i] ??= { current: value }; }, useEffect(effect: () => void) { effects.push(effect); } },
    "react-router-dom": { useParams: () => ({ id: "8" }), useNavigate: () => () => {} },
    "@tanstack/react-query": { useQueryClient: () => ({ invalidateQueries: async () => {} }), useQuery: () => ({ data: initial }),
      useMutation(options: any) { mutation = options; return { isPending: false, mutateAsync: async (body: any) => { saved = body; calls++; } }; } },
    "@/modules/shared/hooks/useFormDraft": { useFormDraft(options: any) { draft = options; return { clearDraft() {}, saveStatus: "idle", blocker: {} }; } },
    "@/modules/produccion/hooks/useIntegrantesExpositores": { useIntegrantesExpositores: () => ({ data: [] }) },
    "@/modules/produccion/hooks/useTiposReunion": { useTiposReunion: () => ({ tipos: [] }) },
    "@/modules/grupo/hooks/useUctGuard": { useUctGuard: () => ({ uct: { id: 1 } }) },
    "@/context/AuthContext": { useAuth: () => ({ canEditRecords: () => true }) },
    "@/utils/format": { toTitleCase: (text: string) => text },
  };
  function load(file: string): any {
    const module = { exports: {} as any };
    const code = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    runInNewContext(code, { Date, document: { querySelectorAll: () => [] }, requestAnimationFrame() {}, module, exports: module.exports, require(name: string) {
      if (name in mocks) return mocks[name];
      if (name.startsWith("@/components/") || name.includes("/components/")) return { default: name.split("/").at(-1) };
      if (name === "../../../lib/textValidation") return require("../src/lib/textValidation.ts");
      if (name === "@/utils/eventDates") return require("../src/utils/eventDates.ts");
      if (name === "@/lib/liveValidation") return require("../src/lib/liveValidation.ts");
      if (name === "@/lib/httpError") return load("src/lib/httpError.ts");
      if (name.includes("/utils/") || name.endsWith("trabajoExpositoresServices")) return load(name.replace("@/", "src/") + ".ts");
      if (name.startsWith("@/")) return {};
      return require(name);
    } });
    return module.exports;
  }
  const Form = load("src/modules/produccion/pages/TrabajosReunionForm.tsx").default;
  const render = () => { cursor = 0; effects.length = 0; const nodes = walk(Form()); effects.splice(0).forEach(f => f()); return nodes; };
  const calendar = () => render().find(node => node.type === "Calendar");
  const submit = () => render().find(node => node.type === "form").props.onSubmit({ preventDefault() {} });
  render(); render();
  calendar().props.onChange([civilDate("2026-03-22"), civilDate("2026-03-20")]);
  await submit(); assert.equal(calls, 0);
  calendar().props.onChange([civilDate("2026-03-21"), civilDate("2026-03-20")]);
  walk(render().find(node => node.type === "Field" && node.props.name === "titulo")).find(node => node.type === "input").props.onChange({ target: { value: "Estudio actualizado" } });
  assert.equal(calls, 0);
  await submit(); assert.equal(calls, 1);
  assert.equal(JSON.stringify(saved), '{"titulo_trabajo":"Estudio actualizado","fechas_presentacion":["2026-03-20","2026-03-21"]}');
  initial = { ...initial, ...saved };
  draft.onRestore({ ...draft.value, fechasPresentacion: undefined, fechaPresentacion: "2025-12-31" });
  assert.deepEqual(Array.from(calendar().props.value, dateKey), ["2025-12-31"]);
  calendar().props.onChange([]); await submit(); assert.equal(calls, 1);
  assert.ok(render().find(node => node.props.name === "fechasPresentacion").props.error);
  // Focus scheduling is a browser concern; the same field mapper is exercised here.
  mutation.onError({ body: { error: { details: { fields: { fechas_presentacion: "Seleccione una jornada válida." } } } } });
  assert.equal(render().find(node => node.props.name === "fechasPresentacion").props.error, "Seleccione una jornada válida.");
});
