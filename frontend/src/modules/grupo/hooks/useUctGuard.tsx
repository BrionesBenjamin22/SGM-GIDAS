import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUct } from "@/hooks/useUct";
import AlertDialog from "@/components/AlertDialog";

/**
 * Hook that guards forms requiring a configured UCT (Grupo de investigación).
 * Returns a React element to render in the form JSX.
 *
 * Usage:
 *   const uctGuard = useUctGuard();
 *   return <>{uctGuard}<form>...</form></>
 */
export function useUctGuard() {
    const { uct, isLoading } = useUct();
    const navigate = useNavigate();
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!isLoading && !uct) {
            setShow(true);
        }
    }, [isLoading, uct]);

    const element = (
        <AlertDialog
            open={show}
            title="Grupo de investigación no configurado"
            message="Para poder realizar esta acción, primero debe configurar el grupo de investigación (UCT) desde la sección correspondiente."
            onClose={() => {
                setShow(false);
                navigate(-1);
            }}
        />
    );

    return { uctGuard: element, uctReady: !isLoading && !!uct, uct };
}
