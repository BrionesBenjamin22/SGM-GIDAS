export type MemoriaSectionFilter = {
  source: "memoria";
  sectionKey: string;
  sectionLabel: string;
  ids: Array<number | string>;
  memoriaLabel: string;
  memoriaId: number;
  versionId: number;
};

export function getMemoriaSectionFilter(
  state: unknown,
  sectionKey: string
): MemoriaSectionFilter | null {
  if (!state || typeof state !== "object") return null;

  const maybeState = state as {
    memoriaFilter?: MemoriaSectionFilter;
  };

  const filter = maybeState.memoriaFilter;

  if (!filter || filter.sectionKey !== sectionKey || !Array.isArray(filter.ids)) {
    return null;
  }

  return filter;
}

export function applyMemoriaSectionFilter<T extends { id: number | string }>(
  list: T[],
  filter: MemoriaSectionFilter | null
): T[] {
  if (!filter) return list;

  const allowedIds = new Set(filter.ids.map((id) => String(id)));
  return list.filter((item) => allowedIds.has(String(item.id)));
}
