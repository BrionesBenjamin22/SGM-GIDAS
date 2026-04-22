import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { JSX } from "react";
import type { Rol } from "@/services/authService";

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
      <div className="min-h-screen grid place-items-center text-slate-600">
        Cargando sesión…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const enCambioPassword = location.pathname === "/cambiar-password";

  // Si está en primer login, obligarlo a pasar por cambiar contraseña
  if (debeCambiarPassword() && !enCambioPassword) {
    return <Navigate to="/cambiar-password" replace />;
  }

  // Verificación de rol si aplica
  if (requiredRole || allowedRoles?.length) {
    const tieneRol =
      allowedRoles?.includes(user.rol) ??
      (requiredRole === "ADMIN" ? isAdmin() : user.rol === requiredRole);

    if (!tieneRol) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
