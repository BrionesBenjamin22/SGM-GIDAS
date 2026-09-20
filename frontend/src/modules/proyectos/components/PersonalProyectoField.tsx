import { X } from "lucide-react";

import Button from "@/components/Button";

export type PersonaOption = {
  id: number;
  nombre_apellido: string;
};

type Props = {
  value: number[];
  options: PersonaOption[];
  onChange: (ids: number[]) => void;
  label?: string;
  isEdit?: boolean;
  onRemoveConfirm?: (personaId: number) => void;
  disabled?: boolean;
};

export default function PersonalProyectoField({
  value,
  options,
  onChange,
  label,
  isEdit = false,
  onRemoveConfirm,
  disabled = false,
}: Props) {
  const addField = () => {
    if (!disabled) onChange([...value, 0]);
  };

  const removeField = (index: number) => {
    if (disabled) return;
    const removedId = value[index];
    if (isEdit && onRemoveConfirm && removedId) {
      onRemoveConfirm(removedId);
      return;
    }
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  };

  const changeValue = (index: number, id: number) => {
    if (disabled) return;
    const next = [...value];
    next[index] = id;
    onChange(next);
  };

  const usedIds = value.filter(Boolean);

  return (
    <div className={`space-y-4 ${disabled ? "opacity-60" : ""}`}>
      {label && <span className="block text-sm font-medium">{label}</span>}

      {value.map((selectedId, index) => {
        const availableOptions = options.filter(
          (option) => !usedIds.includes(option.id) || option.id === selectedId
        );
        const selectedName = options.find((option) => option.id === selectedId)?.nombre_apellido;

        return (
          <div key={`${selectedId}-${index}`} className="flex items-center gap-2">
            <select
              aria-label={label ? `${label} ${index + 1}` : `Integrante ${index + 1}`}
              className="input flex-1"
              value={selectedId || ""}
              onChange={(event) => changeValue(index, Number(event.target.value))}
              disabled={disabled}
            >
              <option value="" disabled>Seleccionar</option>
              {availableOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.nombre_apellido}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 w-9 p-0 text-rose-700 hover:bg-rose-50"
              title="Quitar"
              aria-label={`Quitar ${selectedName ?? "seleccion"}`}
              onClick={() => removeField(index)}
              disabled={disabled}
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        );
      })}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={addField}
        disabled={disabled}
      >
        Agregar nuevo
      </Button>
    </div>
  );
}
