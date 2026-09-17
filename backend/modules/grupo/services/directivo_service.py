import builtins
from datetime import datetime
from extension import db
from modules.shared.services.text_validation import has_only_letters_and_spaces
from modules.shared.exceptions import ValidationError as ValueError
from sqlalchemy.orm import joinedload
from modules.grupo.models.directivos import Directivo, DirectivoGrupo, Cargo
from modules.grupo.models.grupo import GrupoInvestigacionUtn
from modules.shared.services.date_time import validate_institutional_date


class DirectivoGrupoService:

    CARGOS_DIRECTIVOS = frozenset({"director", "vicedirector"})

    # =========================================================
    # HELPERS
    # =========================================================

    @staticmethod
    def _get_activo_or_404(model, obj_id, mensaje):
        obj = db.session.get(model, obj_id)

        if not obj or obj.deleted_at is not None:
            raise ValueError(mensaje)

        return obj

    @staticmethod
    def _normalizar_cargo(nombre: str) -> str:
        return nombre.strip().casefold()

    @staticmethod
    def _validar_fecha(valor, campo: str):
        try:
            fecha = datetime.strptime(valor, "%Y-%m-%d").date()
        except (TypeError, builtins.ValueError) as exc:
            raise ValueError(
                f"El campo '{campo}' debe tener formato YYYY-MM-DD.",
                details={"fields": {campo: "Ingrese una fecha válida en formato YYYY-MM-DD"}},
            ) from exc

        try:
            return validate_institutional_date(fecha, campo, allow_future=False)
        except ValueError as error:
            raise ValueError(str(error), details={"fields": {campo: str(error)}}) from error

    @staticmethod
    def _validar_cargo_y_cupo(
        grupo_id: int,
        cargo: Cargo,
        es_periodo_activo: bool = True
    ):
        if cargo.deleted_at is not None:
            raise ValueError("Cargo no encontrado.")

        cargo_normalizado = DirectivoGrupoService._normalizar_cargo(cargo.nombre)
        if cargo_normalizado not in DirectivoGrupoService.CARGOS_DIRECTIVOS:
            raise ValueError(
                "El equipo directivo solo admite los cargos Director y Vicedirector."
            )

        if not es_periodo_activo:
            return

        actuales = DirectivoGrupo.query.filter(
            DirectivoGrupo.id_grupo_utn == grupo_id,
            DirectivoGrupo.fecha_fin.is_(None),
            DirectivoGrupo.deleted_at.is_(None)
        ).all()

        if len(actuales) >= len(DirectivoGrupoService.CARGOS_DIRECTIVOS):
            raise ValueError("La UCT ya tiene completo su equipo directivo.")

        if any(participacion.id_cargo == cargo.id for participacion in actuales):
            raise ValueError(f"La UCT ya tiene un {cargo.nombre} activo.")


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
    def crear_directivo(data: dict, user_id: int, *, commit: bool = True):

        if not isinstance(data.get("nombre_apellido"), str) or not data["nombre_apellido"].strip():
            raise ValueError("El nombre es obligatorio.", details={"fields": {"nombre_apellido": "Ingrese nombre y apellido"}})
        if not has_only_letters_and_spaces(data["nombre_apellido"]):
            raise ValueError("Use solo letras y espacios en nombre y apellido.", details={"fields": {"nombre_apellido": "Use solo letras y espacios en nombre y apellido"}})

        directivo = Directivo(
            nombre_apellido=data["nombre_apellido"].strip(),
            created_by=user_id
        )

        db.session.add(directivo)
        if commit:
            db.session.commit()
        else:
            db.session.flush()

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
            if not isinstance(data["nombre_apellido"], str) or not data["nombre_apellido"].strip():
                raise ValueError("El nombre es obligatorio.", details={"fields": {"nombre_apellido": "Ingrese nombre y apellido"}})
            if not has_only_letters_and_spaces(data["nombre_apellido"]):
                raise ValueError("Use solo letras y espacios en nombre y apellido.", details={"fields": {"nombre_apellido": "Use solo letras y espacios en nombre y apellido"}})
            directivo.nombre_apellido = data["nombre_apellido"].strip()

        db.session.commit()

        return directivo.serialize()


    # =========================================================
    # ASIGNAR DIRECTIVO A GRUPO
    # =========================================================

    @staticmethod
    def asignar_a_grupo(data: dict, user_id: int, *, commit: bool = True):

        required = ["id_directivo", "id_grupo_utn", "id_cargo", "fecha_inicio"]

        for campo in required:
            if campo not in data:
                raise ValueError(f"{campo} es obligatorio.", details={"fields": {campo: "Complete este campo"}})

        directivo = DirectivoGrupoService._get_activo_or_404(
            Directivo, data["id_directivo"], "Directivo no encontrado."
        )

        grupo = DirectivoGrupoService._get_activo_or_404(
            GrupoInvestigacionUtn, data["id_grupo_utn"], "Grupo no encontrado."
        )

        cargo = db.session.get(Cargo, data["id_cargo"])
        if not cargo:
            raise ValueError("Cargo no encontrado.", details={"fields": {"id_cargo": "Seleccione un cargo disponible"}})

        fecha_inicio = DirectivoGrupoService._validar_fecha(
            data["fecha_inicio"], "fecha_inicio"
        )

        fecha_fin = None
        if data.get("fecha_fin"):
            fecha_fin = DirectivoGrupoService._validar_fecha(
                data["fecha_fin"], "fecha_fin"
            )

            if fecha_fin < fecha_inicio:
                raise ValueError("La fecha de fin no puede ser anterior al inicio.", details={"fields": {"fecha_fin": "Elija una fecha posterior o igual al inicio"}})

        DirectivoGrupoService._validar_cargo_y_cupo(
            grupo.id,
            cargo,
            es_periodo_activo=fecha_fin is None
        )

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
        if commit:
            db.session.commit()
        else:
            db.session.flush()

        return {"message": "Directivo asignado correctamente."}

    @staticmethod
    def crear_y_asignar(data: dict, user_id: int):
        if not isinstance(data, dict):
            raise ValueError("Complete los datos del directivo.")
        try:
            directivo = DirectivoGrupoService.crear_directivo(data, user_id, commit=False)
            DirectivoGrupoService.asignar_a_grupo({
                "id_directivo": directivo["id"],
                "id_grupo_utn": data.get("id_grupo_utn"),
                "id_cargo": data.get("id_cargo"),
                "fecha_inicio": data.get("fecha_inicio"),
            }, user_id, commit=False)
            db.session.commit()
            return directivo
        except Exception:
            db.session.rollback()
            raise


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

        fecha_fin = DirectivoGrupoService._validar_fecha(
            data["fecha_fin"], "fecha_fin"
        )

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

        grupo = db.session.get(GrupoInvestigacionUtn, grupo_id)

        if not grupo or grupo.deleted_at is not None:
            raise ValueError("Grupo no encontrado.")

        participaciones = (
            DirectivoGrupo.query.options(
                joinedload(DirectivoGrupo.directivo),
                joinedload(DirectivoGrupo.cargo)
            )
            .filter(
                DirectivoGrupo.id_grupo_utn == grupo_id,
                DirectivoGrupo.deleted_at.is_(None)
            )
            .order_by(
                DirectivoGrupo.fecha_inicio.desc(),
                DirectivoGrupo.id.desc()
            )
            .all()
        )

        return [
            {
                "id": p.id,
                "id_directivo": p.directivo.id,
                "nombre_apellido": p.directivo.nombre_apellido,
                "cargo": p.cargo.nombre,
                "fecha_inicio": str(p.fecha_inicio),
                "fecha_fin": str(p.fecha_fin) if p.fecha_fin else None
            }
            for p in participaciones
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
