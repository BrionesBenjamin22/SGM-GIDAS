import type React from "react";
import { AlertCircle } from "lucide-react";

export default function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;

  return (
    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <p className="text-sm md:text-base font-medium text-red-700 leading-relaxed">
          {children}
        </p>
      </div>
    </div>
  );
}