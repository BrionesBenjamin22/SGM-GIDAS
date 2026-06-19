import type { ReactNode } from "react";
import { ArrowRight, BookOpenCheck, History, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useSystemSetup } from "@/modules/auth/hooks/useSystemSetup";

export default function Landing() {
  const { user, loading: sessionLoading } = useAuth();
  const {
    data: needsInitialAdmin,
    isLoading: setupLoading,
    isFetching: setupFetching,
  } = useSystemSetup();
  const checkingAccess = sessionLoading || setupLoading || setupFetching;

  const destination = user
    ? "/inicio"
    : needsInitialAdmin
      ? "/registro"
      : "/login";

  const actionLabel = user
    ? "Ir al sistema"
    : needsInitialAdmin
      ? "Configurar administrador inicial"
      : "Iniciar sesión";

  return (
    <div className="min-h-screen bg-[#F6F6FB] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 lg:px-10">
          <div>
            <p className="text-xs text-slate-500">UTN Facultad Regional La Plata</p>
          </div>
          <span className="hidden text-xs font-medium uppercase text-slate-500 sm:inline">
            Proyecto institucional
          </span>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex min-h-[68svh] w-full max-w-7xl items-center px-5 py-16 lg:px-10 lg:py-24">
            <div className="max-w-4xl">
              <div className="mb-8 grid h-12 w-12 place-items-center rounded-lg bg-slate-950 text-white">
                <BookOpenCheck className="h-6 w-6" aria-hidden="true" />
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold text-slate-950 sm:text-5xl lg:text-6xl">
                Sistema de Gestión de Memorias Académicas
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Centraliza la información académica y de investigación de la
                UCT, conserva su trazabilidad y organiza la elaboración de
                memorias institucionales.
              </p>

              <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                {checkingAccess ? (
                  <span
                    className="inline-flex h-11 items-center rounded-lg bg-slate-200 px-5 text-sm font-medium text-slate-500"
                    aria-live="polite"
                  >
                    Verificando acceso...
                  </span>
                ) : (
                  <Link
                    to={destination}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                  >
                    {actionLabel}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
                
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Alcance del sistema" className="border-b border-slate-200">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 md:grid-cols-3 lg:px-10">
            <Capability
              icon={<BookOpenCheck className="h-5 w-5" />}
              title="Información integrada"
              description="Registros académicos y de investigación organizados en un único entorno."
            />
            <Capability
              icon={<History className="h-5 w-5" />}
              title="Trazabilidad"
              description="Cambios, períodos y antecedentes disponibles para consulta institucional."
            />
            <Capability
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Acceso controlado"
              description="Permisos por rol y alta de usuarios gestionada exclusivamente por administración."
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Capability({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-300 bg-white text-slate-700">
        {icon}
      </span>
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}
