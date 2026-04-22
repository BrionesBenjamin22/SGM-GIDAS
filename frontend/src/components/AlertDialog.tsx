import Button from "@/components/Button";

type Props = {
    open: boolean;
    title: string;
    message: string;
    onClose: () => void;
};

export default function AlertDialog({
    open,
    title,
    message,
    onClose,
}: Props) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Fondo blur */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal centrado */}
            <div
                className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-semibold mb-2">
                    {title}
                </h3>

                <p className="text-sm text-slate-600 mb-5">
                    {message}
                </p>

                <div className="flex justify-end">
                    <Button
                        size="sm"
                        className="px-3 py-1 text-xs"
                        onClick={onClose}
                    >
                        Entendido
                    </Button>
                </div>
            </div>
        </div>
    );
}
