import { useId, useState } from "react";
import Button from "@/components/Button";
import { expositorClave, expositorEtiqueta, normalizarNombreExpositor, errorExpositores, type Expositor } from "@/modules/produccion/services/trabajoExpositoresServices";

type Props = {
  value: Expositor[];
  options: Expositor[];
  onChange: (expositores: Expositor[]) => void;
  disabled?: boolean;
};

export default function ExpositoresField({ value, options, onChange, disabled }: Props) {
  const id = useId();
  const [busqueda, setBusqueda] = useState("");
  const [nombreExterno, setNombreExterno] = useState("");
  const [errorExterno, setErrorExterno] = useState("");
  const [categoria, setCategoria] = useState("");
  const [paginaDisponibles, setPaginaDisponibles] = useState(1);
  const [paginaSeleccionados, setPaginaSeleccionados] = useState(1);
  const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const consulta = normalizar(busqueda);
  const seleccionados = new Set(value.map(expositorClave));
  const disponibles = options.filter(autor => autor.rol !== "externo" && autor.activo &&
    !seleccionados.has(expositorClave(autor)) && !value.some(item => item.identidad_id != null && item.identidad_id === autor.identidad_id));
  const resultados = disponibles.filter(autor => {
    if (categoria && autor.rol !== categoria) return false;
    const nombre = normalizar(autor.nombre_apellido);
    const iniciales = nombre.split(/[^a-z0-9]+/).filter(Boolean).map(parte => parte[0]).join("");
    return consulta.split(/\s+/).every(parte => nombre.includes(parte)) ||
      iniciales.startsWith(consulta.replace(/[.\s]/g, ""));
  });
  const paginaDisponible = Math.min(paginaDisponibles, Math.max(1, Math.ceil(resultados.length / 5)));
  const paginaSeleccionada = Math.min(paginaSeleccionados, Math.max(1, Math.ceil(value.length / 5)));
  const inicioDisponibles = (paginaDisponible - 1) * 5;
  const inicioSeleccionados = (paginaSeleccionada - 1) * 5;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-buscar`} className="mb-1 block text-sm">Buscar expositores</label>
          <input id={`${id}-buscar`} type="search" className="input w-full" value={busqueda} disabled={disabled}
            placeholder="Nombre, apellido o iniciales" aria-describedby={`${id}-ayuda`}
            onChange={event => { setBusqueda(event.target.value); setPaginaDisponibles(1); }}
            onKeyDown={event => { if (event.key === "Enter") event.preventDefault(); }} />
        </div>
        <div>
          <label htmlFor={`${id}-categoria`} className="mb-1 block text-sm">Categoría</label>
          <select id={`${id}-categoria`} className="input w-full" value={categoria} disabled={disabled}
            onChange={event => { setCategoria(event.target.value); setPaginaDisponibles(1); }}>
            <option value="">Todo el personal del grupo</option>
            <option value="investigador">Investigadores</option>
            <option value="becario">Becarios</option>
            <option value="personal">Personal</option>
          </select>
        </div>
      </div>
      <p id={`${id}-ayuda`} className="text-xs text-slate-500">Busque un integrante y pulse Añadir para incorporarlo al trabajo.</p>
      <p role="status" className="text-xs text-slate-500">
        {resultados.length ? `Mostrando ${inicioDisponibles + 1} a ${Math.min(inicioDisponibles + 5, resultados.length)} de ${resultados.length} expositores disponibles.` :
          disponibles.length ? "No hay coincidencias. Pruebe otro nombre o categoría." : "No hay más expositores disponibles para añadir."}
      </p>
      <ul aria-label="Resultados de expositores" className="space-y-2">
        {resultados.slice(inicioDisponibles, inicioDisponibles + 5).map(autor => (
          <li key={expositorClave(autor)} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm">
            <span className="min-w-0 break-words">{expositorEtiqueta(autor)}</span>
            <Button type="button" variant="secondary" size="sm" disabled={disabled}
              aria-label={`Añadir a ${autor.nombre_apellido} (${autor.tipo})`}
              onClick={() => { if (!disabled) { onChange([...value, autor]); setPaginaSeleccionados(Math.ceil((value.length + 1) / 5)); } }}>Añadir</Button>
          </li>
        ))}
      </ul>
      {resultados.length > 5 && <nav aria-label="Páginas de expositores disponibles" className="flex items-center gap-2 text-sm">
        <Button type="button" variant="secondary" size="sm" disabled={disabled || paginaDisponible === 1} onClick={() => setPaginaDisponibles(paginaDisponible - 1)}>Anterior</Button>
        <span role="status">Página {paginaDisponible} de {Math.ceil(resultados.length / 5)}</span>
        <Button type="button" variant="secondary" size="sm" disabled={disabled || paginaDisponible === Math.ceil(resultados.length / 5)} onClick={() => setPaginaDisponibles(paginaDisponible + 1)}>Siguiente</Button>
      </nav>}
      <div className="space-y-2 rounded-xl border border-slate-200 p-3">
        <label htmlFor={`${id}-externo`} className="block text-sm font-medium">Expositor externo</label>
        <input id={`${id}-externo`} className="input w-full" value={nombreExterno} maxLength={120} disabled={disabled}
          placeholder="Nombre y apellido" aria-invalid={!!errorExterno} aria-describedby={errorExterno ? `${id}-externo-error` : undefined}
          onChange={event => { setNombreExterno(event.target.value); setErrorExterno(""); }}
          onKeyDown={event => { if (event.key === "Enter") event.preventDefault(); }} />
        {errorExterno && <p id={`${id}-externo-error`} role="alert" className="text-sm text-red-600">{errorExterno}</p>}
        <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => {
          const externo: Expositor = { rol: "externo", id: null, nombre_apellido: normalizarNombreExpositor(nombreExterno), tipo: "Externo", activo: true };
          const error = errorExpositores([...value, externo]);
          if (error) { setErrorExterno(error); return; }
          onChange([...value, externo]); setNombreExterno(""); setPaginaSeleccionados(Math.ceil((value.length + 1) / 5));
        }}>Añadir externo</Button>
        <p className="text-xs text-slate-500">Se incorpora por nombre, sin crear un legajo.</p>
      </div>
      <p className="text-sm font-medium">Expositores seleccionados ({value.length})</p>
      {value.length === 0 && <p className="text-sm text-slate-500">Todavía no añadió expositores.</p>}
      <ul aria-label="Expositores seleccionados" className="space-y-2">
        {value.slice(inicioSeleccionados, inicioSeleccionados + 5).map(autor => (
          <li key={expositorClave(autor)} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm">
            <span className="min-w-0 break-words">{expositorEtiqueta(autor)}{!autor.activo && " — Inactivo"}</span>
            <Button type="button" variant="secondary" size="sm" disabled={disabled}
              aria-label={`Quitar a ${autor.nombre_apellido}`} onClick={() => onChange(value.filter(item => expositorClave(item) !== expositorClave(autor)))}>
              Quitar
            </Button>
          </li>
        ))}
      </ul>
      {value.length > 5 && <nav aria-label="Páginas de expositores seleccionados" className="flex items-center gap-2 text-sm">
        <Button type="button" variant="secondary" size="sm" disabled={disabled || paginaSeleccionada === 1} onClick={() => setPaginaSeleccionados(paginaSeleccionada - 1)}>Anterior</Button>
        <span role="status">Página {paginaSeleccionada} de {Math.ceil(value.length / 5)}</span>
        <Button type="button" variant="secondary" size="sm" disabled={disabled || paginaSeleccionada === Math.ceil(value.length / 5)} onClick={() => setPaginaSeleccionados(paginaSeleccionada + 1)}>Siguiente</Button>
      </nav>}
      <p className="text-xs text-slate-500">Las altas y bajas de expositores se aplicarán al guardar el trabajo.</p>
    </div>
  );
}
