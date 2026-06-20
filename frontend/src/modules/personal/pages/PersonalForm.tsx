import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Button from "@/components/Button";
import SuccessToast from "@/components/SuccessToast";
import { useUctGuard } from "@/modules/grupo/hooks/useUctGuard";

import FormPTAAProfesional from "./FormPTAAProfesional";
import FormBecario from "./FormBecario";
import FormInvestigador from "./FormInvestigador";

import { getPersonalCompletoByRolAndId } from "@/modules/personal/services/personalCompletoServices";

type Tipo = "" | "PTAA" | "PROFESIONAL" | "BECARIO" | "INVESTIGADOR";

export default function PersonalForm() {
  const { rol: paramRol, id } = useParams<{ rol?: string; id?: string }>();
  const { uctGuard } = useUctGuard();

  const navigate = useNavigate();
  const location = useLocation();

  // Infer role from URL path when :rol param is absent
  // e.g. /becarios/5/editar -> "becario", /investigadores/5/editar -> "investigador"
  const inferredRol = (() => {
    if (paramRol) return paramRol;
    const path = location.pathname;
    if (path.includes("/becarios/")) return "becario";
    if (path.includes("/investigadores/")) return "investigador";
    return undefined;
  })();

  const isEdit = Boolean(id && inferredRol);

  const { data: initialData, isLoading } = useQuery({
    queryKey: ["personal-edit", inferredRol, id],
    queryFn: () => getPersonalCompletoByRolAndId(inferredRol!, Number(id)),
    enabled: Boolean(inferredRol && id),
  });

  const [tipo, setTipo] = useState<Tipo>("");
  const [errorTipo, setErrorTipo] = useState(false);

  // 🔥 TOAST STATE
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // 🔥 Escuchar mensaje desde navigate(state)
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);

      // limpiar state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state]);

  useEffect(() => {
    const r = inferredRol;
    if (!r) return;

    const rolMap: Record<string, Tipo> = {
      personal: "PTAA",
      profesional: "PROFESIONAL",
      becario: "BECARIO",
      investigador: "INVESTIGADOR",
    };

    const mapped = rolMap[r.toLowerCase()];
    if (mapped) setTipo(mapped);
  }, [inferredRol]);

  if (isLoading) return <p>Cargando…</p>;

  const handleTipoChange = (value: Tipo) => {
    setTipo(value);
    if (value) setErrorTipo(false);
  };

  return (
    <section className="w-full">
      <h2 className="text-2xl md:text-3xl font-semibold leading-none">
        {isEdit ? "Editar personal" : "Nuevo personal"}
      </h2>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-6">

        {!isEdit && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Tipo de personal
            </label>

            <select
              className={`input ${errorTipo ? "border-red-500 ring-2 ring-red-500 bg-red-50" : ""
                }`}
              value={tipo}
              onChange={(e) => handleTipoChange(e.target.value as Tipo)}
              onBlur={() => {
                if (!tipo) setErrorTipo(true);
              }}
            >
              <option value="">
                Selecciona el rol del personal
              </option>
              <option value="PTAA">PTAA</option>
              <option value="PROFESIONAL">Personal Profesional</option>
              <option value="BECARIO">Becario</option>
              <option value="INVESTIGADOR">Investigador</option>
            </select>

            {errorTipo && (
              <p className="text-red-500 text-sm mt-1">
                Debe seleccionar el rol del personal
              </p>
            )}
          </div>
        )}

        {!tipo && !isEdit && (
          <div className="border-t border-slate-200 pt-6 flex justify-start">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="px-3 py-1 text-xs"
              onClick={() => navigate(-1)}
            >
              Volver
            </Button>
          </div>
        )}

        {(tipo === "PTAA" || tipo === "PROFESIONAL") && (
          <FormPTAAProfesional
            key={`${tipo}-${id ?? "new"}`}
            tipo={tipo}
            initialData={initialData}
            onCancel={() => navigate(-1)}
          />
        )}

        {tipo === "BECARIO" && (
          <FormBecario
            key={`${tipo}-${id ?? "new"}`}
            initialData={initialData}
            onCancel={() => navigate(-1)}
          />
        )}

        {tipo === "INVESTIGADOR" && (
          <FormInvestigador
            key={`${tipo}-${id ?? "new"}`}
            initialData={initialData}
            onCancel={() => navigate(-1)}
          />
        )}
      </div>

      {/* UCT GUARD */}
      {uctGuard}

      {/* 🔥 SUCCESS TOAST */}
      <SuccessToast
        open={showSuccess}
        message={successMessage}
        onClose={() => setShowSuccess(false)}
      />
    </section>
  );
}
