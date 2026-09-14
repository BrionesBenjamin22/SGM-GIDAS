import { useId, useState } from "react";
import Button from "@/components/Button";
import { autorClave, autorEtiqueta, esAutorSeleccionable, type IntegranteAutor } from "@/modules/produccion/services/trabajoAutoresServices";

type Props = {
  value: IntegranteAutor[];
  options: IntegranteAutor[];
  onChange: (autores: IntegranteAutor[]) => void;
  disabled?: boolean;
};

export default function IntegrantesAutoresField({ value, options, onChange, disabled }: Props) {
  const id = useId();
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [limite, setLimite] = useState(9);
  const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const consulta = normalizar(busqueda);
  const seleccionados = new Set(value.map(autorClave));
  const disponibles = options.filter(autor => esAutorSeleccionable(autor) &&
    !seleccionados.has(autorClave(autor)));
  const resultados = disponibles.filter(autor => {
    if (categoria && autor.rol !== categoria) return false;
    const nombre = normalizar(autor.nombre_apellido);
    const iniciales = nombre.split(/[^a-z0-9]+/).filter(Boolean).map(parte => parte[0]).join("");
    return consulta.split(/\s+/).every(parte => nombre.includes(parte)) ||
      iniciales.startsWith(consulta.replace(/[.\s]/g, ""));
  });
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-buscar`} className="mb-1 block text-sm">Buscar autores</label>
          <input id={`${id}-buscar`} type="search" className="input w-full" value={busqueda} disabled={disabled}
            placeholder="Nombre, apellido o iniciales" aria-describedby={`${id}-ayuda`}
            onChange={event => { setBusqueda(event.target.value); setLimite(9); }}
            onKeyDown={event => { if (event.key === "Enter") event.preventDefault(); }} />
        </div>
        <div>
          <label htmlFor={`${id}-categoria`} className="mb-1 block text-sm">Categoría</label>
          <select id={`${id}-categoria`} className="input w-full" value={categoria} disabled={disabled}
            onChange={event => { setCategoria(event.target.value); setLimite(9); }}>
            <option value="">Investigadores y becarios</option>
            <option value="investigador">Investigadores</option>
            <option value="becario">Becarios</option>
          </select>
        </div>
      </div>
      <p id={`${id}-ayuda`} className="text-xs text-slate-500">Busque un integrante y pulse Añadir para incorporarlo al trabajo.</p>
      <p role="status" className="text-xs text-slate-500">
        {resultados.length ? `Mostrando ${Math.min(limite, resultados.length)} de ${resultados.length} autores disponibles.` :
          disponibles.length ? "No hay coincidencias. Pruebe otro nombre o categoría." : "No hay más autores disponibles para añadir."}
      </p>
      <ul aria-label="Resultados de autores" className="space-y-2">
        {resultados.slice(0, limite).map(autor => (
          <li key={autorClave(autor)} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm">
            <span className="min-w-0 break-words">{autorEtiqueta(autor)}</span>
            <Button type="button" variant="secondary" size="sm" disabled={disabled}
              aria-label={`Añadir a ${autor.nombre_apellido} (${autor.tipo})`}
              onClick={() => { if (!disabled) onChange([...value, autor]); }}>Añadir</Button>
          </li>
        ))}
      </ul>
      {resultados.length > limite && <Button type="button" variant="secondary" size="sm" disabled={disabled}
        onClick={() => setLimite(actual => actual + 9)}>Ver más</Button>}
      <p className="text-sm font-medium">Autores seleccionados ({value.length})</p>
      {value.length === 0 && <p className="text-sm text-slate-500">Todavía no añadió autores.</p>}
      <ul aria-label="Autores seleccionados" className="space-y-2">
        {value.map(autor => (
          <li key={autorClave(autor)} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm">
            <span className="min-w-0 break-words">{autorEtiqueta(autor)}{!autor.activo && " — Inactivo"}</span>
            <Button type="button" variant="secondary" size="sm" disabled={disabled}
              aria-label={`Quitar a ${autor.nombre_apellido}`} onClick={() => onChange(value.filter(item => autorClave(item) !== autorClave(autor)))}>
              Quitar
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">Las altas y bajas de autores se aplicarán al guardar el trabajo.</p>
    </div>
  );
}
