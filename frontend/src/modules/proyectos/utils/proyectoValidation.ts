export const PROYECTO_CODIGO_MAX_LENGTH = 50;

const PROYECTO_CODIGO_PATTERN = /^[A-Za-z0-9]+$/;

export function validateCodigoProyecto(value: string): string | null {
  const codigo = value.trim();

  if (!codigo) {
    return "Debe ingresar el código del proyecto";
  }

  if (codigo.length > PROYECTO_CODIGO_MAX_LENGTH) {
    return `El código no puede superar los ${PROYECTO_CODIGO_MAX_LENGTH} caracteres`;
  }

  if (!PROYECTO_CODIGO_PATTERN.test(codigo)) {
    return "El código solo puede contener letras y números";
  }

  return null;
}
