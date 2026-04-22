import * as React from "react";

type TarjetaPropiedades<T> = {
  item: T;
  title: (item: T) => React.ReactNode;
  subtitle?: (item: T) => React.ReactNode;
  onClick?: () => void;

  selectable?: boolean;
  selected?: boolean;
  onSelectChange?: (checked: boolean) => void;
  selectDisabled?: boolean;

  badge?: (item: T) => React.ReactNode;

  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export default function Tarjeta<T>({
  item,
  title,
  subtitle,
  onClick,
  selectable = false,
  selected = false,
  onSelectChange,
  selectDisabled = false,
  badge,
  className = "",
  titleClassName = "",
  subtitleClassName = "",
}: TarjetaPropiedades<T>) {
  const badgeValue = badge?.(item);
  const badgeText =
    typeof badgeValue === "string" ? badgeValue.toLowerCase().trim() : "";

const badgeClassName =
  badgeText === "cerrado"
    ? "bg-amber-100 text-amber-700"
    : badgeText === "activo" || badgeText === "activa"
      ? "bg-emerald-100 text-emerald-700"
      : badgeText === "eliminado" ||
        badgeText === "eliminada" ||
        badgeText === "inactivo" ||
        badgeText === "inactiva"
        ? "bg-rose-100 text-rose-700"
        : "bg-slate-100 text-slate-700";

  return (
    <div
      className={[
        "relative w-full rounded-xl border border-slate-200 bg-white/80 px-6 py-6",
        "shadow-sm transition-shadow",
        selectable && !selectDisabled ? "hover:shadow" : "",
        selectable ? "pr-16" : "",
        selectDisabled ? "opacity-70" : "",
        className,
      ].join(" ")}
    >
      {selectable && (
        <div className="absolute inset-y-0 right-4 flex items-center">
          <input
            type="checkbox"
            checked={selected}
            disabled={selectDisabled}
            onChange={(e) => onSelectChange?.(e.target.checked)}
            className="h-4 w-4 accent-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      )}

      <button
        type="button"
        onClick={selectable ? undefined : onClick}
        disabled={selectable && selectDisabled}
        className={[
          "w-full text-left",
          selectDisabled ? "cursor-not-allowed" : "",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3">
          <div className={["font-semibold text-lg", titleClassName].join(" ")}>
            {title(item)}
          </div>

        {badgeValue && (
          <div className="shrink-0">
            {typeof badgeValue === "string" ? (
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${badgeClassName}`}
              >
                {badgeValue.toUpperCase()}
              </span>
            ) : (
              badgeValue
            )}
          </div>
        )}
        </div>

        {subtitle && (
          <div
            className={[
              "mt-1 text-sm text-slate-500",
              subtitleClassName,
            ].join(" ")}
          >
            {subtitle(item)}
          </div>
        )}
      </button>
    </div>
  );
}