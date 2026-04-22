export function formatFecha(fecha?: string | null) {
  if (!fecha) return "—";

  const d = new Date(fecha);
  if (isNaN(d.getTime())) return "—";

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
