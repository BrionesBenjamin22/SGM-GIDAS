import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  searchAll,
  type SearchResult,
  type Orden,
  type EstadoBusqueda,
} from "@/modules/search/services/searchService";

export function useSearch() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQ = searchParams.get("q") || "";
  const initialOrden = (searchParams.get("orden") as Orden) || "alf_asc";
  const initialTypes = searchParams.get("tipos")?.split(",").filter(Boolean) || [];
  const initialDateFrom = searchParams.get("desde") || undefined;
  const initialDateTo = searchParams.get("hasta") || undefined;

  const initialEstadoParam = searchParams.get("eliminados");
  const initialEstado: EstadoBusqueda =
    initialEstadoParam === "true"
      ? "eliminados"
      : initialEstadoParam === "all"
      ? "all"
      : "activos";

  const [q, setQ] = useState(initialQ);
  const [orden, setOrden] = useState<Orden>(initialOrden);
  const [estado, setEstado] = useState<EstadoBusqueda>(initialEstado);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(initialTypes);
  const [dateFrom, setDateFrom] = useState<string | undefined>(initialDateFrom);
  const [dateTo, setDateTo] = useState<string | undefined>(initialDateTo);

  const [loading, setLoading] = useState(false);
  const [rawResults, setRawResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(initialQ.length >= 2);

  useEffect(() => {
    const params: Record<string, string> = {};

    if (q.trim()) params.q = q.trim();
    if (orden !== "alf_asc") params.orden = orden;
    if (estado === "eliminados") params.eliminados = "true";
    if (estado === "all") params.eliminados = "all";
    if (selectedTypes.length > 0) params.tipos = selectedTypes.join(",");
    if (dateFrom) params.desde = dateFrom;
    if (dateTo) params.hasta = dateTo;

    setSearchParams(params, { replace: true });
  }, [q, orden, estado, selectedTypes, dateFrom, dateTo, setSearchParams]);

  async function executeSearch(
    queryOverride?: string,
    ordenOverride?: Orden,
    estadoOverride?: EstadoBusqueda,
  ) {
    const queryToUse = (queryOverride ?? q).trim();
    const ordenToUse = ordenOverride ?? orden;
    const estadoToUse = estadoOverride ?? estado;

    if (queryToUse.length < 2) {
      setRawResults([]);
      setError(null);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const r = await searchAll(queryToUse, ordenToUse, estadoToUse);
      setRawResults(r);
      setHasSearched(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error de búsqueda";
      setError(msg);
      setHasSearched(false);
    } finally {
      setLoading(false);
    }
  }

  const availableTypes = useMemo(() => {
    const set = new Set(rawResults.map((r) => r.tipo));
    return Array.from(set).sort();
  }, [rawResults]);

  const results = useMemo(() => {
    let filtered = rawResults;

    if (selectedTypes.length > 0) {
      filtered = filtered.filter((r) => selectedTypes.includes(r.tipo));
    }

    if (dateFrom) {
      filtered = filtered.filter((r) => r.fecha && r.fecha >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter((r) => r.fecha && r.fecha <= dateTo);
    }

    return filtered;
  }, [rawResults, selectedTypes, dateFrom, dateTo]);

  function toggleType(t: string) {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function clearAll() {
    setQ("");
    setOrden("alf_asc");
    setEstado("activos");
    setSelectedTypes([]);
    setDateFrom(undefined);
    setDateTo(undefined);
    setRawResults([]);
    setError(null);
    setHasSearched(false);
    setSearchParams({}, { replace: true });
  }

  return {
    q, setQ,
    orden, setOrden,
    estado, setEstado,
    selectedTypes, setSelectedTypes,
    toggleType,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    availableTypes,
    loading,
    results,
    totalRaw: rawResults.length,
    error,
    clearAll,
    executeSearch,
    hasSearched,
  };
}