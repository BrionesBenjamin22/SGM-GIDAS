import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type Props = {
  open: boolean;
  message: string;
  onClose: () => void;
  variant?: "success" | "error";
  duration?: number;
};

export default function SuccessToast({
  open,
  message,
  onClose,
  variant = "success",
  duration = 3500,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  const isError = variant === "error";

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2">
      <div
        className={`w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl shadow-xl border px-4 py-4 ${
          isError
            ? "bg-red-600 border-red-700 text-white"
            : "bg-emerald-600 border-emerald-700 text-white"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {isError ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {isError ? "No se pudo completar la acción" : "Operación realizada correctamente"}
            </p>
            <p className="text-sm leading-relaxed mt-1 opacity-95 break-words">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1 hover:bg-white/10 transition-colors"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}