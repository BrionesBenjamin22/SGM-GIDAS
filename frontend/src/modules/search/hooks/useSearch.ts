import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  searchAll,
  type EstadoBusqueda,
  type Orden,
  type SearchMeta,
  type SearchPageResult,
  type SearchResult,
} from "@/modules/search/services/searchService";

const DEBOUNCE_MS = 400;
const CACHE_TTL_MS = 30_000;
const CACHE_MAX_ENTRIES = 30;
const EMPTY_META: SearchMeta = { page: 1, per_page: 9, total: 0, total_pages: 1 };
type CacheEntry = { expiresAt: number; value: SearchPageResult };

export function useSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialEstadoParam = searchParams.get("eliminados");
  const initialEstado: EstadoBusqueda = initialEstadoParam === "true"
    ? "eliminados"
    : initialEstadoParam === "all" ? "all" : "activos";

  const [q, setQState] = useState(searchParams.get("q") || "");
  const [orden, setOrdenState] = useState<Orden>((searchParams.get("orden") as Orden) || "alf_asc");
  const [estado, setEstadoState] = useState<EstadoBusqueda>(initialEstado);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(searchParams.get("tipos")?.split(",").filter(Boolean) || []);
  const [dateFrom, setDateFrom] = useState<string | undefined>(searchParams.get("desde") || undefined);
  const [dateTo, setDateTo] = useState<string | undefined>(searchParams.get("hasta") || undefined);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [meta, setMeta] = useState<SearchMeta>(EMPTY_META);
  const [loading, setLoading] = useState(false);
  const [rawResults, setRawResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const cacheRef = useRef(new Map<string, CacheEntry>());
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (q.trim()) params.q = q.trim();
    if (orden !== "alf_asc") params.orden = orden;
    if (estado === "eliminados") params.eliminados = "true";
    if (estado === "all") params.eliminados = "all";
    if (selectedTypes.length) params.tipos = selectedTypes.join(",");
    if (dateFrom) params.desde = dateFrom;
    if (dateTo) params.hasta = dateTo;
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [q, orden, estado, selectedTypes, dateFrom, dateTo, page, setSearchParams]);

  const executeSearch = useCallback(async (
    queryOverride?: string,
    ordenOverride?: Orden,
    estadoOverride?: EstadoBusqueda,
    pageOverride?: number,
  ) => {
    const query = (queryOverride ?? q).trim();
    const nextOrden = ordenOverride ?? orden;
    const nextEstado = estadoOverride ?? estado;
    const nextPage = pageOverride ?? page;
    const key = `${query.toLocaleLowerCase("es")}|${nextOrden}|${nextEstado}|${nextPage}`;

    if (query.length < 2) {
      controllerRef.current?.abort();
      setRawResults([]);
      setMeta(EMPTY_META);
      setError(null);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    const cached = cacheRef.current.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      setRawResults(cached.value.results);
      setMeta(cached.value.meta);
      setError(null);
      setHasSearched(true);
      setLoading(false);
      return;
    }
    if (cached) cacheRef.current.delete(key);

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const response = await searchAll(query, nextOrden, nextEstado, nextPage, controller.signal);
      if (requestId !== requestIdRef.current) return;
      cacheRef.current.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value: response });
      while (cacheRef.current.size > CACHE_MAX_ENTRIES) {
        const oldest = cacheRef.current.keys().next().value;
        if (oldest === undefined) break;
        cacheRef.current.delete(oldest);
      }
      setRawResults(response.results);
      setMeta(response.meta);
      setHasSearched(true);
    } catch (caught: unknown) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (requestId !== requestIdRef.current) return;
      setError(caught instanceof Error
        ? caught.message
        : "Lo sentimos, no pudimos recuperar la información. Intente nuevamente.");
      setHasSearched(false);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [q, orden, estado, page]);

  useEffect(() => {
    debounceTimerRef.current = window.setTimeout(() => {
      void executeSearch(q, orden, estado, page);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimerRef.current !== null) window.clearTimeout(debounceTimerRef.current);
    };
  }, [q, orden, estado, page, executeSearch]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const executeImmediateSearch = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    void executeSearch();
  }, [executeSearch]);

  const availableTypes = useMemo(
    () => Array.from(new Set(rawResults.map((result) => result.tipo))).sort(),
    [rawResults],
  );
  const results = useMemo(() => rawResults.filter((result) => {
    if (selectedTypes.length && !selectedTypes.includes(result.tipo)) return false;
    if (dateFrom && (!result.fecha || result.fecha < dateFrom)) return false;
    if (dateTo && (!result.fecha || result.fecha > dateTo)) return false;
    return true;
  }), [rawResults, selectedTypes, dateFrom, dateTo]);

  function toggleType(type: string) {
    setSelectedTypes((current) => current.includes(type)
      ? current.filter((item) => item !== type)
      : [...current, type]);
  }

  function setQ(value: string) {
    setPage(1);
    setQState(value);
  }

  function setOrden(value: Orden) {
    setPage(1);
    setOrdenState(value);
  }

  function setEstado(value: EstadoBusqueda) {
    setPage(1);
    setEstadoState(value);
  }

  function clearAll() {
    controllerRef.current?.abort();
    setQState(""); setOrdenState("alf_asc"); setEstadoState("activos"); setSelectedTypes([]);
    setDateFrom(undefined); setDateTo(undefined); setPage(1); setMeta(EMPTY_META);
    setRawResults([]); setError(null); setHasSearched(false); setLoading(false);
    setSearchParams({}, { replace: true });
  }

  return {
    q, setQ, orden, setOrden, estado, setEstado, selectedTypes, setSelectedTypes,
    toggleType, dateFrom, setDateFrom, dateTo, setDateTo, availableTypes, loading,
    results, totalRaw: rawResults.length, error, clearAll, executeSearch,
    executeImmediateSearch,
    hasSearched, page, setPage, meta,
  };
}
