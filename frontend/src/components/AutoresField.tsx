import { useEffect, useState } from "react";
import Button from "@/components/Button";

export type Autor = {
  id: number;
  nombre_apellido: string;
};

type AutoresFieldProps = {
  value: Autor[];
  options?: Autor[];
  onChange: (autores: Autor[]) => void;
  label?: string;
};

type ModoAutor = "existente" | "nuevo";

export default function AutoresField({
  value,
  options = [],
  onChange,
  label,
}: AutoresFieldProps) {
  const [modes, setModes] = useState<ModoAutor[]>(
    value.map((autor) => (autor.id > 0 ? "existente" : "nuevo"))
  );

  useEffect(() => {
    setModes((prev) => {
      const next = value.map((autor, index) => {
        if (prev[index]) return prev[index];
        return autor.id > 0 ? "existente" : "nuevo";
      });
      return next;
    });
  }, [value]);

  const setAutor = (index: number, autor: Autor) => {
    const next = [...value];
    next[index] = autor;
    onChange(next);
  };

  const setModo = (index: number, modo: ModoAutor) => {
    setModes((prev) => {
      const next = [...prev];
      next[index] = modo;
      return next;
    });

    if (modo === "existente") {
      setAutor(index, {
        id: 0,
        nombre_apellido: "",
      });
    } else {
      setAutor(index, {
        id: -Date.now(),
        nombre_apellido: "",
      });
    }
  };

  const addAutor = () => {
    onChange([...value, { id: -Date.now(), nombre_apellido: "" }]);
    setModes((prev) => [...prev, "nuevo"]);
  };

  const removeAutor = (index: number) => {
    if (value.length === 1) {
      onChange([{ id: -Date.now(), nombre_apellido: "" }]);
      setModes(["nuevo"]);
      return;
    }

    onChange(value.filter((_, i) => i !== index));
    setModes((prev) => prev.filter((_, i) => i !== index));
  };

  const autoresDisponiblesPara = (index: number) => {
    const idsSeleccionados = value
      .filter((_, i) => i !== index)
      .map((a) => a.id)
      .filter((id) => id > 0);

    return options.filter((a) => !idsSeleccionados.includes(a.id));
  };

  return (
    <div className="space-y-4">
      {label && (
        <label className="block text-sm font-medium">{label}</label>
      )}

      {value.map((autor, index) => {
        const disponibles = autoresDisponiblesPara(index);
        const modo = modes[index] ?? (autor.id > 0 ? "existente" : "nuevo");

        return (
          <div
            key={`${autor.id}-${index}`}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setModo(index, "existente")}
                  className={`px-3 py-1.5 text-xs transition-colors ${
                    modo === "existente"
                      ? "bg-slate-800 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Existente
                </button>

                <button
                  type="button"
                  onClick={() => setModo(index, "nuevo")}
                  className={`border-l border-slate-200 px-3 py-1.5 text-xs transition-colors ${
                    modo === "nuevo"
                      ? "bg-slate-800 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Nuevo
                </button>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="px-3 py-1 text-xs"
                onClick={() => removeAutor(index)}
              >
                ✕
              </Button>
            </div>

            {modo === "existente" ? (
              <select
                className="input w-full"
                value={autor.id > 0 ? String(autor.id) : ""}
                onChange={(e) => {
                  const autorId = Number(e.target.value);
                  const seleccionado = disponibles.find((a) => a.id === autorId);
                  if (!seleccionado) return;
                  setAutor(index, seleccionado);
                }}
              >
                <option value="">Seleccionar autor existente</option>
                {disponibles.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre_apellido}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="input w-full"
                value={autor.nombre_apellido}
                onChange={(e) =>
                  setAutor(index, {
                    ...autor,
                    nombre_apellido: e.target.value,
                  })
                }
                placeholder="Nombre del autor"
              />
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="px-3 py-1 text-xs"
        onClick={addAutor}
      >
        + Agregar autor
      </Button>
    </div>
  );
}