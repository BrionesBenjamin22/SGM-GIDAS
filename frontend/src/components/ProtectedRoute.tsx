import { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { Rol } from "@/modules/auth/services/authService";

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRole?: Rol;
  allowedRoles?: Rol[];
}

export default function ProtectedRoute({
  children,
  requiredRole,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading, isAdmin, debeCambiarPassword } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center" role="status" aria-live="polite">
        <p className="text-sm text-slate-600">Verificando sesión...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const enCambioPassword = location.pathname === "/cambiar-password";

  if (debeCambiarPassword() && !enCambioPassword) {
    return <Navigate to="/cambiar-password" replace />;
  }

  if (requiredRole || allowedRoles?.length) {
    const tieneRol =
      allowedRoles?.includes(user.rol) ??
      (requiredRole === "ADMIN" ? isAdmin() : user.rol === requiredRole);

    if (!tieneRol) {
      return <Navigate to="/inicio" replace />;
    }
  }

  return children;
}
