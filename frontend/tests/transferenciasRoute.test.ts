import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

test("el listado de transferencias usa la ruta canónica sin redirección", async () => {
  const requests: string[] = [];
  const source = readFileSync("src/modules/transferencia/services/transferenciasServices.ts", "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} as Record<string, (...args: unknown[]) => Promise<unknown>> };
  runInNewContext(code, {
    module,
    exports: module.exports,
    require: (path: string) => path === "@/lib/http"
      ? { http: async (url: string) => { requests.push(url); return []; } }
      : { isMockMode: () => false },
  });

  assert.deepEqual(await module.exports.getTransferencias("true"), []);
  assert.deepEqual(requests, ["/transferencias/?activos=true"]);
});
