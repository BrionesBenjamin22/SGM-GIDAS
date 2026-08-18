const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*";
const ALL_CHARACTERS = `${UPPERCASE}${LOWERCASE}${DIGITS}${SYMBOLS}`;

function secureIndex(maxExclusive: number): number {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("El navegador no permite generar credenciales seguras.");
  }

  const rejectionLimit = Math.floor(0x1_0000_0000 / maxExclusive) * maxExclusive;
  const value = new Uint32Array(1);

  do {
    globalThis.crypto.getRandomValues(value);
  } while (value[0] >= rejectionLimit);

  return value[0] % maxExclusive;
}

function pick(characters: string): string {
  return characters[secureIndex(characters.length)];
}

export function generateTemporaryPassword(length = 16): string {
  if (length < 12) {
    throw new Error("La contraseña temporal debe tener al menos 12 caracteres.");
  }

  const password = [pick(UPPERCASE), pick(LOWERCASE), pick(DIGITS), pick(SYMBOLS)];

  while (password.length < length) password.push(pick(ALL_CHARACTERS));

  for (let index = password.length - 1; index > 0; index -= 1) {
    const target = secureIndex(index + 1);
    [password[index], password[target]] = [password[target], password[index]];
  }

  return password.join("");
}
