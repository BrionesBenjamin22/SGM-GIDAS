import { useId, useState } from "react";

import Button from "@/components/Button";
import type { ParticipanteRol } from "@/modules/proyectos/services/participacionesServices";
import {
  filtrarParticipantes,
  participanteClave,
  type ParticipanteBuscable,
} from "@/modules/proyectos/utils/participanteSearch";

type Props = {
  value: ParticipanteBuscable | null;
  options: ParticipanteBuscable[];
  onChange: (participante: ParticipanteBuscable | null) => void;
  disabled?: boolean;
};

const RESULTADOS_POR_PAGINA = 9;

export default function ParticipanteField({ value, options, onChange, disabled }: Props) {
  const id = useId();
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<ParticipanteRol | "">("");
  const [limite, setLimite] = useState(RESULTADOS_POR_PAGINA);
  const resultados = filtrarParticipantes(options, busqueda, categoria, value);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-buscar`} className="mb-1 block text-sm">Buscar participante</label>
          <input
            id={`${id}-buscar`}
            type="search"
            className="input w-full"
            value={busqueda}
            disabled={disabled}
            placeholder="Nombre, apellido o iniciales"
            aria-describedby={`${id}-ayuda`}
            onChange={(event) => {
              setBusqueda(event.target.value);
              setLimite(RESULTADOS_POR_PAGINA);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.preventDefault();
            }}
          />
        </div>
        <div>
          <label htmlFor={`${id}-categoria`} className="mb-1 block text-sm">Categoría</label>
          <select
            id={`${id}-categoria`}
            className="input w-full"
            value={categoria}
            disabled={disabled}
            onChange={(event) => {
              setCategoria(event.target.value as ParticipanteRol | "");
              setLimite(RESULTADOS_POR_PAGINA);
            }}
          >
            <option value="">Investigadores y becarios</option>
            <option value="investigador">Investigadores</option>
            <option value="becario">Becarios</option>
          </select>
        </div>
      </div>

      <p id={`${id}-ayuda`} className="text-xs text-slate-500">
        Busque una persona y pulse Seleccionar para asignarla a la participación.
      </p>
      <p role="status" className="text-xs text-slate-500">
        {resultados.length
          ? `Mostrando ${Math.min(limite, resultados.length)} de ${resultados.length} participantes disponibles.`
          : options.length > (value ? 1 : 0)
            ? "No hay coincidencias. Pruebe otro nombre o categoría."
            : "No hay más participantes disponibles para seleccionar."}
      </p>

      <ul aria-label="Resultados de participantes" className="space-y-2">
        {resultados.slice(0, limite).map((participante) => (
          <li
            key={participanteClave(participante)}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm"
          >
            <span className="min-w-0 break-words">
              {participante.nombre_apellido} ({participante.tipo})
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled}
              aria-label={`Seleccionar a ${participante.nombre_apellido} (${participante.tipo})`}
              onClick={() => {
                if (!disabled) onChange(participante);
              }}
            >
              Seleccionar
            </Button>
          </li>
        ))}
      </ul>

      {resultados.length > limite && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => setLimite((actual) => actual + RESULTADOS_POR_PAGINA)}
        >
          Ver más
        </Button>
      )}

      <p className="text-sm font-medium">Participante seleccionado</p>
      {!value && <p className="text-sm text-slate-500">Todavía no seleccionó un participante.</p>}
      {value && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm">
          <span className="min-w-0 break-words">
            {value.nombre_apellido} ({value.tipo})
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            aria-label={`Quitar a ${value.nombre_apellido}`}
            onClick={() => onChange(null)}
          >
            Quitar
          </Button>
        </div>
      )}
      <p className="text-xs text-slate-500">La selección se aplicará al guardar la participación.</p>
    </div>
  );
}
