import type React from "react";
import { Children, isValidElement, useEffect, useId, useRef } from "react";

function hasInlineError(children: React.ReactNode, error: string): boolean {
  return Children.toArray(children).some(child => {
    if (!isValidElement<{ children?: React.ReactNode }>(child)) return false;
    return (child.type === "p" && child.props.children === error) ||
      hasInlineError(child.props.children, error);
  });
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  name?: string;
}

export default function Field({
  label,
  children,
  error,
  required,
  name,
}: FieldProps) {
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const inlineError = !!error && hasInlineError(children, error);
  useEffect(() => {
    const control = root.current?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input:not([type=hidden]):not([type=checkbox]), select, textarea");
    const label = root.current?.querySelector("label");
    if (!control) return;
    if (!control.id) control.id = `${id}-control`;
    if (label) label.htmlFor = control.id;
    if (!error) return;
    const paragraph = Array.from(root.current?.querySelectorAll("p") ?? []).find(node => node.textContent === error);
    if (paragraph) {
      if (!paragraph.id) paragraph.id = `${id}-error`;
      paragraph.setAttribute("role", "alert");
    }
    const previousInvalid = control.getAttribute("aria-invalid");
    const previousDescription = control.getAttribute("aria-describedby");
    const description = Array.from(new Set([...(previousDescription?.split(/\s+/) ?? []), paragraph?.id ?? `${id}-error`])).join(" ");
    control.setAttribute("aria-invalid", "true");
    control.setAttribute("aria-describedby", description);
    return () => {
      // Preserve attributes that React already updated when the error was cleared.
      if (control.getAttribute("aria-invalid") === "true") {
        if (previousInvalid === null) control.removeAttribute("aria-invalid");
        else control.setAttribute("aria-invalid", previousInvalid);
      }
      if (control.getAttribute("aria-describedby") === description) {
        if (previousDescription === null) control.removeAttribute("aria-describedby");
        else control.setAttribute("aria-describedby", previousDescription);
      }
    };
  }, [children, error, id]);
  return (
    <div ref={root} data-error-field={name} tabIndex={error ? -1 : undefined} className={error ? "[&_input]:!border-rose-500 [&_select]:!border-rose-500 [&_textarea]:!border-rose-500" : undefined}>
      <label className="block text-sm font-medium mb-2">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
      {error && !inlineError && (
        <p id={`${id}-error`} role="alert" className="text-xs text-rose-600 mt-1.5">{error}</p>
      )}
    </div>
  );
}
