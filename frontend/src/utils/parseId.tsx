export function parseId(value?: string | number | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return isNaN(parsed) ? null : parsed;
}