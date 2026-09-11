import { Clock3, LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import Button from "@/components/Button";

type Props = {
  open: boolean;
  remainingSeconds: number;
  extending: boolean;
  error: string;
  onContinue: () => void;
  onLogout: () => void;
};

export default function SessionExpiryDialog({
  open,
  remainingSeconds,
  extending,
  error,
  onContinue,
  onLogout,
}: Props) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open) return null;
  const minutes = Math.max(1, Math.ceil(remainingSeconds / 60));

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 px-4">
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-warning-title"
        aria-describedby="session-warning-description"
        className="w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-xl"
      >
        <Clock3 className="mb-4 h-8 w-8 text-amber-600" aria-hidden="true" />
        <h2 id="session-warning-title" className="text-xl font-semibold text-slate-900">
          Su sesión está por vencer
        </h2>
        <p id="session-warning-description" className="mt-2 text-sm text-slate-600">
          Quedan aproximadamente {minutes} {minutes === 1 ? "minuto" : "minutos"}.
          Puede continuar sin perder el trabajo que está completando.
        </p>
        {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onLogout} disabled={extending}>
            Cerrar sesión
          </Button>
          <Button type="button" onClick={onContinue} disabled={extending}>
            {extending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Continuar sesión
          </Button>
        </div>
      </section>
    </div>
  );
}
