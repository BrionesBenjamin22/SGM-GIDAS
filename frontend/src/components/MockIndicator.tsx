import { isMockMode } from "@/services/tiposContratoService";

/**
 * Banner informativo que se muestra cuando la app opera en modo mock
 * (sin backend conectado). Reutilizable en cualquier sección.
 */
export default function MockIndicator() {
    if (!isMockMode()) return null;

    return (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            <span className="text-lg leading-none">⚠️</span>
            <span>
                <strong>Modo demostración:</strong> Los datos se guardan localmente en
                su navegador.
            </span>
        </div>
    );
}
