import { FormEvent, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const { register, esPrimerUsuario } = useAuth();
  const nav = useNavigate();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [esPrimero, setEsPrimero] = useState<boolean | null>(null);
  const [verificando, setVerificando] = useState(true);
  const [registroExitoso, setRegistroExitoso] = useState(false);

  // Verificar si es el primer usuario al cargar la página
  useEffect(() => {
    async function verificar() {
      try {
        const esElPrimero = await esPrimerUsuario();
        setEsPrimero(esElPrimero);
      } catch {
        // Si hay error, asumimos que no es el primero (más seguro)
        setEsPrimero(false);
      } finally {
        setVerificando(false);
      }
    }
    verificar();
  }, [esPrimerUsuario]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(nombre, email, password);
      setRegistroExitoso(true);
      // Después de 2 segundos, redirigir al login
      setTimeout(() => {
        nav("/login", { replace: true });
      }, 2000);
    } catch (err: any) {
      setError(err?.message ?? "Error al registrarse");
    } finally {
      setLoading(false);
    }
  }

  // Estado de carga mientras verifica
  if (verificando) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F6F6FB]">
        <div className="card w-full max-w-md text-center">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-slate-200 rounded mx-auto mb-4"></div>
            <div className="h-4 w-32 bg-slate-200 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Si NO es el primer usuario, mostrar mensaje de sistema ya configurado
  if (esPrimero === false) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F6F6FB]">
        <div className="card w-full max-w-md text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-xl font-semibold mb-3">Sistema Configurado</h1>
          <p className="text-slate-600 mb-6">
            El sistema ya tiene un administrador configurado. Si necesitas acceso, contactá al administrador de tu UCT.
          </p>
          <Link
            to="/login"
            className="inline-block w-full rounded-full bg-slate-900 text-white py-2.5 hover:opacity-90"
          >
            Ir al Login
          </Link>
        </div>
      </div>
    );
  }

  // Si es el primer usuario, mostrar formulario de registro
  return (
    <div className="min-h-screen grid place-items-center bg-[#F6F6FB]">
      <div className="card w-full max-w-md">
        {registroExitoso ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">¡Cuenta Creada!</h2>
            <p className="text-slate-600">
              Tu cuenta de administrador ha sido creada exitosamente. Redirigiendo al login...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold">Crear Cuenta de Administrador</h1>
              <p className="text-slate-500 text-sm mt-1">
                Estás configurando el sistema por primera vez. Esta cuenta será el administrador principal.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre de usuario</label>
                <input
                  className="input"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ingresa tu nombre de usuario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  className="input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ingresa tu email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contraseña</label>
                <input
                  className="input"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                />
                <p className="text-xs text-slate-400 mt-1">Mínimo 6 caracteres</p>
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-slate-900 text-white py-2.5 hover:opacity-90 disabled:opacity-60"
              >
                {loading ? "Creando cuenta…" : "Crear Cuenta de Admin"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
