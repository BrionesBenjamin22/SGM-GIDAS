import { useEffect, useMemo, useRef, useState } from "react";

type DatePickerProps = {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  className?: string; // para pasar "input" o estilos propios
  helperText?: string; // ej: "DD/MM/YYYY"
};

const MONTHS_ES = [
  "Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic",
];
// Si preferís “X” para miércoles, usá ["L","M","X","J","V","S","D"]
const DAYS_ES = ["L","M","M","J","V","S","D"];

function fmt(date: Date | null) {
  if (!date) return "";
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function daysInMonth(year: number, monthIdx: number) {
  return new Date(year, monthIdx + 1, 0).getDate();
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function DatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "DD/MM/AAAA",
  className = "input",
  helperText = "DD/MM/AAAA",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => value ?? new Date());
  const [temp, setTemp] = useState<Date | null>(value ?? null);
  const rootRef = useRef<HTMLDivElement>(null);

  // cerrar al click fuera
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    setTemp(value ?? null);
    if (value) setView(value);
  }, [value]);

  const grid = useMemo(() => {
    const y = view.getFullYear();
    const m = view.getMonth();
    const first = new Date(y, m, 1);

    // Semana que empieza en Lunes
    // getDay(): 0=Dom,1=Lun,...6=Sáb  => convertimos a índice Lunes=0
    const pad = (first.getDay() + 6) % 7;

    const total = daysInMonth(y, m);
    const cells: (Date | null)[] = [];

    for (let i = 0; i < pad; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(new Date(y, m, d));
    // completar última fila
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [view]);

  const disabled = (d: Date) =>
    (minDate && d < stripTime(minDate)) || (maxDate && d > stripTime(maxDate));

  function stripTime(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  return (
    <div ref={rootRef} className="relative w-full">
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}

      {/* Input visual (readonly) */}
      <div className="relative">
        <input
          readOnly
          className={className}
          value={fmt(value)}
          placeholder={placeholder}
          onClick={() => setOpen((o) => !o)}
        />
        <button
          type="button"
          aria-label="Abrir calendario"
          className="absolute top-1/2 -translate-y-1/2 right-2 rounded p-2 hover:bg-slate-100"
          onClick={() => setOpen((o) => !o)}
        >
          {/* ícono calendario */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M7 2v3M17 2v3M3 9h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      {helperText && <p className="mt-1 text-xs text-slate-500">{helperText}</p>}

      {/* Popover calendario */}
      {open && (
        <div className="absolute z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white/90 shadow-lg backdrop-blur p-3">
          {/* header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              className="px-2 py-1 rounded hover:bg-slate-100"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
            >
              ‹
            </button>
            <div className="font-medium">
              {MONTHS_ES[view.getMonth()]} {view.getFullYear()}
            </div>
            <button
              type="button"
              className="px-2 py-1 rounded hover:bg-slate-100"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
            >
              ›
            </button>
          </div>

          {/* week header en español (lunes primero) */}
          <div className="grid grid-cols-7 text-center text-xs text-slate-500 mb-1">
            {DAYS_ES.map((d, idx) => (
              <div key={idx} className="py-1">{d}</div>
            ))}
          </div>

          {/* days grid */}
          <div className="grid grid-cols-7 gap-1">
            {grid.map((d, i) => {
              if (!d) return <div key={i} className="h-8" />;
              const selected = isSameDay(d, temp);
              const invalid = disabled(d);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={invalid}
                  onClick={() => setTemp(d)}
                  className={[
                    "h-8 rounded-full text-sm",
                    selected ? "bg-red-500 text-white" : "hover:bg-slate-100",
                    invalid ? "text-slate-300 cursor-not-allowed hover:bg-transparent" : "text-slate-700",
                  ].join(" ")}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {/* actions */}
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded hover:bg-slate-100"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-3 py-1.5 text-sm rounded bg-black text-white hover:opacity-90"
              onClick={() => {
                onChange(temp ?? null);
                setOpen(false);
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
