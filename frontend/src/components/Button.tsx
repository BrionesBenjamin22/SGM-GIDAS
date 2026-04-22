import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: Props) {
  const sizeClasses =
    size === "sm"
      ? "text-sm px-3 py-1.5"
      : size === "lg"
        ? "text-lg px-6 py-3"
        : "text-base px-4 py-2";

  const variantClasses =
    variant === "primary"
      ? "bg-slate-900 text-white hover:opacity-90"
      : "bg-slate-200 text-slate-900 hover:bg-slate-300";

  return (
    <button
      type={type}
      className={`rounded-lg font-medium transition disabled:opacity-50 ${sizeClasses} ${variantClasses} ${className}`}
      {...rest}
    />
  );
}