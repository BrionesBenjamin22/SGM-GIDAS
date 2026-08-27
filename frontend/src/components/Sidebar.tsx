import { Fragment, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, type To } from "react-router-dom";
import { ChevronDown, Lock, LogOut, Menu, Shield, User, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Item = { label: string; to?: To; children?: Item[] };

const baseItems: Item[] = [
  { label: "Inicio", to: "/inicio" },
  {
    label: "Personal",
    children: [
      { label: "Ver todo el personal", to: "/personal" },
      {
        label: "Investigador/a",
        children: [{ label: "Actividades en Docencia", to: "/docenciaInvestigador" }],
      },
    ],
  },
  { label: "Proyectos", to: "/proyectos" },
  {
    label: "Actividades I+D+I",
    children: [
      { label: "Registros de Propiedad", to: "/registros-propiedad" },
      { label: "Trabajos en Reunión Científica", to: "/trabajos-reunion" },
      { label: "Trabajos en Revistas", to: "/trabajos-revistas" },
      { label: "Distinciones Recibidas", to: "/distinciones" },
      { label: "Artículos de Divulgación", to: "/articulos-divulgacion" },
      { label: "Participaciones Relevantes", to: "/participaciones" },
      { label: "Visitantes del país y del extranjero", to: "/visitantes" },
    ],
  },
  { label: "Equipamiento e Infraestructura", to: "/equipamiento" },
  { label: "Resumen de Ingresos y Egresos", to: "/erogaciones" },
  { label: "Documentación y Biblioteca", to: "/documentacion" },
  { label: "Memorias", to: "/memorias" },
  {
    label: "Vinculación Socio-Productiva",
    children: [{ label: "Transferencias", to: "/transferencias" }],
  },
  { label: "Búsqueda", to: "/busqueda" },
];

const adminItems: Item[] = [
  { label: "Inicio", to: "/inicio" },
  { label: "Administración", to: "/administracion" },
  { label: "Búsqueda", to: "/busqueda" },
];

const catalogosItem: Item = { label: "Gestionar Catálogos", to: "/catalogos" };

export default function Sidebar() {
  const { user, logout, isAdmin, isGestor } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const close = () => {
    setIsOpen(false);
    setTimeout(() => setIsVisible(false), 300);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isVisible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isVisible]);

  const open = () => {
    setIsVisible(true);
    setTimeout(() => setIsOpen(true), 10);
  };

  const toggleNode = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const keyFrom = (label: string, to: To | undefined, idx: number, parentKey: string) => {
    const base = `${parentKey}/${idx}-${label}`;
    if (typeof to === "string") return `${base}::${to}`;
    if (to && typeof to === "object") {
      return `${base}::${to.pathname ?? ""}${to.search ?? ""}${to.hash ?? ""}`;
    }
    return `${base}::nolink`;
  };

  const resolvedNodes = isAdmin()
    ? adminItems
    : isGestor()
      ? [...baseItems, catalogosItem]
      : baseItems;

  const roleLabel = isAdmin()
    ? "Administrador"
    : user?.rol === "LECTURA"
      ? "Lector"
      : "Gestor";

  const handleLogout = async () => {
    close();
    await logout();
  };

  const MenuList = ({
    nodes,
    parentKey = "root",
    level = 0,
  }: {
    nodes: Item[];
    parentKey?: string;
    level?: number;
  }) => (
    <ul className={level === 0 ? "select-none" : "pl-5 border-l border-black/10"}>
      {nodes.map((node, idx) => {
        const hasChildren = !!node.children?.length;
        const key = keyFrom(node.label, node.to, idx, parentKey);
        const isNodeOpen = !!expanded[key];

        return (
          <li key={key} className="mb-1">
            <div className="flex items-stretch border-b border-black/10">
              {node.to ? (
                <NavLink
                  to={node.to}
                  onClick={close}
                  end
                  className={({ isActive }) =>
                    `flex-1 px-3 py-3 hover:bg-black/5 ${
                      level === 0 ? "text-slate-900" : "text-slate-700"
                    } ${isActive ? "font-semibold" : ""}`
                  }
                >
                  {node.label}
                </NavLink>
              ) : (
                <span className={`flex-1 px-3 py-3 ${level === 0 ? "text-slate-900" : "text-slate-700"}`}>
                  {node.label}
                </span>
              )}

              {hasChildren && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleNode(key);
                  }}
                  aria-expanded={isNodeOpen}
                  aria-label={`Desplegar ${node.label}`}
                  className="px-3 py-3 hover:bg-black/5 text-slate-900"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isNodeOpen ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>

            <div className={`transition-all duration-300 overflow-hidden ${isNodeOpen ? "max-h-[500px] opacity-100 py-2" : "max-h-0 opacity-0"}`}>
              {hasChildren && <MenuList nodes={node.children!} parentKey={key} level={level + 1} />}
            </div>
          </li>
        );
      })}
    </ul>
  );

  const overlay = (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/45 transition-opacity duration-300" onClick={close} />

      <div className="absolute inset-0 flex">
        <aside
          className={`flex h-full w-[280px] max-w-[88vw] flex-col bg-[#e9eaec] shadow-2xl border-r border-black/10 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
            <span className="font-semibold tracking-wide text-sm">MENÚ</span>
            <button aria-label="Cerrar menú" onClick={close} className="p-3 rounded-md hover:bg-black/5">
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-2 text-xs">
            <MenuList nodes={resolvedNodes} />
          </nav>

          <div className="border-t border-black/10 p-3">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((current) => !current)}
              aria-expanded={isUserMenuOpen}
              aria-controls="sidebar-user-actions"
              className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-black/5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm">
                <User className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">{user?.nombre_usuario}</span>
                <span className="block truncate text-xs text-slate-600">{user?.mail}</span>
              </span>
              <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
            </button>

            <div
              id="sidebar-user-actions"
              className={`overflow-hidden transition-all duration-300 ${isUserMenuOpen ? "max-h-56 opacity-100" : "max-h-0 opacity-0"}`}
            >
              <div className="mt-2 border-t border-black/10 pt-2 text-sm">
                <p className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600">
                  {isAdmin() && <Shield className="h-3.5 w-3.5" aria-hidden="true" />}
                  {roleLabel}
                </p>
                <NavLink to="/mi-perfil" onClick={close} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-slate-700 hover:bg-black/5">
                  <User className="h-4 w-4" aria-hidden="true" />
                  Mi perfil
                </NavLink>
                <NavLink to="/cambiar-password" onClick={close} className="flex items-center gap-2 rounded-md px-3 py-2.5 text-slate-700 hover:bg-black/5">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  Cambiar contraseña
                </NavLink>
                <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-rose-700 hover:bg-rose-50">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 h-full" onClick={close} />
      </div>
    </div>
  );

  return (
    <Fragment>
      <button aria-label="Abrir menú" onClick={open} className="p-3 rounded-md hover:bg-slate-100 text-slate-700">
        <Menu size={24} />
      </button>
      {isVisible && createPortal(overlay, document.body)}
    </Fragment>
  );
}
