from datetime import datetime
from extension import db
from sqlalchemy.orm import joinedload
from core.models.directivos import Directivo, DirectivoGrupo, Cargo
from core.models.grupo import GrupoInvestigacionUtn


class DirectivoGrupoService:

    # =========================================================
    # HELPERS
    # =========================================================

    @staticmethod
    def _get_activo_or_404(model, obj_id, mensaje):
        obj = db.session.get(model, obj_id)

        if not obj or obj.deleted_at is not None:
            raise ValueError(mensaje)

        return obj


    # =========================================================
    # GET ALL
    # =========================================================

    @staticmethod
    def get_all_srv():
        directivos = (
            Directivo.query
            .filter(Directivo.deleted_at.is_(None))
            .all()
        )

        return [d.serialize() for d in directivos]


    # =========================================================
    # CREAR DIRECTIVO
    # =========================================================

    @staticmethod
    def crear_directivo(data: dict, user_id: int):

        if not data.get("nombre_apellido"):
            raise ValueError("El nombre es obligatorio.")

        directivo = Directivo(
            nombre_apellido=data["nombre_apellido"].strip(),
            created_by=user_id
        )

        db.session.add(directivo)
        db.session.commit()

        return directivo.serialize()


    # =========================================================
    # UPDATE DIRECTIVO
    # =========================================================

    @staticmethod
    def actualizar_directivo(directivo_id: int, data: dict, user_id: int):

        directivo = DirectivoGrupoService._get_activo_or_404(
            Directivo,
            directivo_id,
            "Directivo no encontrado."
        )

        if "nombre_apellido" in data:
            directivo.nombre_apellido = data["nombre_apellido"].strip()

        db.session.commit()

        return directivo.serialize()


    # =========================================================
    # ASIGNAR DIRECTIVO A GRUPO
    # =========================================================

    @staticmethod
    def asignar_a_grupo(data: dict, user_id: int):

        required = ["id_directivo", "id_grupo_utn", "id_cargo", "fecha_inicio"]

        for campo in required:
            if campo not in data:
                raise ValueError(f"{campo} es obligatorio.")

        directivo = DirectivoGrupoService._get_activo_or_404(
            Directivo, data["id_directivo"], "Directivo no encontrado."
        )

        grupo = DirectivoGrupoService._get_activo_or_404(
            GrupoInvestigacionUtn, data["id_grupo_utn"], "Grupo no encontrado."
        )

        cargo = db.session.get(Cargo, data["id_cargo"])
        if not cargo:
            raise ValueError("Cargo no encontrado.")

        fecha_inicio = datetime.strptime(
            data["fecha_inicio"], "%Y-%m-%d"
        ).date()

        fecha_fin = None
        if data.get("fecha_fin"):
            fecha_fin = datetime.strptime(
                data["fecha_fin"], "%Y-%m-%d"
            ).date()

            if fecha_fin < fecha_inicio:
                raise ValueError("La fecha_fin no puede ser anterior a fecha_inicio.")

        # 🔍 Validar superposición de períodos
        existentes = DirectivoGrupo.query.filter(
            DirectivoGrupo.id_grupo_utn == grupo.id,
            DirectivoGrupo.id_cargo == cargo.id,
            DirectivoGrupo.deleted_at.is_(None)
        ).all()

        for e in existentes:
            e_fin_real = e.fecha_fin if e.fecha_fin else datetime.max.date()
            nueva_fin_real = fecha_fin if fecha_fin else datetime.max.date()

            if fecha_inicio <= e_fin_real and nueva_fin_real >= e.fecha_inicio:
                raise ValueError(
                    "El período se superpone con otro directivo en ese cargo."
                )

        participacion = DirectivoGrupo(
            id_directivo=directivo.id,
            id_grupo_utn=grupo.id,
            id_cargo=cargo.id,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            created_by=user_id
        )

        db.session.add(participacion)
        db.session.commit()

        return {"message": "Directivo asignado correctamente."}


    # =========================================================
    # FINALIZAR CARGO
    # =========================================================

    @staticmethod
    def finalizar_cargo(data: dict, user_id: int):

        required = ["id_directivo", "id_grupo_utn", "fecha_fin"]

        for campo in required:
            if campo not in data:
                raise ValueError(f"{campo} es obligatorio.")

        participacion = DirectivoGrupo.query.filter(
            DirectivoGrupo.id_directivo == data["id_directivo"],
            DirectivoGrupo.id_grupo_utn == data["id_grupo_utn"],
            DirectivoGrupo.fecha_fin.is_(None),
            DirectivoGrupo.deleted_at.is_(None)
        ).first()

        if not participacion:
            raise ValueError("No hay cargo activo para finalizar.")

        fecha_fin = datetime.strptime(
            data["fecha_fin"], "%Y-%m-%d"
        ).date()

        if fecha_fin < participacion.fecha_inicio:
            raise ValueError("La fecha_fin no puede ser anterior a fecha_inicio.")

        participacion.fecha_fin = fecha_fin

        db.session.commit()

        return {"message": "Cargo finalizado correctamente."}


    # =========================================================
    # OBTENER DIRECTIVOS POR GRUPO
    # =========================================================

    @staticmethod
    def get_por_grupo(grupo_id: int):

        grupo = GrupoInvestigacionUtn.query.get(grupo_id)

        if not grupo or grupo.deleted_at is not None:
            raise ValueError("Grupo no encontrado.")

        return [
            {
                "id_directivo": p.directivo.id,
                "nombre_apellido": p.directivo.nombre_apellido,
                "cargo": p.cargo.nombre,
                "fecha_inicio": str(p.fecha_inicio),
                "fecha_fin": str(p.fecha_fin) if p.fecha_fin else None
            }
            for p in grupo.participaciones_directivos
            if p.deleted_at is None
        ]


    @staticmethod
    def get_actuales_por_grupo(grupo_id: int):

        participaciones = DirectivoGrupo.query.options(
            joinedload(DirectivoGrupo.directivo),
            joinedload(DirectivoGrupo.cargo)
        ).filter(
            DirectivoGrupo.id_grupo_utn == grupo_id,
            DirectivoGrupo.fecha_fin.is_(None),
            DirectivoGrupo.deleted_at.is_(None)
        ).all()

        return [
            {
                "id_directivo": p.directivo.id,
                "nombre_apellido": p.directivo.nombre_apellido,
                "cargo": p.cargo.nombre,
                "fecha_inicio": str(p.fecha_inicio)
            }
            for p in participaciones
        ]


    # =========================================================
    # SOFT DELETE DIRECTIVO
    # =========================================================

    @staticmethod
    def delete_directivo(directivo_id: int, user_id: int):

        directivo = DirectivoGrupoService._get_activo_or_404(
            Directivo,
            directivo_id,
            "Directivo no encontrado."
        )

        directivo.soft_delete(user_id)

        db.session.commit()

        return {"message": "Directivo eliminado correctamente."}