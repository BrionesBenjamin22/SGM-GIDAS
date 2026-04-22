import { useState } from "react";
import Button from "@/components/Button";
import DatePicker from "@/components/Calendar";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onCancel: () => void;
  onConfirm: (date: Date) => void;
};

export default function CerrarProyectoDialog({
  open,
  onCancel,
  onConfirm,
}: Props) {
  const [fechaFin, setFechaFin] = useState<Date | null>(new Date());
useEffect(() => {
  if (open) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "auto";
  }

  return () => {
    document.body.style.overflow = "auto";
  };
}, [open]);


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 overflow-y-auto">


      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div
  className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg my-10"
  onClick={(e) => e.stopPropagation()}
>

        <h3 className="text-lg font-semibold mb-4">
          Cerrar proyecto
        </h3>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Fecha de cierre
          </label>

          <DatePicker
            value={fechaFin}
            onChange={setFechaFin}
            className="input"
          />
        </div>

        <div className="flex justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
          >
            Cancelar
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (fechaFin) onConfirm(fechaFin);
            }}
          >
            Confirmar cierre
          </Button>
        </div>
      </div>
    </div>
  );
}
