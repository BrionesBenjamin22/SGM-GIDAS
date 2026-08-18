import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, KeyRound, Pencil, Save, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { actualizarUsuario } from "@/modules/auth/services/usuariosService";
import { getErrorMessage } from "@/lib/httpError";
import Button from "@/components/Button";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(username);
}

function getRolLabel(rol?: string) {
  if (rol === "ADMIN") return "Administrador";
  if (rol === "GESTOR") return "Gestor";
  if (rol === "LECTURA") return "Lector";
  return rol ?? "-";
}

export default function MiPerfil() {
  const { user, canEditOwnProfile, updateUserInSession } = useAuth();
  const nav = useNavigate();

  const [editando, setEditando] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    if (user) {
      setNombreUsuario(user.nombre_usuario ?? "");
      setEmail(user.mail ?? "");
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No hay usuario autenticado");

      const changes: { nombre_usuario?: string; mail?: string } = {};
      const normalizedName = nombreUsuario.trim();
      const normalizedEmail = email.trim();
      if (normalizedName !== user.nombre_usuario) changes.nombre_usuario = normalizedName;
      if (normalizedEmail !== user.mail) changes.mail = normalizedEmail;
      return actualizarUsuario(user.id, changes);
    },
    onSuccess: (updatedUser) => {
      updateUserInSession({
        nombre_usuario: updatedUser.nombre_usuario,
        mail: updatedUser.mail,
      });

      setGuardado(true);
      setEditando(false);
      setError(null);

      setTimeout(() => setGuardado(false), 2000);
    },
    onError: (err) => {
      setError(getErrorMessage(err, "Lo sentimos, no pudimos guardar los cambios. Verifique los datos e intente nuevamente."));
    },
  });

  function cancelarEdicion() {
    if (!user) return;
    setNombreUsuario(user.nombre_usuario ?? "");
    setEmail(user.mail ?? "");
    setEditando(false);
    setError(null);
  }

  function guardarCambios() {
    setError(null);

    if (!user) {
      setError("La sesión ya no está disponible. Inicie sesión nuevamente.");
      return;
    }

    const normalizedName = nombreUsuario.trim();
    const normalizedEmail = email.trim();

    if (!normalizedName) {
      setError("El nombre de usuario es obligatorio");
      return;
    }

    if (normalizedName.length < 3 || !isValidUsername(normalizedName)) {
      setError("El nombre debe tener al menos 3 caracteres y usar solo letras, números, puntos o guiones.");
      return;
    }

    if (!normalizedEmail) {
      setError("El email es obligatorio");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError("Ingrese un email válido.");
      return;
    }

    if (normalizedName === user.nombre_usuario && normalizedEmail === user.mail) {
      setEditando(false);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2000);
      return;
    }

    updateMutation.mutate();
  }

  if (!user) return null;

  return (
    <section className="w-full max-w-3xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-semibold leading-none">
        Mi Perfil
      </h2>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <User className="w-7 h-7 text-slate-700" />
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900">
              {user.nombre_usuario}
            </h3>
            <p className="text-slate-500 mt-1">
              Información de tu cuenta dentro del sistema
            </p>
          </div>
        </div>

        {guardado && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Tus datos fueron actualizados correctamente.
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* GRID MEJORADO */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {/* Nombre de usuario */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500 mb-1">Nombre de usuario</p>

            {editando ? (
              <input
                className="input"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                placeholder="Nombre de usuario"
              />
            ) : (
              <p className="font-medium text-slate-900">{user.nombre_usuario}</p>
            )}
          </div>

          {/* Rol */}
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500 mb-1">Rol</p>
            <p className="font-medium text-slate-900">
              {getRolLabel(user.rol)}
            </p>
          </div>

          {/* Email ocupa todo el ancho */}
          <div className="rounded-xl border border-slate-200 p-4 md:col-span-2">
            <p className="text-sm text-slate-500 mb-1">Email</p>

            {editando ? (
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />
            ) : (
              <p className="font-medium text-slate-900">{user.mail}</p>
            )}
          </div>
        </div>

        {/* ACCIONES */}
        <div className="mt-6 flex flex-wrap gap-3">
          {!editando && canEditOwnProfile() && (
            <Button
              variant="primary"
              onClick={() => {
                setError(null);
                setEditando(true);
              }}
              className="flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Editar perfil
            </Button>
          )}

          {editando && (
            <>
              <Button
                variant="primary"
                onClick={guardarCambios}
                className="flex items-center gap-2"
                disabled={updateMutation.isPending}
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
              </Button>

              <Button
                variant="secondary"
                onClick={cancelarEdicion}
                className="flex items-center gap-2"
                disabled={updateMutation.isPending}
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
            </>
          )}

          <Button
            variant="secondary"
            onClick={() => nav("/cambiar-password")}
            className="flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            Cambiar contraseña
          </Button>

          <Button variant="secondary" onClick={() => nav("/inicio")}>
            Volver
          </Button>
        </div>
      </div>
    </section>
  );
}
