import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import Field from "@/components/Field";
import { useUct } from "@/hooks/useUct";
import { useTiposFormacion } from "@/hooks/useTiposFormacion";
import { crearBecario, actualizarBecario } from "@/services/becarioServices";
import { useQueryClient } from "@tanstack/react-query";
import { useBecas } from "@/hooks/useBecas";
import {
  vincularBecarioABeca,
  desvincularBecarioDeBeca,
} from "@/services/becasService";
import Calendar from "@/components/Calendar";

interface Props {
  initialData?: any;
  onCancel: () => void;
}

type BecaVinculada = {
  idLocal: string;
  becaId: number | "";
  fechaInicio: Date | null;
  fechaFin: Date | null;
  monto: number | "";
};

export default function FormBecario({ initialData, onCancel }: Props) {
  const navigate = useNavigate();
  const { uct } = useUct();
  const { data: tiposFormacion = [] } = useTiposFormacion();
  const qc = useQueryClient();
  const { data: becasLista = [] } = useBecas();

  const isEdit = Boolean(initialData);

  const [nombreApellido, setNombre] = useState("");
  const [horasSemanales, setHoras] = useState<number | "">("");
  const [tipoFormacionId, setTipoFormacionId] = useState<number | "">("");
  const [fechaAltaGrupo, setFechaAltaGrupo] = useState<Date | null>(null);
  const [activo, setActivo] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [agregarBeca, setAgregarBeca] = useState(false);

  const createEmptyBeca = (): BecaVinculada => ({
    idLocal: Math.random().toString(36).slice(2, 11),
    becaId: "",
    fechaInicio: null,
    fechaFin: null,
    monto: "",
  });

  const [becasVinculadas, setBecasVinculadas] = useState<BecaVinculada[]>([]);

  const formatDateStr = (d: Date | null) => {
    if (!d) return undefined;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  useEffect(() => {
    if (!initialData) {
      setNombre("");
      setHoras("");
      setTipoFormacionId("");
      setFechaAltaGrupo(null);
      setActivo(true);
      setAgregarBeca(false);
      setBecasVinculadas([]);
      return;
    }

    setNombre(initialData.nombre_apellido ?? "");
    setHoras(initialData.horas_semanales ?? "");
    setActivo(initialData.activo ?? true);
    setFechaAltaGrupo(
      initialData.fecha_alta_grupo
        ? new Date(`${initialData.fecha_alta_grupo}T00:00:00`)
        : null
    );
    setTipoFormacionId(
      initialData.relaciones?.tipo_formacion?.id ??
        initialData.tipo_formacion_id ??
        ""
    );

    if (initialData.becas && initialData.becas.length > 0) {
      setAgregarBeca(true);
      setBecasVinculadas(
        initialData.becas.map((b: any) => ({
          idLocal: Math.random().toString(36).slice(2, 11),
          becaId: b.id ?? "",
          fechaInicio: b.fecha_inicio
            ? new Date(`${b.fecha_inicio}T00:00:00`)
            : null,
          fechaFin: b.fecha_fin
            ? new Date(`${b.fecha_fin}T00:00:00`)
            : null,
          monto:
            b.monto_percibido !== null && b.monto_percibido !== undefined
              ? b.monto_percibido
              : "",
        }))
      );
    } else {
      setAgregarBeca(false);
      setBecasVinculadas([]);
    }
  }, [initialData]);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const clearBecaErrors = () => {
    setErrors((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((key) => {
        if (key.startsWith("beca")) delete copy[key];
      });
      return copy;
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!nombreApellido.trim()) {
      newErrors.nombre = "Debe ingresar nombre y apellido";
    }

    if (!horasSemanales || Number(horasSemanales) <= 0) {
      newErrors.horas = "Debe ingresar horas validas";
    }

    if (!tipoFormacionId) {
      newErrors.tipoFormacion = "Debe seleccionar tipo de formacion";
    }

    if (!fechaAltaGrupo) {
      newErrors.fechaAltaGrupo = "Debe ingresar la fecha de alta en el grupo";
    }

    if (agregarBeca) {
      if (becasVinculadas.length === 0) {
        newErrors.becaGlobal = "Debe agregar al menos una beca";
      } else {
        becasVinculadas.forEach((beca, index) => {
          if (!beca.becaId) {
            newErrors[`beca_${index}_id`] =
              "Debe seleccionar un tipo de beca";
          }
          if (!beca.fechaInicio) {
            newErrors[`beca_${index}_fechaInicio`] =
              "Debe ingresar una fecha de inicio";
          }
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!uct?.id) return;

    const payload = {
      nombre_apellido: nombreApellido,
      horas_semanales: Number(horasSemanales),
      tipo_formacion_id: Number(tipoFormacionId),
      fecha_alta_grupo: formatDateStr(fechaAltaGrupo)!,
      grupo_utn_id: uct.id,
      activo,
    };

    if (isEdit && initialData?.id) {
      await actualizarBecario(initialData.id, payload);

      for (const b of initialData.becas || []) {
        await desvincularBecarioDeBeca(b.id, initialData.id).catch(() => {});
      }

      if (agregarBeca && becasVinculadas.length > 0) {
        await Promise.all(
          becasVinculadas.map((beca) => {
            if (!beca.becaId) return Promise.resolve();
            return vincularBecarioABeca(Number(beca.becaId), {
              id_becario: initialData.id,
              fecha_inicio: formatDateStr(beca.fechaInicio)!,
              fecha_fin: formatDateStr(beca.fechaFin),
              monto_percibido:
                beca.monto !== "" ? Number(beca.monto) : undefined,
            });
          })
        ).catch((err) => console.error("Error al actualizar becas", err));
      }

      qc.invalidateQueries({ queryKey: ["personal"] });
      qc.invalidateQueries({ queryKey: ["becarios"] });
      qc.invalidateQueries({
        queryKey: ["personal-detalle", "becario", String(initialData.id)],
      });

      navigate(`/personal/becario/${initialData.id}`, {
        replace: true,
        state: { successMessage: "Actualizado con exito!" },
      });

      return;
    }

    const newBecario: any = await crearBecario(payload);
    const createdId = newBecario.id;

    if (createdId && agregarBeca && becasVinculadas.length > 0) {
      await Promise.all(
        becasVinculadas.map((beca) => {
          if (!beca.becaId) return Promise.resolve();
          return vincularBecarioABeca(Number(beca.becaId), {
            id_becario: createdId,
            fecha_inicio: formatDateStr(beca.fechaInicio)!,
            fecha_fin: formatDateStr(beca.fechaFin),
            monto_percibido:
              beca.monto !== "" ? Number(beca.monto) : undefined,
          });
        })
      ).catch((err) => console.error("Error al crear becas vinculadas", err));
    }

    qc.invalidateQueries({ queryKey: ["personal"] });
    qc.invalidateQueries({ queryKey: ["becarios"] });

    navigate("/personal", {
      state: { successMessage: "Creado con exito!" },
    });
  };

  return (
    <form
      onSubmit={submit}
      className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
    >
      <Field label="Nombre y apellido">
        <>
          <input
            className={`input ${
              errors.nombre ? "!border-red-500 !ring-2 !ring-red-500" : ""
            }`}
            value={nombreApellido}
            onChange={(e) => {
              setNombre(e.target.value);
              if (e.target.value.trim()) clearError("nombre");
            }}
          />
          {errors.nombre && (
            <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>
          )}
        </>
      </Field>

      <Field label="Horas semanales">
        <>
          <input
            type="number"
            className={`input ${
              errors.horas ? "!border-red-500 !ring-2 !ring-red-500" : ""
            }`}
            value={horasSemanales}
            onChange={(e) => {
              const value = e.target.value === "" ? "" : +e.target.value;
              setHoras(value);
              if (value) clearError("horas");
            }}
          />
          {errors.horas && (
            <p className="mt-1 text-sm text-red-500">{errors.horas}</p>
          )}
        </>
      </Field>

      <Field label="Tipo de formacion">
        <>
          <select
            className={`input ${
              errors.tipoFormacion ? "!border-red-500 !ring-2 !ring-red-500" : ""
            } ${!tipoFormacionId ? "text-slate-400" : "text-slate-900"}`}
            value={tipoFormacionId}
            onChange={(e) => {
              const value = e.target.value ? +e.target.value : "";
              setTipoFormacionId(value);
              if (value) clearError("tipoFormacion");
            }}
          >
            <option value="" disabled>
              Seleccionar tipo de formacion
            </option>
            {tiposFormacion.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
          {errors.tipoFormacion && (
            <p className="mt-1 text-sm text-red-500">
              {errors.tipoFormacion}
            </p>
          )}
        </>
      </Field>

      <Field label="Fecha de alta en el grupo">
        <Calendar
          value={fechaAltaGrupo}
          onChange={(date) => {
            setFechaAltaGrupo(date);
            if (date) clearError("fechaAltaGrupo");
          }}
          className={`input ${
            errors.fechaAltaGrupo ? "!border-red-500 !ring-2 !ring-red-500" : ""
          }`}
          helperText={errors.fechaAltaGrupo ?? "DD/MM/AAAA"}
        />
      </Field>

      <div className="space-y-6 rounded-lg border border-slate-200 bg-slate-50 p-6">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4">
          <h4 className="font-semibold text-slate-800">Becas</h4>

          <p className="text-sm text-slate-600">
            Si el becario no percibe una beca, deja esta seccion sin seleccionar.
            Actvala solo cuando quieras registrar una o mas becas.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="checkbox-agregar-beca"
              checked={agregarBeca}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setAgregarBeca(isChecked);

                if (!isChecked) {
                  setBecasVinculadas([]);
                  clearBecaErrors();
                } else {
                  if (becasVinculadas.length === 0) {
                    setBecasVinculadas([createEmptyBeca()]);
                  }
                  clearError("becaGlobal");
                }
              }}
              className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-slate-700"
            />
            <label
              htmlFor="checkbox-agregar-beca"
              className="cursor-pointer text-sm font-medium text-slate-700"
            >
              Agregar beca
            </label>
          </div>

          {errors.becaGlobal && (
            <p className="mt-1 text-xs text-red-500">{errors.becaGlobal}</p>
          )}
        </div>

        {agregarBeca && (
          <div className="space-y-6">
            {becasVinculadas.map((beca, index) => (
              <div
                key={beca.idLocal}
                className="group relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                {becasVinculadas.length > 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-2 bg-white px-3 py-1 text-xs text-red-500 hover:text-red-700"
                    title="Eliminar esta beca"
                    onClick={() => {
                      setBecasVinculadas((prev) =>
                        prev.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    x
                  </Button>
                )}

                <h5 className="mb-3 text-xs font-semibold uppercase text-slate-500">
                  Beca #{index + 1}
                </h5>

                <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
                  <Field label="Tipo de beca">
                    <>
                      <select
                        className={`input py-2 text-sm text-slate-900 ${
                          errors[`beca_${index}_id`]
                            ? "!border-red-500 !ring-2 !ring-red-500"
                            : ""
                        }`}
                        value={beca.becaId}
                        onChange={(e) => {
                          const val =
                            e.target.value === "" ? "" : Number(e.target.value);

                          setBecasVinculadas((prev) => {
                            const next = [...prev];
                            next[index].becaId = val;
                            return next;
                          });

                          if (val !== "") clearError(`beca_${index}_id`);
                        }}
                      >
                        <option value="" disabled>
                          Seleccionar tipo de beca
                        </option>
                        {becasLista.map((b: any) => (
                          <option key={b.id} value={b.id}>
                            {b.nombre_beca}
                          </option>
                        ))}
                      </select>
                      {errors[`beca_${index}_id`] && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors[`beca_${index}_id`]}
                        </p>
                      )}
                    </>
                  </Field>

                  <Field label="Monto percibido (Opcional)">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ej. 150000"
                      className="input py-2 text-sm"
                      value={beca.monto}
                      onChange={(e) => {
                        const val = e.target.value === "" ? "" : +e.target.value;

                        setBecasVinculadas((prev) => {
                          const next = [...prev];
                          next[index].monto = val;
                          return next;
                        });
                      }}
                    />
                  </Field>

                  <Field label="Fecha inicio">
                    <Calendar
                      value={beca.fechaInicio}
                      onChange={(date) => {
                        setBecasVinculadas((prev) => {
                          const next = [...prev];
                          next[index].fechaInicio = date;
                          return next;
                        });
                        if (date) clearError(`beca_${index}_fechaInicio`);
                      }}
                      className={`input py-2 text-sm ${
                        errors[`beca_${index}_fechaInicio`]
                          ? "!border-red-500 !ring-2 !ring-red-500"
                          : ""
                      }`}
                      helperText={
                        errors[`beca_${index}_fechaInicio`] ?? "DD/MM/AAAA"
                      }
                    />
                  </Field>

                  <Field label="Fecha fin (Opcional)">
                    <Calendar
                      value={beca.fechaFin}
                      onChange={(date) => {
                        setBecasVinculadas((prev) => {
                          const next = [...prev];
                          next[index].fechaFin = date;
                          return next;
                        });
                      }}
                      minDate={beca.fechaInicio ?? undefined}
                      className="input py-2 text-sm"
                      helperText="DD/MM/AAAA"
                    />
                  </Field>
                </div>
              </div>
            ))}

            <div className="flex pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  setBecasVinculadas((prev) => [...prev, createEmptyBeca()])
                }
                className="px-3 py-1 text-xs"
              >
                + Agregar beca
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
        >
          Volver
        </Button>

        <Button type="submit" size="sm">
          {isEdit ? "Actualizar" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
