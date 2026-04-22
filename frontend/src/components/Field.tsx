import type React from "react";

interface FieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}

export default function Field({
  label,
  children,
  error,
  required,
}: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-rose-600 mt-1.5">{error}</p>
      )}
    </div>
  );
}
