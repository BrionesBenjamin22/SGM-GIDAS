import { createPortal } from "react-dom";
import { calendarPosition } from "@/utils/calendarPosition";
import { dateKey, dateRange, civilDate, formatEventDates } from "@/utils/eventDates";
import { useEffect, useLayoutEffect, useId, useMemo, useRef, useState } from "react";
import { getInstitutionalMinDate } from "@/utils/dateTime";
import { calendarValidationMessage } from "@/utils/calendarValidation";
import { formatDateInput, replaceDateDigit } from "@/utils/dateInput";

type CommonDatePickerProps = {
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  className?: string; // para pasar "input" o estilos propios
  helperText?: string; // ej: "DD/MM/YYYY"
  disabled?: boolean;
  institutionalRange?: boolean;
};

type SingleDatePickerProps = CommonDatePickerProps & {
  mode?: "single";
  value: Date | null;
  onChange: (date: Date | null) => void;
};
type MultipleDatePickerProps = CommonDatePickerProps & {
  mode: "multiple";
  value: Date[];
  onChange: (dates: Date[]) => void;
};
type DatePickerProps = SingleDatePickerProps | MultipleDatePickerProps;

export default function DatePicker(props: DatePickerProps) {
  return props.mode === "multiple" ? <MultipleDatePicker {...props} /> : <SingleDatePicker {...props} />;
}

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

