import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getUsuarios, eliminarUsuario, type Usuario } from "@/services/usuariosService";
import { useAuth } from "@/context/AuthContext";
import { HttpError } from "@/lib/http";
import Button from "@/components/Button";
import {
  Users,
  Plus,
  Trash2,
  AlertCircle,
  X,
  Shield,
  UserCog,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

function getErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    const body = error.body as any;
    if (body?.error) return body.error;
    if (body?.message) return body.message;
    return error.message || "Ocurrió un error inesperado";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado";
}

function getRolConfig(rol: string) {
  switch (rol) {
    case "ADMIN":
      return {
        label: "Administrador",
        icon: Shield,
        className: "bg-violet-100 text-violet-700 border border-violet-200",
        iconClassName: "text-violet-700",
      };

    case "LECTURA":
      return {
        label: "Lector",
        icon: BookOpen,
        className: "bg-amber-100 text-amber-700 border border-amber-200",
        iconClassName: "text-amber-700",
      };

    case "GESTOR":
    default:
      return {
        label: "Gestor",
        icon: UserCog,
        className: "bg-sky-100 text-sky-700 border border-sky-200",
        iconClassName: "text-sky-700",
      };
  }
}

export default function UsuariosHome() {
  const { isAdmin, user } = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();

  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isAdmin()) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Acceso Denegado</h2>
        <p className="text-slate-500">No tienes permisos para gestionar usuarios.</p>
      </div>
    );
  }

  const { data: usuarios, isLoading, error } = useQuery({
    queryKey: ["usuarios"],
    queryFn: getUsuarios,
  });

  const eliminarMutation = useMutation({
    mutationFn: eliminarUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setUsuarioAEliminar(null);
      setDeleteError(null);
    },
    onError: (error) => {
      setDeleteError(getErrorMessage(error));
    },
  });

  function handleEliminar(usuario: Usuario) {
    setUsuarioAEliminar(usuario);
    setDeleteError(null);
  }

  function handleCerrarModal() {
    setUsuarioAEliminar(null);
    setDeleteError(null);
    eliminarMutation.reset();
  }

  function confirmarEliminar() {
    if (!usuarioAEliminar) return;
    setDeleteError(null);
    eliminarMutation.mutate(usuarioAEliminar.id);
  }

  const total = usuarios?.length || 0;
  const admins = usuarios?.filter((u) => u.rol === "ADMIN").length || 0;
  const gestores = usuarios?.filter((u) => u.rol === "GESTOR").length || 0;
  const lectores = usuarios?.filter((u) => u.rol === "LECTURA").length || 0;

  return (
    <section className="w-full">
      <h2 className="text-2xl md:text-3xl font-semibold leading-none">
        Gestión de Usuarios
      </h2>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Users className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <p className="text-sm text-slate-600">
              {total} usuario{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => nav("/usuarios/nuevo")}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </Button>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
              <Shield className="w-5 h-5 text-violet-700" />
            </div>
            <div>
              <p className="text-sm text-violet-700">Administradores</p>
              <p className="text-2xl font-semibold text-violet-900">{admins}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <p className="text-sm text-sky-700">Gestores</p>
              <p className="text-2xl font-semibold text-sky-900">{gestores}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-sm text-amber-700">Lectores</p>
              <p className="text-2xl font-semibold text-amber-900">{lectores}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                    <div className="h-3 w-48 bg-slate-100 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">
            {getErrorMessage(error)}
          </div>
        ) : !usuarios || usuarios.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                    Usuario
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                    Email
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                    Rol
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700">
                    Estado
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {usuarios.map((usuarioItem) => {
                  const rolConfig = getRolConfig(usuarioItem.rol);
                  const RolIcon = rolConfig.icon;
                  const esUsuarioActual = user?.id === usuarioItem.id;

                  return (
                    <tr key={usuarioItem.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">
                              {usuarioItem.nombre_usuario}
                            </p>

                            {esUsuarioActual && (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                Vos
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500">
                            ID: {usuarioItem.id}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {usuarioItem.mail}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${rolConfig.className}`}
                        >
                          <RolIcon className={`w-3.5 h-3.5 ${rolConfig.iconClassName}`} />
                          {rolConfig.label}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs ${
                            usuarioItem.activo ? "text-green-600" : "text-slate-400"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              usuarioItem.activo ? "bg-green-500" : "bg-slate-300"
                            }`}
                          />
                          {usuarioItem.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleEliminar(usuarioItem)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={
                              esUsuarioActual
                                ? "Eliminar tu usuario"
                                : "Eliminar usuario"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {usuarioAEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">¿Eliminar usuario?</h3>
              <button
                onClick={handleCerrarModal}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-slate-600 mb-6">
              Estás a punto de eliminar al usuario{" "}
              <strong>{usuarioAEliminar.nombre_usuario}</strong>.
            </p>

            {deleteError && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleCerrarModal}
                className="flex-1"
              >
                Cancelar
              </Button>

              <Button
                variant="primary"
                onClick={confirmarEliminar}
                className="flex-1 bg-rose-600 hover:bg-rose-700"
                disabled={eliminarMutation.isPending}
              >
                {eliminarMutation.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}