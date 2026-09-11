import { FileClock } from "lucide-react";
import Button from "@/components/Button";

type Props = {
  savedAt: string;
  onRestore: () => void;
  onDiscard: () => void;
};

export default function DraftRecoveryNotice({ savedAt, onRestore, onDiscard }: Props) {
  const savedLabel = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(savedAt));

  return (
    <section role="status" className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-950">
      <div className="flex items-start gap-3">
        <FileClock className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">Encontramos un borrador sin guardar</h3>
          <p className="mt-1 text-sm text-sky-800">Guardado localmente el {savedLabel}. Elija si desea recuperarlo o descartarlo.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={onRestore}>Recuperar borrador</Button>
            <Button type="button" size="sm" variant="secondary" onClick={onDiscard}>Descartar</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