function stripTime(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDateInput(value: string) {
  const trimmed = value.trim();
  const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const day = slashMatch ? Number(slashMatch[1]) : NaN;
  const month = slashMatch ? Number(slashMatch[2]) : NaN;
  const year = slashMatch ? Number(slashMatch[3]) : NaN;

  if (!day || !month || !year) return null;

  const parsed = new Date(year, month - 1, day);
  const isValid =
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day;

  return isValid ? parsed : null;
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

function SingleDatePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = "DD/MM/AAAA",
  className = "input",
  helperText,
  disabled = false,
  institutionalRange = true,
}: SingleDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<Date>(() => value ?? new Date());
  const [temp, setTemp] = useState<Date | null>(value ?? null);
  const [inputValue, setInputValue] = useState(() => fmt(value));
  const [inputError, setInputError] = useState("");
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const resolvedHelperText =
    helperText ??
    (institutionalRange ? "Desde 01/01/2010 · DD/MM/AAAA" : "DD/MM/AAAA");

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
    setInputValue(fmt(value));
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

  const effectiveMinDate = useMemo(() => {
    if (!institutionalRange) return minDate;
    const institutionalMinDate = getInstitutionalMinDate();
    return minDate && minDate > institutionalMinDate
      ? minDate
      : institutionalMinDate;
  }, [institutionalRange, minDate]);

  const isDateDisabled = (d: Date) =>
    (effectiveMinDate && d < stripTime(effectiveMinDate)) ||
    (maxDate && d > stripTime(maxDate));

  function commitTypedValue(nextValue: string, input?: HTMLInputElement, cursor?: number) {
    const maskedValue = formatDateInput(nextValue);
    setInputValue(maskedValue);
    if (input && cursor !== undefined) {
      const nextCursor = formatDateInput(nextValue.slice(0, cursor)).length;
      requestAnimationFrame(() => input.setSelectionRange(nextCursor, nextCursor));
    }

    if (!maskedValue) {
      setInputError("");
      setTemp(null);
      onChange(null);
      return;
    }

    if (maskedValue.length < 10) return;

    const parsed = parseDateInput(maskedValue);
    const message = calendarValidationMessage(maskedValue, parsed, effectiveMinDate, maxDate);
    setInputError(message);
    if (!parsed || message) return;

    const normalized = stripTime(parsed);
    setTemp(normalized);
    setView(normalized);
    onChange(normalized);
  }

  return (
    <div ref={rootRef} className="relative w-full">
      {label && <label htmlFor={inputId} className="block text-sm font-medium mb-2">{label}</label>}

      <div className="relative">
        <input
          type="text"
          id={inputId}
          aria-label={label ?? "Fecha"}
          aria-invalid={Boolean(inputError)}
          aria-describedby={`${inputId}-feedback`}
          className={`${className} ${inputError ? "!border-red-500 !ring-2 !ring-red-500" : ""}`}
          value={inputValue}
          placeholder={placeholder}
          autoComplete="off"
          inputMode="numeric"
          maxLength={10}
          onChange={(event) => commitTypedValue(event.target.value, event.target, event.target.selectionStart ?? undefined)}
          onBlur={(event) => {
            const parsed = parseDateInput(event.currentTarget.value);
            setInputError(calendarValidationMessage(event.currentTarget.value, parsed, effectiveMinDate, maxDate));
            if (parsed && !isDateDisabled(parsed)) {
              const normalized = stripTime(parsed);
              setInputValue(fmt(normalized));
              setTemp(normalized);
              setView(normalized);
              onChange(normalized);
              return;
            }

            setInputValue(fmt(value));
          }}
          onKeyDown={(event) => {
            if (/^\d$/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
              const input = event.currentTarget;
              if (input.selectionStart === input.selectionEnd) {
                const replacement = replaceDateDigit(inputValue, input.selectionStart ?? 0, event.key);
                if (replacement) {
                  event.preventDefault();
                  commitTypedValue(replacement.value);
                  requestAnimationFrame(() => input.setSelectionRange(replacement.cursor, replacement.cursor));
                  return;
                }
              }
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              if (!disabled) setOpen(true);
            }

            if (event.key === "Enter") {
              event.preventDefault();
              event.currentTarget.blur();
              setOpen(false);
            }

            if (event.key === "Escape") {
              setInputError("");
              setInputValue(fmt(value));
              setOpen(false);
            }
          }}
          disabled={disabled}
        />
        <button
          type="button"
          aria-label="Abrir calendario"
          className="absolute top-1/2 -translate-y-1/2 right-2 rounded p-2 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
        >
          {/* ícono calendario */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M7 2v3M17 2v3M3 9h18M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      {(inputError || resolvedHelperText) && (
        <p id={`${inputId}-feedback`} role={inputError ? "alert" : undefined} className={`mt-1 text-xs ${inputError ? "text-red-600" : "text-slate-500"}`}>
          {inputError || resolvedHelperText}
        </p>
      )}

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
              const invalid = isDateDisabled(d);
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
                setInputError("");
                onChange(temp ?? null);
                setInputValue(fmt(temp ?? null));
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

function MultipleDatePicker({ value, onChange, label, disabled, className, helperText,
  minDate, maxDate, institutionalRange = true }: MultipleDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Date[]>([]);
  const [base, setBase] = useState<Date[]>([]);
  const [anchor, setAnchor] = useState<Date | null>(null);
  const [hovered, setHovered] = useState<Date | null>(null);
  const [appendNext, setAppendNext] = useState(false);
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [manualDirty, setManualDirty] = useState(false);
  const [inputError, setInputError] = useState("");
  const [view, setView] = useState<Date>(value[0] ?? new Date());
  const [position, setPosition] = useState({ top: 8, left: 8, width: 320, maxHeight: 480 });
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const minimum = institutionalRange && (!minDate || minDate < getInstitutionalMinDate()) ? getInstitutionalMinDate() : minDate;
  const invalid = (day: Date) => Boolean((minimum && dateKey(day) < dateKey(minimum)) || (maxDate && dateKey(day) > dateKey(maxDate)));
  const unique = (dates: Date[]) => [...new Set(dates.map(dateKey))].sort().map(civilDate);
  const close = () => { setOpen(false); trigger.current?.focus(); };

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      if (!trigger.current || !panel.current) return;
      const next = calendarPosition(trigger.current.getBoundingClientRect(), panel.current.scrollHeight,
        document.documentElement.clientWidth, window.innerHeight);
      setPosition(previous => previous.top === next.top && previous.left === next.left &&
        previous.width === next.width && previous.maxHeight === next.maxHeight ? previous : next);
    };
    place();
    const observer = new ResizeObserver(place);
    if (panel.current) observer.observe(panel.current);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus({ preventScroll: true });
    const outside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!trigger.current?.contains(target) && !panel.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [open]);

  function selectDay(day: Date) {
    if (invalid(day)) return;
    setView(day); setHovered(null); setInputError(""); setManualDirty(false);
    if (!anchor) {
      const previous = appendNext ? pending : [];
      setBase(previous); setAppendNext(false);
      setPending(unique([...previous, day])); setAnchor(day);
      setStartInput(fmt(day)); setEndInput("");
    } else {
      setPending(unique([...base, ...dateRange(anchor, day)]));
      setStartInput(fmt(anchor < day ? anchor : day)); setEndInput(fmt(anchor < day ? day : anchor));
      setAnchor(null);
    }
  }

  function applyManual() {
    if (!manualDirty) return;
    const start = parseDateInput(startInput);
    const end = endInput ? parseDateInput(endInput) : null;
    const message = !startInput ? "Ingrese la fecha de inicio." :
      calendarValidationMessage(startInput, start, minimum, maxDate) ||
      (endInput ? calendarValidationMessage(endInput, end, minimum, maxDate) : "");
    setInputError(message);
    if (!start || message) return;
    setPending(unique([...base, ...(end ? dateRange(start, end) : [start])]));
    setAnchor(end ? null : start); setView(start); setHovered(null); setAppendNext(false);
    setStartInput(fmt(end && end < start ? end : start));
    setEndInput(end ? fmt(end < start ? start : end) : "");
    setManualDirty(false);
  }

  const padding = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7;
  const preview = anchor && hovered ? new Set(dateRange(anchor, hovered).map(dateKey)) : new Set<string>();
  const selectedKeys = new Set(pending.map(dateKey));
  const summary = formatEventDates(pending.map(dateKey));
  const dialog = <div ref={panel} tabIndex={-1} id={`${id}-panel`} role="dialog" aria-label="Fechas del evento"
    style={position}
    className="fixed z-50 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white p-3 shadow-xl outline-none"
    onKeyDown={event => {
      if (event.key === "Escape") { event.stopPropagation(); close(); }
      if (event.key === "Tab") {
        const controls = Array.from(panel.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled)") ?? []);
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }}>
    <div className="mb-3 grid grid-cols-2 gap-2">
      {([['Inicio', startInput, setStartInput], ['Fin (opcional)', endInput, setEndInput]] as const).map(([text, input, setInput], index) =>
        <label key={text} className="text-xs font-medium text-slate-600">
          {text}
          <input type="text" inputMode="numeric" autoComplete="off" placeholder="DD/MM/AAAA" maxLength={10}
            value={input} aria-invalid={Boolean(inputError)} aria-describedby={inputError ? `${id}-error` : undefined}
            className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
            onChange={event => {
              setInput(formatDateInput(event.target.value)); setManualDirty(true); setInputError("");
              if (index === 0) { setEndInput(""); setBase([]); }
            }} onBlur={applyManual} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); applyManual(); } }} />
        </label>)}
    </div>
    {inputError && <p id={`${id}-error`} role="alert" className="mb-2 text-xs text-red-600">{inputError}</p>}
    <div className="mb-2 flex items-center justify-between">
      <button type="button" aria-label="Mes anterior" className="rounded px-3 py-1 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>‹</button>
      <span className="text-sm font-medium" aria-live="polite">{MONTHS_ES[view.getMonth()]} {view.getFullYear()}</span>
      <button type="button" aria-label="Mes siguiente" className="rounded px-3 py-1 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>›</button>
    </div>
    <div className="grid grid-cols-7 gap-y-1 text-center text-sm" onMouseLeave={() => setHovered(null)}>
      {DAYS_ES.map((day, i) => <span key={`label-${i}`} aria-hidden="true" className="py-1 text-xs text-slate-500">{day}</span>)}
      {/* Six weeks keep the popup and navigation controls still across months. */}
      {Array.from({ length: 42 }, (_, i) => {
        const number = i - padding + 1;
        if (number < 1 || number > daysInMonth(view.getFullYear(), view.getMonth())) {
          return <span key={`empty-${i}`} aria-hidden="true" className="h-9" />;
        }
        const day = new Date(view.getFullYear(), view.getMonth(), number, 12);
        const key = dateKey(day);
        const selected = selectedKeys.has(key);
        const isPreview = preview.has(key);
        return <button key={i} type="button" disabled={invalid(day)} aria-pressed={selected} aria-label={fmt(day)}
          className={`h-9 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:opacity-30 ${isPreview ? "bg-slate-200 text-slate-900" : selected ? "bg-slate-800 text-white" : "text-slate-700 hover:bg-slate-100"}`}
          onMouseEnter={() => { if (anchor && !invalid(day)) setHovered(day); }}
          onClick={() => selectDay(day)} onKeyDown={event => {
            const offset = ({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 } as Record<string, number>)[event.key];
            if (!offset) return;
            event.preventDefault(); const next = new Date(day); next.setDate(day.getDate() + offset);
            if (invalid(next)) return;
            setView(next); if (anchor) setHovered(next);
            requestAnimationFrame(() => panel.current?.querySelector<HTMLButtonElement>(`button[aria-label="${fmt(next)}"]`)?.focus());
          }}>{number}</button>;
      })}
    </div>
    <p className="mt-3 text-xs text-slate-600" aria-live="polite">
      {anchor ? "Seleccione otra fecha para completar el rango, o confirme esta jornada." : appendNext ? "Seleccione una jornada o el inicio de otro rango." : "Seleccione una fecha o dos para marcar un rango."}
    </p>
    <div className="mt-2 flex items-center justify-between gap-2">
      <span className="text-xs text-slate-600" role="status">{pending.length} {pending.length === 1 ? "jornada" : "jornadas"}</span>
      {pending.length > 0 && <button type="button" className="rounded px-2 py-1 text-xs font-medium underline focus-visible:ring-2 focus-visible:ring-slate-500"
        onClick={() => {
          setAppendNext(true); setAnchor(null); setHovered(null); setBase(pending);
          setStartInput(""); setEndInput(""); setInputError(""); setManualDirty(false);
        }}>Añadir fechas</button>}
    </div>
    <p className="mt-1 max-h-12 overflow-y-auto text-xs text-slate-500">{summary}</p>
    <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
      <button type="button" className="rounded px-2 py-2 text-sm hover:bg-slate-100" onClick={() => {
        setPending([]); setBase([]); setAnchor(null); setHovered(null); setAppendNext(false);
        setStartInput(""); setEndInput(""); setInputError(""); setManualDirty(false);
      }}>Limpiar</button>
      <button type="button" className="rounded px-2 py-2 text-sm hover:bg-slate-100" onClick={close}>Cancelar</button>
      <button type="button" disabled={Boolean(inputError) || manualDirty} className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
        onClick={() => { onChange(pending); close(); }}>Confirmar</button>
    </div>
  </div>;

  return <div className="relative w-full max-w-xs">
    {label && <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>}
    <button ref={trigger} id={id} type="button" disabled={disabled} role="combobox"
      aria-label={label ?? "Fechas del evento"} aria-haspopup="dialog" aria-expanded={open}
      aria-controls={`${id}-panel`} aria-describedby={`${id}-help`}
      className={`${className || "input"} w-full text-left`} title={value.length ? formatEventDates(value.map(dateKey)) : undefined}
      onClick={() => {
        if (open) { close(); return; }
        setPending(unique(value)); setBase([]); setAnchor(null); setHovered(null); setAppendNext(false);
        setStartInput(""); setEndInput(""); setInputError(""); setManualDirty(false);
        setView(value[0] ?? new Date()); setOpen(true);
      }}>
      <span className="block truncate">{value.length ? formatEventDates(value.map(dateKey)) : "Seleccionar fechas del evento"}</span>
    </button>
    <p id={`${id}-help`} className="mt-1 text-xs text-slate-500">{helperText ?? "Desde 01/01/2010. Seleccione una fecha o un rango."}</p>
    {open && createPortal(dialog, document.body)}
  </div>;
}
