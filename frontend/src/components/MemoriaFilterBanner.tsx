import { useLocation, useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import type { MemoriaSectionFilter } from "@/lib/memoriaSectionFilter";

type MemoriaFilterBannerProps = {
  filter: MemoriaSectionFilter;
};

export default function MemoriaFilterBanner({
  filter,
}: MemoriaFilterBannerProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 md:flex-row md:items-center md:justify-between">
      <p>
        Mostrando solo registros de {filter.sectionLabel} para{" "}
        {filter.memoriaLabel}.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            navigate(`/memorias/${filter.memoriaId}/versiones/${filter.versionId}`)
          }
        >
          Volver a memoria
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            navigate(`${location.pathname}${location.search}`, { replace: true })
          }
        >
          Quitar filtro
        </Button>
      </div>
    </div>
  );
}
