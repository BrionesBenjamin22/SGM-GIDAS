function centavos(value: string): bigint {
  const [entero, decimales = ""] = value.split(".");
  return BigInt(entero) * 100n + BigInt(decimales.padEnd(2, "0"));
}

export function excedeSaldoDisponible(monto: string, saldoDisponible: string, montoAnterior = "0.00"): boolean {
  return centavos(monto) > centavos(saldoDisponible) + centavos(montoAnterior);
}
