/** Civil dates: local noon avoids daylight-saving transitions at midnight. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function normalizeDates(values: string[]): string[] {
  return [...new Set(values)].sort();
}

export function civilDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

export function dateRange(a: Date, b: Date): Date[] {
  const [start, end] = a < b ? [a, b] : [b, a];
  const values: Date[] = [];
  for (const day = civilDate(dateKey(start)); dateKey(day) <= dateKey(end); day.setDate(day.getDate() + 1)) {
    values.push(new Date(day));
    if (dateKey(day) === dateKey(end)) break;
  }
  return values;
}

export function sameDates(a: string[], b: string[]): boolean {
  return JSON.stringify(normalizeDates(a)) === JSON.stringify(normalizeDates(b));
}

export function errorEventDates(values: Date[]): string | undefined {
  if (!values.length) return "Seleccione al menos una jornada del evento.";
  if (values.some(value => Number.isNaN(value.getTime()) || dateKey(value) < "2010-01-01")) {
    return "Ingrese fechas válidas desde el 01/01/2010.";
  }
}

export function eventDates(item: { fechas_presentacion?: string[]; fecha_presentacion?: string | null }): string[] {
  return normalizeDates(item.fechas_presentacion?.length ? item.fechas_presentacion : item.fecha_presentacion ? [item.fecha_presentacion] : []);
}

export function draftEventDates(draft: { fechasPresentacion?: string[]; fechaPresentacion?: string | null }): string[] {
  return normalizeDates(draft.fechasPresentacion ?? (draft.fechaPresentacion ? [draft.fechaPresentacion] : []));
}

export function formatEventDates(values: string[]): string {
  const ranges: string[][] = [];
  for (const value of normalizeDates(values)) {
    const last = ranges[ranges.length - 1];
    const next = last ? civilDate(last[1]) : null;
    if (next) next.setDate(next.getDate() + 1);
    if (last && next && dateKey(next) === value) last[1] = value;
    else ranges.push([value, value]);
  }
  const display = (value: string) => value.split("-").reverse().join("/");
  return ranges.map(([start, end]) => start === end ? display(start) : `${display(start)} – ${display(end)}`).join("; ") || "—";
}
