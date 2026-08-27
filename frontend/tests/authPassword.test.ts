import assert from "node:assert/strict";
import test from "node:test";
import { generateTemporaryPassword } from "../src/modules/auth/utils/password.ts";

test("genera contraseñas temporales fuertes mediante Web Crypto", () => {
  const generated = new Set<string>();

  for (let index = 0; index < 50; index += 1) {
    const password = generateTemporaryPassword();
    assert.equal(password.length, 16);
    assert.match(password, /[A-Z]/);
    assert.match(password, /[a-z]/);
    assert.match(password, /[0-9]/);
    assert.match(password, /[!@#$%^&*]/);
    generated.add(password);
  }

  assert.equal(generated.size, 50);
});

test("rechaza longitudes que debilitan la credencial temporal", () => {
  assert.throws(() => generateTemporaryPassword(11), /al menos 12 caracteres/);
});
