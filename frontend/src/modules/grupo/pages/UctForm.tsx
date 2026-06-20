import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import Button from "@/components/Button";
import Field from "@/components/Field";
import ErrorText from "@/components/ErrorText";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessToast from "@/components/SuccessToast";
import { useUct } from "@/modules/grupo/hooks/useUct";
import { useCargos } from "@/modules/grupo/hooks/useCargos";
import {
  useCrearYAsignarDirectivo,
  useActualizarDirectivo,
  useFinalizarDirectivo,
} from "@/modules/grupo/hooks/useDirectivos";

type DirectivoItem = {
  id?: number;
  id_directivo?: number;
  nombre_apellido: string;
  cargo: string;
  fecha_inicio?: string;
  fecha_fin?: string | null;
};

export default function UctForm() {
  const { uct, save, saving } = useUct();
  const navigate = useNavigate();

  const isEdit = !!uct;
  const grupoId = uct?.id;

  const { data: cargos = [] } = useCargos();
  const crearAsignar = useCrearYAsignarDirectivo(grupoId ?? 0);
  const actualizarDirectivo = useActualizarDirectivo(grupoId);
  const finalizarDirectivo = useFinalizarDirectivo(grupoId);

  const [data, setData] = useState({
    facultadRegional: "",
    nombreSigla: "",
    nombre1: "",
    cargo1: "",
    fecha1: "",
    nombre2: "",
    cargo2: "",
    fecha2: "",
    correo: "",
    objetivos: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNombre, setEditingNombre] = useState("");

  const [mostrarAltaDirectivos, setMostrarAltaDirectivos] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [fechaFin, setFechaFin] = useState("");
  const [directivoAFinalizar, setDirectivoAFinalizar] =
    useState<DirectivoItem | null>(null);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const directivosActuales: DirectivoItem[] = useMemo(
    () => (uct?.directivos ?? []) as DirectivoItem[],
    [uct]
  );

  const directorActual = directivosActuales.find(
    (d) => d.cargo?.toLowerCase() === "director"
  );

  const vicedirectorActual = directivosActuales.find(
    (d) => d.cargo?.toLowerCase() === "vicedirector"
  );

  const faltaDirector = isEdit && !directorActual;
  const faltaVicedirector = isEdit && !vicedirectorActual;
  const tieneDirectivos = directivosActuales.length > 0;

  const cargoDirector = cargos.find(
    (c) => c.nombre?.toLowerCase() === "director"
  );

  const cargoVicedirector = cargos.find(
    (c) => c.nombre?.toLowerCase() === "vicedirector"
  );

  useEffect(() => {
    if (!uct) return;

    setData((prev) => ({
      ...prev,
      facultadRegional: uct.facultadRegional ?? "",
      nombreSigla: uct.nombreSigla ?? "",
      correo: uct.correo ?? "",
      objetivos: uct.objetivos ?? "",
      nombre1: "",
      fecha1: "",
      cargo1: cargoDirector ? String(cargoDirector.id) : "",
      nombre2: "",
      fecha2: "",
      cargo2: cargoVicedirector ? String(cargoVicedirector.id) : "",
    }));
  }, [uct, cargoDirector, cargoVicedirector]);

  useEffect(() => {
    if (!faltaDirector && !faltaVicedirector) {
      setMostrarAltaDirectivos(false);
    }
  }, [faltaDirector, faltaVicedirector]);

  const change =
    (k: string) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const value = e.target.value;
      setData((d) => ({ ...d, [k]: value }));

      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[k];
        return copy;
      });
    };

  const validate = () => {
    const e: Record<string, string> = {};

    if (!data.facultadRegional.trim()) {
      e.facultadRegional = "Debe ingresar facultad regional";
    }

    if (!data.nombreSigla.trim()) {
      e.nombreSigla = "Debe ingresar nombre y sigla";
    }

    if (!data.correo.trim()) {
      e.correo = "Debe ingresar correo";
    } else if (!/^\S+@\S+\.\S+$/.test(data.correo)) {
      e.correo = "Formato de correo inválido";
    }

    if (!data.objetivos.trim()) {
      e.objetivos = "Debe ingresar objetivos";
    }

    if (mostrarAltaDirectivos && faltaDirector) {
      if (!data.nombre1.trim()) {
        e.nombre1 = "Ingrese nombre";
      }
      if (!data.cargo1) {
        e.cargo1 = "Seleccione cargo";
      }
      if (!data.fecha1) {
        e.fecha1 = "Ingrese fecha";
      }
    }

    if (mostrarAltaDirectivos && faltaVicedirector) {
      if (!data.nombre2.trim()) {
        e.nombre2 = "Ingrese nombre";
      }
      if (!data.cargo2) {
        e.cargo2 = "Seleccione cargo";
      }
      if (!data.fecha2) {
        e.fecha2 = "Ingrese fecha";
      }
    }

    if (
      mostrarAltaDirectivos &&
      faltaDirector &&
      faltaVicedirector &&
      data.cargo1 &&
      data.cargo2 &&
      data.cargo1 === data.cargo2
    ) {
      e.cargo2 = "No puede repetir el mismo cargo";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await save({
        facultadRegional: data.facultadRegional.trim(),
        nombreSigla: data.nombreSigla.trim(),
        correo: data.correo.trim(),
        objetivos: data.objetivos.trim(),
        director: "",
        vicedirector: "",
      });

      if (grupoId && mostrarAltaDirectivos) {
        if (faltaDirector) {
          await crearAsignar.mutateAsync({
            nombre_apellido: data.nombre1.trim(),
            id_cargo: Number(data.cargo1),
            fecha_inicio: data.fecha1,
          });
        }

        if (faltaVicedirector) {
          await crearAsignar.mutateAsync({
            nombre_apellido: data.nombre2.trim(),
            id_cargo: Number(data.cargo2),
            fecha_inicio: data.fecha2,
          });
        }

        setMostrarAltaDirectivos(false);
        setSuccessMessage("Equipo directivo registrado correctamente.");
        setShowSuccess(true);
        return;
      }

      setSuccessMessage(
        isEdit
          ? "UCT actualizada correctamente."
          : "UCT creada correctamente."
      );
      setShowSuccess(true);
    } catch (err: any) {
      alert(err.message || "Error al guardar");
    }
  };

  const handleEditarDirectivo = async () => {
    if (!editingId || !editingNombre.trim()) return;

    try {
      await actualizarDirectivo.mutateAsync({
        id: editingId,
        nombre_apellido: editingNombre.trim(),
      });

      setEditingId(null);
      setEditingNombre("");
      setSuccessMessage("Directivo actualizado correctamente.");
      setShowSuccess(true);
    } catch (err: any) {
      alert(err.message || "Error al actualizar directivo");
    }
  };

  const abrirConfirmFinalizar = (directivo: DirectivoItem) => {
    setDirectivoAFinalizar(directivo);
    setFechaFin("");
    setConfirmOpen(true);
    setEditingId(null);
    setEditingNombre("");
  };

  const cerrarConfirmFinalizar = () => {
    setConfirmOpen(false);
    setFechaFin("");
    setDirectivoAFinalizar(null);
  };

  const handleFinalizarDirectivo = async () => {
    const directivoId =
      directivoAFinalizar?.id_directivo ?? directivoAFinalizar?.id;

    if (!directivoId || !fechaFin) return;

    try {
      await finalizarDirectivo.mutateAsync({
        id_directivo: directivoId,
        fecha_fin: fechaFin,
      });

      cerrarConfirmFinalizar();
      setSuccessMessage("Cargo finalizado correctamente.");
      setShowSuccess(true);
    } catch (err: any) {
      alert(err.message || "Error al finalizar cargo");
    }
  };

  const inputClass = (field: string) =>
    `input ${errors[field] ? "!border-red-500 !ring-2 !ring-red-500" : ""}`;

  return (
    <section className="w-full">
      <h2 className="text-3xl font-semibold mb-6">Configuración de la UCT</h2>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 space-y-8"
      >
        <Field label="Facultad Regional">
          <>
            <input
              className={inputClass("facultadRegional")}
              value={data.facultadRegional}
              onChange={change("facultadRegional")}
            />
            {errors.facultadRegional && (
              <ErrorText>{errors.facultadRegional}</ErrorText>
            )}
          </>
        </Field>

        <Field label="Nombre y Sigla del Grupo">
          <>
            <input
              className={inputClass("nombreSigla")}
              value={data.nombreSigla}
              onChange={change("nombreSigla")}
            />
            {errors.nombreSigla && <ErrorText>{errors.nombreSigla}</ErrorText>}
          </>
        </Field>

        {!isEdit && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
            Primero guardá la configuración del grupo. Después vas a poder
            registrar el equipo directivo.
          </div>
        )}

        {(faltaDirector || faltaVicedirector) && mostrarAltaDirectivos && (
          <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-700">
                Equipo Directivo
              </h3>
              <p className="text-sm text-slate-600">
                Completá los cargos directivos faltantes.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {faltaDirector && (
                <>
                  <Field label="Nombre completo">
                    <>
                      <input
                        className={inputClass("nombre1")}
                        value={data.nombre1}
                        onChange={change("nombre1")}
                        placeholder="Ingrese nombre del director"
                      />
                      {errors.nombre1 && <ErrorText>{errors.nombre1}</ErrorText>}
                    </>
                  </Field>

                  <Field label="Cargo">
                    <>
                      <select
                        className={inputClass("cargo1")}
                        value={data.cargo1}
                        onChange={change("cargo1")}
                      >
                        <option value="">Seleccione cargo</option>
                        {cargoDirector && (
                          <option value={cargoDirector.id}>
                            {cargoDirector.nombre}
                          </option>
                        )}
                      </select>
                      {errors.cargo1 && <ErrorText>{errors.cargo1}</ErrorText>}
                    </>
                  </Field>

                  <Field label="Fecha de inicio">
                    <>
                      <input
                        type="date"
                        className={inputClass("fecha1")}
                        value={data.fecha1}
                        onChange={change("fecha1")}
                      />
                      {errors.fecha1 && <ErrorText>{errors.fecha1}</ErrorText>}
                    </>
                  </Field>
                </>
              )}

              {faltaVicedirector && (
                <>
                  <Field label="Nombre completo">
                    <>
                      <input
                        className={inputClass("nombre2")}
                        value={data.nombre2}
                        onChange={change("nombre2")}
                        placeholder="Ingrese nombre del vicedirector"
                      />
                      {errors.nombre2 && <ErrorText>{errors.nombre2}</ErrorText>}
                    </>
                  </Field>

                  <Field label="Cargo">
                    <>
                      <select
                        className={inputClass("cargo2")}
                        value={data.cargo2}
                        onChange={change("cargo2")}
                      >
                        <option value="">Seleccione cargo</option>
                        {cargoVicedirector && (
                          <option value={cargoVicedirector.id}>
                            {cargoVicedirector.nombre}
                          </option>
                        )}
                      </select>
                      {errors.cargo2 && <ErrorText>{errors.cargo2}</ErrorText>}
                    </>
                  </Field>

                  <Field label="Fecha de inicio">
                    <>
                      <input
                        type="date"
                        className={inputClass("fecha2")}
                        value={data.fecha2}
                        onChange={change("fecha2")}
                      />
                      {errors.fecha2 && <ErrorText>{errors.fecha2}</ErrorText>}
                    </>
                  </Field>
                </>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setMostrarAltaDirectivos(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {isEdit && tieneDirectivos && (
          <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-700">
                Equipo Directivo
              </h3>
              <p className="text-sm text-slate-600">
                El equipo directivo ya fue registrado para esta UCT.
              </p>

              {(faltaDirector || faltaVicedirector) && !mostrarAltaDirectivos && (
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setMostrarAltaDirectivos(true)}
                  >
                    Agregar cargo faltante
                  </Button>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
              {directivosActuales.map((d, index) => {
                const directivoId = d.id_directivo ?? d.id;

                return (
                  <div
                    key={`${directivoId ?? index}-${d.cargo}`}
                    className="rounded-lg border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {d.nombre_apellido}
                        </p>
                        <p>{d.cargo}</p>
                        <p className="text-slate-500">
                          Inicio: {d.fecha_inicio || "—"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (!directivoId) return;
                            setEditingId(directivoId);
                            setEditingNombre(d.nombre_apellido);
                          }}
                          className="text-sky-600 hover:text-sky-700 transition"
                          title="Editar directivo"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!directivoId) return;
                            abrirConfirmFinalizar(d);
                          }}
                          className="text-red-500 hover:text-red-600 transition"
                          title="Finalizar cargo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {editingId === directivoId && (
                      <div className="mt-4 border-t border-slate-200 pt-4 space-y-3">
                        <input
                          className="input"
                          value={editingNombre}
                          onChange={(e) => setEditingNombre(e.target.value)}
                          placeholder="Nombre y apellido"
                        />

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingId(null);
                              setEditingNombre("");
                            }}
                          >
                            Cancelar
                          </Button>

                          <Button
                            size="sm"
                            onClick={handleEditarDirectivo}
                            disabled={actualizarDirectivo.isPending}
                          >
                            {actualizarDirectivo.isPending
                              ? "Guardando..."
                              : "Guardar"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isEdit && !tieneDirectivos && !mostrarAltaDirectivos && (
          <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-700">
                Equipo Directivo
              </h3>
              <p className="text-sm text-slate-600">
                Todavía no hay cargos directivos registrados para esta UCT.
              </p>
            </div>

            <div className="pt-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setMostrarAltaDirectivos(true)}
              >
                Registrar equipo directivo
              </Button>
            </div>
          </div>
        )}

        <Field label="Correo electrónico">
          <>
            <input
              type="email"
              className={inputClass("correo")}
              value={data.correo}
              onChange={change("correo")}
            />
            {errors.correo && <ErrorText>{errors.correo}</ErrorText>}
          </>
        </Field>

        <Field label="Objetivos">
          <>
            <textarea
              rows={5}
              className={`${inputClass("objetivos")} resize-y`}
              value={data.objetivos}
              onChange={change("objetivos")}
            />
            {errors.objetivos && <ErrorText>{errors.objetivos}</ErrorText>}
          </>
        </Field>

        <div className="flex justify-between pt-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(-1)}
          >
            Volver
          </Button>

          <Button
            type="submit"
            disabled={saving || crearAsignar.isPending}
            size="sm"
          >
            {saving || crearAsignar.isPending
              ? "Guardando…"
              : !isEdit
                ? "Guardar grupo"
                : mostrarAltaDirectivos && (faltaDirector || faltaVicedirector)
                  ? "Guardar y registrar directivos"
                  : "Guardar cambios"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title="Finalizar cargo directivo"
        message="¿Estás seguro de finalizar este cargo? Esta acción removerá al directivo del equipo actual."
        items={
          directivoAFinalizar
            ? [`${directivoAFinalizar.nombre_apellido} — ${directivoAFinalizar.cargo}`]
            : []
        }
        confirmText={
          finalizarDirectivo.isPending ? "Finalizando..." : "Aceptar"
        }
        confirmDisabled={!fechaFin || finalizarDirectivo.isPending}
        onCancel={cerrarConfirmFinalizar}
        onConfirm={handleFinalizarDirectivo}
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Fecha de finalización
          </label>
          <input
            type="date"
            className="input"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
          {!fechaFin && (
            <p className="text-sm text-red-600">
              Debe ingresar una fecha de finalización.
            </p>
          )}
        </div>
      </ConfirmDialog>

      <SuccessToast
        open={showSuccess}
        message={successMessage}
        onClose={() => setShowSuccess(false)}
      />
    </section>
  );
}