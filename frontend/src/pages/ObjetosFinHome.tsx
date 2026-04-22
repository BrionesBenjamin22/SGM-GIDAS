// src/pages/ObjetosLanding.tsx
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/Button";
import Tarjeta from "@/components/Tarjeta";
import ConfirmDialog from "@/components/ConfirmDialog";

import { getErogaciones, deleteErogaciones, type Erogaciones } from "@/services/erogacionesServices";
import { getEquipamiento, deleteEquipamiento, type Equipamiento } from "@/services/equipamientoServices";
import SuccessToast from "@/components/SuccessToast";

type Item =
  | (Erogaciones & { tipo: "Erogación" })
  | (Equipamiento & { tipo: "Equipamiento" });

function formatearFecha(fecha?: string) {
  if (!fecha) return "—";
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

export default function ObjetosLanding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
const [showSuccess, setShowSuccess] = useState(false);
  const { data: erogaciones = [], isLoading: loadingErog } = useQuery({
    queryKey: ["erogaciones"],
    queryFn: getErogaciones,
    staleTime: 60_000,
  });

  const { data: equipamiento = [], isLoading: loadingEq } = useQuery({
    queryKey: ["equipamiento"],
    queryFn: getEquipamiento,
    staleTime: 60_000,
  });

  const isLoading = loadingErog || loadingEq;

  const items: Item[] = [
    ...erogaciones.map((e) => ({ ...e, tipo: "Erogación" as const })),
    ...equipamiento.map((e) => ({ ...e, tipo: "Equipamiento" as const })),
  ];

  // ---- selección / borrado (igual que EquipamientoLanding) ----
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const toggleSelect = (item: Item, checked: boolean) => {
    setSelectedItems((prev) =>
      checked ? [...prev, item] : prev.filter((x) => !(x.tipo === item.tipo && x.id === item.id))
    );
  };

  const cancelSelection = () => {
    setSelectMode(false);
    setSelectedItems([]);
    setShowConfirm(false);
    setShowSuccess(true);
  };

  const confirmDelete = async () => {
    for (const item of selectedItems) {
      if (item.tipo === "Erogación") {
        await deleteErogaciones(item.id);
      } else {
        await deleteEquipamiento(item.id);
      }
    }

    qc.invalidateQueries({ queryKey: ["erogaciones"] });
    qc.invalidateQueries({ queryKey: ["equipamiento"] });
    cancelSelection();
  };

  const confirmItemsText = selectedItems.map((item) =>
    item.tipo === "Erogación"
      ? `Erogación N° ${String(item.numero_erogacion).padStart(6, "0")}`
      : item.denominacion
  );

  return (
    <section className="w-full min-h-[calc(100vh-80px)] px-4 py-2 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl md:text-3xl font-semibold">
          Objetos y Financiamiento
        </h2>

        {!selectMode ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectMode(true)}
          >
            Seleccionar
          </Button>
        ) : (
          <div className="flex gap-2">
            {selectedItems.length > 0 && (
              <Button size="sm" onClick={() => setShowConfirm(true)}>
                Eliminar
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={cancelSelection}>
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="flex-1">
        {isLoading && <p className="text-slate-500">Cargando…</p>}

        {!isLoading && items.length === 0 && (
          <p className="text-slate-500">
            Aún no hay erogaciones ni equipamientos cargados.
          </p>
        )}

        {!isLoading && items.length > 0 && (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Tarjeta<Item>
                key={`${item.tipo}-${item.id}`}
                item={item}
                title={() =>
                  item.tipo === "Erogación"
                    ? `Erogación N° ${String(item.numero_erogacion).padStart(6, "0")}`
                    : item.denominacion
                }
                subtitle={() =>
                  item.tipo === "Erogación"
                    ? item.tipo_erogacion?.nombre || "—"
                    : formatearFecha(item.fecha_incorporacion)
                }
                selectable={selectMode}
                selected={selectedItems.some(
                  (x) => x.tipo === item.tipo && x.id === item.id
                )}
                onSelectChange={(checked) =>
                  toggleSelect(item, checked)
                }
                onClick={() =>
                  navigate(
                    item.tipo === "Erogación"
                      ? `/erogaciones/${item.id}`
                      : `/equipamiento/${item.id}`
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={showConfirm}
        title="Eliminar ítems"
        message="¿Estás seguro de eliminar los siguientes elementos?"
        items={confirmItemsText}
        onCancel={cancelSelection}
        onConfirm={confirmDelete}
      />
            <SuccessToast
              open={showSuccess}
              message="Eliminado con éxito!"
              onClose={() => setShowSuccess(false)}
            />  
    </section>
  );
}
