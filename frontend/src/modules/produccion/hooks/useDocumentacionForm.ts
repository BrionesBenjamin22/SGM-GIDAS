import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createDocumentacion,
  updateDocumentacion,
  addAutorToDocumento,
  removeAutorFromDocumento,
  type Documentacion,
  type DocumentacionPayload,
} from "@/services/documentacionServices";
import {
  createAutor,
  type Autor,
} from "@/services/autoresService";

const YEARS = Array.from({ length: 2030 - 1900 + 1 }, (_, i) => 1900 + i);

export function useDocumentacionForm(initial?: Documentacion) {
  const qc = useQueryClient();
  const isEdit = Boolean(initial?.id);

  const [data, setData] = useState({
    titulo: "",
    editorial: "",
    anio: undefined as number | undefined,
    fecha: "",
  });

  const [autores, setAutores] = useState<Autor[]>([]);

  useEffect(() => {
    if (!initial) return;

    setData({
      titulo: initial.titulo ?? "",
      editorial: initial.editorial ?? "",
      anio: initial.anio ?? undefined,
      fecha: initial.fecha ?? "",
    });

    setAutores(initial.autores ?? []);
  }, [initial]);

  const isValid = useMemo(
    () =>
      data.titulo.trim() !== "" &&
      data.editorial.trim() !== "" &&
      data.anio !== undefined &&
      data.fecha.trim() !== "" &&
      autores.length > 0,
    [data, autores]
  );

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (payload: DocumentacionPayload) => {

      // 1️⃣ Crear o actualizar documento
      const doc = isEdit
        ? await updateDocumentacion(initial!.id, payload)
        : await createDocumentacion(payload);

      // 2️⃣ Persistir autores
      const autoresPersistidos: Autor[] = [];

      for (const autor of autores) {
        if (autor.id > 0) {
          autoresPersistidos.push(autor);
        } else {
          const creado = await createAutor(
            autor.nombre_apellido.trim()
          );
          autoresPersistidos.push(creado);
        }
      }

      const prevIds = initial?.autores?.map((a) => a.id) ?? [];
      const nextIds = autoresPersistidos.map((a) => a.id);

      const toAdd = nextIds.filter((id) => !prevIds.includes(id));
      const toRemove = prevIds.filter((id) => !nextIds.includes(id));

      for (const autorId of toAdd) {
        await addAutorToDocumento(doc.id, autorId);
      }

      for (const autorId of toRemove) {
        await removeAutorFromDocumento(doc.id, autorId);
      }

      return doc;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documentacion"] });

      if (isEdit && initial?.id) {
        qc.invalidateQueries({
          queryKey: ["documentacion", initial.id],
        });
      }
    },
  });

  // 🔥 ESTA ES LA PARTE CLAVE
  const submit = async (grupo_id: number) => {
    if (!isValid || isPending) return;

    const payload: DocumentacionPayload = {
      titulo: data.titulo.trim(),
      editorial: data.editorial.trim(),
      anio: Number(data.anio),
      fecha: data.fecha,
      grupo_id, // 🔥 AHORA SÍ SE USA
    };

    await mutateAsync(payload);
  };

  return {
    data,
    setData,
    autores,
    setAutores,
    submit,
    isPending,
    years: YEARS,
  };
}
