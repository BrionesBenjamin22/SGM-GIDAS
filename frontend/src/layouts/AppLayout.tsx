import { Outlet, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { User, Shield, ChevronDown, LogOut, Lock } from "lucide-react";

export default function AppLayout() {
  const { logout, user, isAdmin } = useAuth();
  const nav = useNavigate();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const rolLabel = isAdmin()
    ? "Administrador"
    : user?.rol === "LECTURA"
      ? "Lector"
      : "Gestor";

  return (
    <div className="min-h-screen bg-[#F6F6FB] text-slate-800 flex flex-col">
      <header className="w-full flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white h-[56px]">
        <Sidebar />

        <h1 className="font-semibold text-sm tracking-tight"></h1>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-1 p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <User className="w-6 h-6 text-slate-600" />
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="font-medium text-slate-900">
                  {user?.nombre_usuario}
                </p>
                <p className="text-xs text-slate-500">{user?.mail}</p>

                <span
                  className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                    isAdmin()
                      ? "bg-purple-50 text-purple-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {isAdmin() && <Shield className="w-3 h-3" />}
                  {rolLabel}
                </span>
              </div>

              <button
                onClick={() => {
                  setOpen(false);
                  nav("/mi-perfil");
                }}
                className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                <User className="w-4 h-4" />
                Mi perfil
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                  nav("/cambiar-password");
                }}
                className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                <Lock className="w-4 h-4" />
                Cambiar contraseña
              </button>

              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
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