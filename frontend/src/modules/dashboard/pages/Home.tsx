import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, type ReactNode } from "react";
import { useUct } from "@/hooks/useUct";
import { useDirectivos } from "@/hooks/useDirectivos";
import { useDashboardResumen } from "@/hooks/useDashboardGeneral";
import Button from "@/components/Button";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessToast from "@/components/SuccessToast";
import { useAuth } from "@/context/AuthContext";
import DirectivosHistoryPopover from "@/modules/grupo/components/DirectivosHistoryPopover";
import { ArrowUp } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

function scrollToPageTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

type ChartItem = {
  label: string;
  value: number;
};

export default function Home() {
  const { uct, isLoading, isError, remove } = useUct();
  const { isAdmin, isGestor } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const grupoId = uct?.id;
  const {
    data: directivos = [],
    isLoading: isLoadingDirectivos,
    isFetching: isFetchingDirectivos,
  } = useDirectivos(grupoId);

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError: dashboardError,
  } = useDashboardResumen({ anios: 5 });

  const director = directivos.find((d) => d.cargo === "Director");
  const vicedirector = directivos.find((d) => d.cargo === "Vicedirector");
  const canEditUct = isAdmin() || isGestor();
  const canDeleteUct = isAdmin();

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      setShowSuccess(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  if (isLoading) {
    return (
      <div className="grid place-items-center min-h-[60vh] text-slate-500">
        Cargando configuración…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="grid place-items-center min-h-[60vh] text-center space-y-4">
        <p className="text-slate-600">No se pudo contactar al servidor.</p>
        <Button onClick={() => navigate("/uct/nueva")}>
          Crear configuración
        </Button>
      </div>
    );
  }

  const directivosListos = !isLoadingDirectivos && !isFetchingDirectivos;
  const faltanDirectivos = !!uct && directivosListos && directivos.length === 0;

  const proyectosPorEstado: ChartItem[] = [
    {
      label: "Activos",
      value: dashboard?.resumen?.proyectos_activos ?? 0,
    },
    {
      label: "Finalizados",
      value: dashboard?.resumen?.proyectos_finalizados ?? 0,
    },
  ];

  const proyectosPorTipo: ChartItem[] =
    dashboard?.distribuciones?.proyectos_por_tipo?.map((item) => ({
      label: item.tipo,
      value: item.total,
    })) ?? [];

  const becariosPorTipoFormacion: ChartItem[] =
    dashboard?.distribuciones?.becarios_por_tipo_formacion?.map((item) => ({
      label: item.tipo_formacion,
      value: item.total,
    })) ?? [];

  const personalGeneral: ChartItem[] = [
    {
      label: "Investigadores",
      value: dashboard?.resumen?.total_investigadores ?? 0,
    },
    {
      label: "Becarios",
      value: dashboard?.resumen?.total_becarios ?? 0,
    },
    {
      label: "Personal",
      value: dashboard?.resumen?.total_personal ?? 0,
    },
  ];

  return (
    <>
      <section className="space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Unidad Científico Tecnológica
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configuración institucional y métricas generales
            </p>
          </div>

          {uct && (
            <div className="flex gap-2">
              <DirectivosHistoryPopover grupoId={uct.id} />

              {canEditUct && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate("/uct/nueva")}
                >
                  Editar
                </Button>
              )}

              {canDeleteUct && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowConfirm(true)}
                >
                  Eliminar
                </Button>
              )}
            </div>
          )}
        </div>

        {uct ? (
          <>
            {faltanDirectivos && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-amber-900">
                    La UCT ya fue creada, pero todavía no tiene equipo directivo
                    registrado.
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    Completá esta información desde la edición de la
                    configuración.
                  </p>
                </div>

                <Button size="sm" onClick={() => navigate("/uct/nueva")}>
                  Cargar directivos
                </Button>
              </div>
            )}

            <article className="rounded-3xl border border-slate-200 bg-white shadow-sm p-8">
              <dl className="grid md:grid-cols-2 gap-y-8 gap-x-12 text-sm">
                <Field label="Facultad Regional" value={uct.facultadRegional} />
                <Field label="Nombre y Sigla" value={uct.nombreSigla} />
                <Field
                  label="Director/a"
                  value={director ? director.nombre_apellido : "—"}
                />
                <Field
                  label="Vicedirector/a"
                  value={vicedirector ? vicedirector.nombre_apellido : "—"}
                />
                <Field label="Correo electrónico" value={uct.correo} />
                <Field
                  label="Objetivos y desarrollo"
                  value={uct.objetivos}
                  className="md:col-span-2"
                />
              </dl>
            </article>

            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Dashboard general
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Resumen visual del estado actual del sistema.
                </p>
              </div>

              {dashboardLoading && (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
                  Cargando métricas…
                </div>
              )}

              {dashboardError && (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
                  No se pudieron cargar las métricas del dashboard.
                </div>
              )}

              {dashboard && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                    <KpiCard
                      title="Total proyectos"
                      value={dashboard.resumen.total_proyectos}
                      subtitle="Proyectos del período"
                      accent="blue"
                    />
                    <KpiCard
                      title="Proyectos activos"
                      value={dashboard.resumen.proyectos_activos}
                      subtitle="Activos en el período"
                      accent="violet"
                    />
                    <KpiCard
                      title="Investigadores"
                      value={dashboard.resumen.total_investigadores}
                      subtitle="Total registrados"
                      accent="emerald"
                    />
                    <KpiCard
                      title="Becarios"
                      value={dashboard.resumen.total_becarios}
                      subtitle="Total registrados"
                      accent="amber"
                    />
                    <KpiCard
                      title="Personal"
                      value={dashboard.resumen.total_personal}
                      subtitle="Total registrado"
                      accent="rose"
                    />
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <ChartCard
                      title="Personal general"
                      subtitle="Investigadores, becarios y personal"
                    >
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                          data={personalGeneral}
                          margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                        >
                          <CartesianGrid
                            stroke="#e2e8f0"
                            strokeDasharray="3 3"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="label"
                            tick={{ fill: "#64748b", fontSize: 13 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fill: "#64748b", fontSize: 13 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={46}>
                            {personalGeneral.map((_, index) => (
                              <Cell
                                key={index}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard
                      title="Proyectos por estado"
                      subtitle="Activos y finalizados"
                    >
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <Pie
                            data={proyectosPorEstado}
                            dataKey="value"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={95}
                            paddingAngle={4}
                            labelLine={false}
                            isAnimationActive
                          >
                            {proyectosPorEstado.map((_, index) => (
                              <Cell
                                key={index}
                                fill={index === 0 ? "#10b981" : "#ef4444"}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend
                            verticalAlign="bottom"
                            iconType="circle"
                            wrapperStyle={{
                              fontSize: "13px",
                              color: "#475569",
                              paddingTop: 12,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard
                      title="Proyectos por tipo"
                      subtitle="Distribución por clasificación"
                    >
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart>
                          <Pie
                            data={proyectosPorTipo}
                            dataKey="value"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            innerRadius={52}
                            outerRadius={92}
                            paddingAngle={3}
                            labelLine={false}
                            isAnimationActive
                          >
                            {proyectosPorTipo.map((_, index) => (
                              <Cell
                                key={index}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend
                            verticalAlign="bottom"
                            iconType="circle"
                            wrapperStyle={{
                              fontSize: "13px",
                              color: "#475569",
                              paddingTop: 12,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard
                      title="Becarios por tipo de formación"
                      subtitle="Distribución actual"
                    >
                      <ResponsiveContainer width="100%" height={330}>
                        <BarChart
                          data={becariosPorTipoFormacion}
                          margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid
                            stroke="#e2e8f0"
                            strokeDasharray="3 3"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="label"
                            tick={{ fill: "#64748b", fontSize: 13 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fill: "#64748b", fontSize: 13 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="value"
                            radius={[8, 8, 0, 0]}
                            barSize={40}
                          >
                            {becariosPorTipoFormacion.map((_, index) => (
                              <Cell
                                key={index}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </div>
                </>
              )}
            </section>

            <section
              id="quienes-somos"
              className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white shadow-sm p-8"
            >
              <div className="max-w-4xl space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    About Us
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    ¿Quiénes Somos?
                  </h2>
                </div>

                <p className="text-base leading-8 text-slate-700">
                  El GIDAS es el grupo de I&amp;D aplicado a sistemas
                  informáticos, de la UTN FRLP. Con el objetivo de realizar
                  aportes al mejoramiento de la informática para sus
                  aplicaciones en el medio socio productivo actual y futuro,
                  manteniendo una participación activa en actividades
                  científicas-tecnológicas, compartiendo conocimientos de
                  actualidad y aportando innovaciones metodológicas y soluciones
                  digitales.
                </p>

                <div className="grid gap-4 sm:grid-cols-3 pt-2">
                  <InfoBadge
                    title="Investigación aplicada"
                    description="Desarrollo de soluciones y aportes concretos en sistemas informáticos."
                  />
                  <InfoBadge
                    title="Vinculación"
                    description="Trabajo orientado al medio socio productivo actual y futuro."
                  />
                  <InfoBadge
                    title="Innovación"
                    description="Metodologías, conocimiento actualizado y soluciones digitales."
                  />
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 p-12 text-center space-y-4">
            <p className="text-slate-600">
              No hay una UCT configurada en el sistema.
            </p>
            <Button onClick={() => navigate("/uct/nueva")}>
              Crear configuración inicial
            </Button>
          </div>
        )}

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={scrollToPageTop}
            className="flex items-center gap-2"
          >
            <ArrowUp className="h-4 w-4" />
            Volver al inicio
          </Button>
        </div>

        <ConfirmDialog
          open={showConfirm}
          title="Eliminar Unidad Científico Tecnológica"
          message="¿Estás seguro de eliminar la UCT configurada?"
          items={uct ? [`${uct.nombreSigla} — ${uct.facultadRegional}`] : []}
          onCancel={() => setShowConfirm(false)}
          onConfirm={async () => {
            await remove();
            setShowConfirm(false);
            setSuccessMessage("Eliminado con éxito!");
            setShowSuccess(true);
          }}
        />

        <SuccessToast
          open={showSuccess}
          message={successMessage}
          onClose={() => setShowSuccess(false)}
        />
      </section>

    </>
  );
}

function Field({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-slate-500 text-xs uppercase tracking-[0.14em]">
        {label}
      </dt>
      <dd className="mt-2 text-base font-medium text-slate-900 whitespace-pre-wrap">
        {value || "—"}
      </dd>
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  accent,
}: {
  title: string;
  value: number;
  subtitle?: string;
  accent: "blue" | "violet" | "emerald" | "amber" | "rose";
}) {
  const accentStyles = {
    blue: "from-blue-500/15 to-blue-100/40 border-blue-200",
    violet: "from-violet-500/15 to-violet-100/40 border-violet-200",
    emerald: "from-emerald-500/15 to-emerald-100/40 border-emerald-200",
    amber: "from-amber-500/15 to-amber-100/40 border-amber-200",
    rose: "from-rose-500/15 to-rose-100/40 border-rose-200",
  };

  return (
    <article
      className={`rounded-3xl border bg-gradient-to-br ${accentStyles[accent]} p-5 shadow-sm`}
    >
      <p className="text-sm text-slate-600">{title}</p>
      <p className="mt-3 text-4xl font-semibold text-slate-900">{value}</p>
      {subtitle && <p className="mt-2 text-xs text-slate-500">{subtitle}</p>}
    </article>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {children}
    </article>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-slate-800">
        {label || payload[0]?.payload?.label}
      </p>
      <p className="text-sm text-slate-600 mt-1">
        Valor:{" "}
        <span className="font-semibold text-slate-900">
          {payload[0].value}
        </span>
      </p>
    </div>
  );
}

function InfoBadge({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}
