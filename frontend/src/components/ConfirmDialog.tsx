import type { ReactNode } from "react";
import Button from "@/components/Button";

type Props = {
  open: boolean;
  title: string;
  message?: string;
  items?: string[];
  children?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  items = [],
  children,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  confirmDisabled = false,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>

        {message && (
          <p className="mb-3 text-sm text-slate-600">
            {message}
          </p>
        )}

        {items.length > 0 && (
          <ul className="mb-4 max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {items.map((name) => (
              <li key={name} className="py-0.5">
                • {name}
              </li>
            ))}
          </ul>
        )}

        {children && <div className="mb-4">{children}</div>}

        <div className="flex justify-between">
          <Button
            variant="secondary"
            size="sm"
            className="px-3 py-1 text-xs"
            onClick={onCancel}
          >
            {cancelText}
          </Button>

          <Button
            size="sm"
            className="px-3 py-1 text-xs"
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}