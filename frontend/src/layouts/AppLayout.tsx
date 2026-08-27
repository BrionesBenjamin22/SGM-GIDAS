import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Lock, LogOut, Shield, User } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsProfileOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const roleLabel = isAdmin()
    ? "Administrador"
    : user?.rol === "LECTURA"
      ? "Lector"
      : "Gestor";

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
  };

  return (
    <div className="min-h-screen bg-[#F6F6FB] text-slate-800 flex flex-col">
      <header className="w-full flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white h-[56px]">
        <Sidebar />
        <h1 className="font-semibold text-sm tracking-tight"></h1>

        <div ref={profileMenuRef} className="relative">
          <button
            type="button"
            title="Usuario"
            aria-label="Abrir opciones del perfil"
            aria-expanded={isProfileOpen}
            aria-controls="navbar-profile-menu"
            onClick={() => setIsProfileOpen((current) => !current)}
            className="flex items-center justify-center rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <User aria-hidden="true" className="h-6 w-6" />
          </button>

          {isProfileOpen && (
            <div
              id="navbar-profile-menu"
              className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
            >
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user?.nombre_usuario}
                </p>
                <p className="truncate text-xs text-slate-500">{user?.mail}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  {isAdmin() && <Shield aria-hidden="true" className="h-3.5 w-3.5" />}
                  {roleLabel}
                </p>
              </div>

              <nav aria-label="Opciones del perfil" className="p-2 text-sm">
                <NavLink
                  to="/mi-perfil"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-50"
                >
                  <User aria-hidden="true" className="h-4 w-4" />
                  Mi perfil
                </NavLink>
                <NavLink
                  to="/cambiar-password"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-50"
                >
                  <Lock aria-hidden="true" className="h-4 w-4" />
                  Cambiar contraseña
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-rose-700 hover:bg-rose-50"
                >
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-10 py-4">
          <Outlet />
        </div>
      </main>

      <Footer />
    </div>
  );
}
