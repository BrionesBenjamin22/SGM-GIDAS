import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// Iconos mostrar/ocultar contraseña
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7c.68 0 1.35-.09 1.99-.27"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
);
const banner = () => (
  <img src="https://img.freepik.com/foto-gratis/fondo-concepto-big-data-conexion-red-wireframeshapes-abstracto-poligonal-linea-punto_90220-496.jpg?t=st=1767944670~exp=1767948270~hmac=8406b8b4e6a0fbdf1fe6016484dec238a4056fa43d9a3dd46543de2258b855c1&w=2000" alt="Banner" className="w-full h-32 object-cover mb-6 rounded-lg"/>
);

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname || "/";

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setError(null);

  if (!usuario.trim() || !password.trim()) {
    setError("Complete usuario y contraseña para ingresar al sistema.");
    return;
  }

  setLoading(true);

  try {
    const auth = await login(usuario, password);

    if (auth.user.primer_login) {
      nav("/cambiar-password", { replace: true });
      return;
    }

    nav(from, { replace: true });
  } catch (err: any) {
    setError(
      err?.message ??
        "Lo sentimos, no pudimos iniciar sesión. Verifique los datos e intente nuevamente."
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="min-h-screen grid place-items-center bg-[#F6F6FB] px-4">
      <div className="card w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        
        <div className="text-center mb-8">
            {banner()}
            <h1 className="text-2xl font-bold text-slate-900">Bienvenido al sistema UCT</h1>
            <p className="text-slate-500 text-sm mt-1">Ingresa tus datos para acceder</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* INPUT USUARIO */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Nombre de Usuario
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
              type="text"
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ej: juanperez"
              autoComplete="username"
            />
          </div>

          {/* INPUT PASSWORD */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">
                Contraseña
                </label>
            </div>
            
            <div className="relative">
                <input
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all pr-10"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-6 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>
          </div>

          {/* MENSAJE DE ERROR */}
          {error && (
            <div role="alert" className="bg-rose-50 text-rose-600 text-sm px-4 py-2 rounded-lg border border-rose-100 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                {error}
            </div>
          )}

          {/* BOTÓN INGRESAR */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-slate-900 text-white font-medium py-3 hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-900/20"
          >
            {loading ? (
                <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Ingresando...
                </span>
            ) : "Ingresar"}
          </button>
        </form>

        {/* FOOTER */}
        <p className="mt-8 text-center text-sm text-slate-600">
          ¿No tenés cuenta?{" "}
          <Link to="/registro" className="font-semibold text-slate-900 hover:underline">
            Registrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
