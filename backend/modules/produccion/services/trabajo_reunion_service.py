from modules.produccion.services.trabajo_jornadas import resolver_fechas, fechas_trabajo
from modules.produccion.services.clasificacion_trabajo import validar_clasificacion
from modules.memorias.services.memoria_periodo_service import (
    consultar_entidades_memoria, registro_puntual_en_memoria,
)
from modules.produccion.services.trabajo_enlace import validar_enlace

from sqlalchemy import or_

from modules.grupo.models.grupo import GrupoInvestigacionUtn
from modules.produccion.services.trabajo_expositores_service import (
    validar_expositores, sincronizar_expositores, error_expositores,
)
from modules.produccion.models.trabajo_expositor import TrabajoReunionExpositor
from modules.produccion.models.trabajo_reunion import (
    TrabajoReunionCientifica, TrabajoReunionJornada,
    TipoReunion,
    TrabajoReunionCientificaMemoriaVersion,
)
from modules.shared.services.auditoria_service import AuditoriaService
from modules.shared.exceptions import ConflictError, NotFoundError, ValidationError
from extension import db
from modules.shared.services.text_validation import has_letter


class TrabajoReunionCientificaService:

    @staticmethod
    def _validar_payload(data: dict):
        if isinstance(data, dict) and "autores" in data:
            error_expositores("Use expositores para informar quién presentó el trabajo.")
        if not isinstance(data, dict) or not data:
            raise ValidationError("Los datos no pueden estar vacios")

    @staticmethod
    def _validar_id(valor, campo: str, permitir_none: bool = False):
        if valor is None and permitir_none:
            return None

        if not isinstance(valor, int) or valor <= 0:
            if campo == "tipo_reunion_id":
                raise ValidationError("Revise los campos indicados e intente nuevamente.", details={"fields": {campo: "Seleccione un tipo de evento científico disponible."}})
            raise ValidationError("No pudimos procesar la solicitud. Intente nuevamente.")

        return valor

    @staticmethod
    def _validar_user_id(user_id: int):
        return TrabajoReunionCientificaService._validar_id(user_id, "user_id")

    @staticmethod
    def _validar_texto(valor, campo, min_len=2, max_len=255):
        labels = {"titulo_trabajo": "el título del trabajo", "nombre_reunion": "el nombre de la reunión", "procedencia": "la procedencia"}
        label = labels.get(campo, "este dato")
        if not isinstance(valor, str) or not valor.strip():
            raise ValidationError("Revise los campos indicados e intente nuevamente.", details={"fields": {campo: f"Ingrese {label}."}})
        if campo == "nombre_reunion" and not has_letter(valor):
            raise ValidationError("Revise los campos indicados e intente nuevamente.", details={"fields": {campo: "El nombre de la reunión debe contener letras."}})

        valor = " ".join(valor.strip().split())
        if not min_len <= len(valor) <= max_len:
            raise ValidationError("Revise los campos indicados e intente nuevamente.", details={"fields": {campo: f"Use entre {min_len} y {max_len} caracteres para {label}."}})

        return valor

    @staticmethod
    def _normalizar_activos(activos):
        if activos is None:
            return "true"
        return str(activos).strip().lower()

    @staticmethod
    def _normalizar_orden(orden):
        if orden is None:
            return None
        return str(orden).strip().lower()

    @staticmethod
    def _parse_int_filter(valor, campo: str):
        if valor is None or valor == "":
            return None

        try:
            valor = int(valor)
        except (TypeError, ValueError):
            raise ValidationError(f"El campo '{campo}' debe ser un entero positivo")

        return TrabajoReunionCientificaService._validar_id(valor, campo)

    @staticmethod
    def _validar_grupo(grupo_utn_id):
        grupo_utn_id = TrabajoReunionCientificaService._validar_id(
            grupo_utn_id, "grupo_utn_id", permitir_none=True
        )

        if grupo_utn_id is None:
            return None

        grupo = db.session.get(GrupoInvestigacionUtn, grupo_utn_id)
        if not grupo or getattr(grupo, "deleted_at", None) is not None:
            raise NotFoundError("Grupo UTN invalido")

        return grupo.id

    @staticmethod
    def _validar_tipo_reunion(tipo_reunion_id):
        tipo_reunion_id = TrabajoReunionCientificaService._validar_id(
            tipo_reunion_id, "tipo_reunion_id"
        )
        tipo_reunion = db.session.get(TipoReunion, tipo_reunion_id)
        if not tipo_reunion:
            raise NotFoundError("El tipo de evento científico ya no está disponible. Elija otro e intente nuevamente.", details={"fields": {"tipo_reunion_id": "Seleccione un tipo de evento científico disponible."}})
        return tipo_reunion.id

    @staticmethod
    def _get_or_404(trabajo_id: int):
        trabajo = db.session.get(
            TrabajoReunionCientifica,
            TrabajoReunionCientificaService._validar_id(trabajo_id, "trabajo_id")
        )
        if not trabajo:
            raise NotFoundError("Trabajo en reunion cientifica no encontrado")
        return trabajo

    @staticmethod
    def _get_activo_or_404(trabajo_id: int):
        trabajo = TrabajoReunionCientificaService._get_or_404(trabajo_id)
        if trabajo.deleted_at is not None:
            raise ConflictError("No se puede operar sobre un trabajo eliminado")
        return trabajo

    @staticmethod
    def _validar_no_duplicado(
        titulo_trabajo: str,
        nombre_reunion: str,
        procedencia: str,
        fechas,
        trabajo_id: int = None
    ):
        query = TrabajoReunionCientifica.query.filter(
            TrabajoReunionCientifica.deleted_at.is_(None),
            TrabajoReunionCientifica.titulo_trabajo == titulo_trabajo,
            TrabajoReunionCientifica.nombre_reunion == nombre_reunion,
            TrabajoReunionCientifica.procedencia == procedencia,
            TrabajoReunionCientifica.fecha_presentacion == fechas[0],
        )

        if trabajo_id is not None:
            query = query.filter(TrabajoReunionCientifica.id != trabajo_id)

        if any(fechas_trabajo(t) == fechas for t in query.all()):
            raise ConflictError(
                "Ya existe un trabajo de reunión con los mismos datos. Revise el título, la reunión y la fecha antes de reintentar."
            )

    @staticmethod
    def _list_query(filters: dict = None):
        filters = filters or {}
        query = TrabajoReunionCientifica.query
        rol, identificador = filters.get("expositor_rol"), filters.get("expositor_id")
        nombre = filters.get("expositor_nombre")
        if rol is not None or identificador is not None or nombre is not None:
            if rol == "externo" and nombre is not None and identificador is None:
                from modules.produccion.services.trabajo_expositores_service import nombre_clave
                query = query.filter(TrabajoReunionCientifica.expositores.any(TrabajoReunionExpositor.nombre_clave == nombre_clave(" ".join(nombre.split()))))
            else:
                if rol not in ("investigador", "becario", "personal") or nombre is not None:
                    error_expositores("Seleccione un filtro de expositor válido.")
                identificador = TrabajoReunionCientificaService._parse_int_filter(identificador, "expositor_id")
                if identificador is None:
                    error_expositores("Seleccione un filtro de expositor válido.")
                query = query.filter(TrabajoReunionCientifica.expositores.any(getattr(TrabajoReunionExpositor, f"{rol}_id") == identificador))

        activos = TrabajoReunionCientificaService._normalizar_activos(
            filters.get("activos")
        )
        if activos == "true":
            query = query.filter(
                TrabajoReunionCientifica.deleted_at.is_(None),
                TrabajoReunionCientifica.activo.is_(True)
            )
        elif activos == "false":
            query = query.filter(
                or_(
                    TrabajoReunionCientifica.deleted_at.isnot(None),
                    TrabajoReunionCientifica.activo.is_(False)
                )
            )
        elif activos != "all":
            query = query.filter(
                TrabajoReunionCientifica.deleted_at.is_(None),
                TrabajoReunionCientifica.activo.is_(True)
            )

        grupo_utn_id = TrabajoReunionCientificaService._parse_int_filter(
            filters.get("grupo_utn_id"), "grupo_utn_id"
        )
        if grupo_utn_id is not None:
            query = query.filter(TrabajoReunionCientifica.grupo_utn_id == grupo_utn_id)

        orden = TrabajoReunionCientificaService._normalizar_orden(
            filters.get("orden")
        )
        if orden == "asc":
            query = query.order_by(TrabajoReunionCientifica.fecha_presentacion.asc())
        else:
            query = query.order_by(TrabajoReunionCientifica.fecha_presentacion.desc())

        return query.order_by(TrabajoReunionCientifica.id.desc())

    @staticmethod
    def get_all(filters: dict = None):
        return [t.serialize() for t in TrabajoReunionCientificaService._list_query(filters).all()]

    @staticmethod
    def get_page(filters: dict, page: int, per_page: int):
        query = TrabajoReunionCientificaService._list_query(filters)
        total = query.count()
        return [t.serialize() for t in query.offset((page - 1) * per_page).limit(per_page).all()], total

    @staticmethod
    def get_by_id(trabajo_id: int):
        return TrabajoReunionCientificaService._get_or_404(trabajo_id).serialize()

    @staticmethod
    def get_historial(trabajo_id: int):
        trabajo = TrabajoReunionCientificaService._get_or_404(trabajo_id)
        return AuditoriaService.obtener_historial_entidad(
            entidad="trabajo_reunion_cientifica",
            registro_id=trabajo.id
        )

    @staticmethod
    def create(data: dict, user_id: int):
        TrabajoReunionCientificaService._validar_payload(data)
        TrabajoReunionCientificaService._validar_user_id(user_id)

        fechas = resolver_fechas(data)
        fecha_presentacion = fechas[0]
        titulo = TrabajoReunionCientificaService._validar_texto(
            data.get("titulo_trabajo"), "titulo_trabajo", 5, 300
        )
        nombre_reunion = TrabajoReunionCientificaService._validar_texto(
            data.get("nombre_reunion"), "nombre_reunion", 3
        )
        procedencia = TrabajoReunionCientificaService._validar_texto(
            data.get("procedencia"), "procedencia", 2
        )
        tipo_reunion_id = TrabajoReunionCientificaService._validar_tipo_reunion(
            data.get("tipo_reunion_id")
        )
        grupo_utn_id = TrabajoReunionCientificaService._validar_grupo(
            data.get("grupo_utn_id")
        )

        TrabajoReunionCientificaService._validar_no_duplicado(
            titulo,
            nombre_reunion,
            procedencia,
            fechas,
        )

        clasificacion = validar_clasificacion(data, reunion=True)
        enlace = validar_enlace(data.get("enlace"))
        expositores = validar_expositores(data.get("expositores"), grupo_utn_id)

        trabajo = TrabajoReunionCientifica(
            titulo_trabajo=titulo,
            nombre_reunion=nombre_reunion,
            procedencia=procedencia,
            fecha_presentacion=fecha_presentacion,
            jornadas=[TrabajoReunionJornada(fecha=fecha) for fecha in fechas],
            tipo_reunion_id=tipo_reunion_id,
            grupo_utn_id=grupo_utn_id,
            enlace=enlace,
            **clasificacion,
            created_by=user_id
        )

        try:
            db.session.add(trabajo)
            db.session.flush()
            sincronizar_expositores(trabajo, expositores, user_id)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return trabajo.serialize()

    @staticmethod
    def update(trabajo_id: int, data: dict, user_id: int):
        TrabajoReunionCientificaService._validar_payload(data)
        TrabajoReunionCientificaService._validar_user_id(user_id)
        trabajo = TrabajoReunionCientificaService._get_activo_or_404(trabajo_id)
        enlace = validar_enlace(data["enlace"]) if "enlace" in data else trabajo.enlace
        clasificacion = validar_clasificacion(data, reunion=True, actual=trabajo)
        cambios = {}

        fechas = resolver_fechas(data, trabajo)
        fecha_presentacion = fechas[0]

        titulo = trabajo.titulo_trabajo
        if "titulo_trabajo" in data:
            titulo = TrabajoReunionCientificaService._validar_texto(
                data["titulo_trabajo"], "titulo_trabajo", 5, 300
            )

        nombre_reunion = trabajo.nombre_reunion
        if "nombre_reunion" in data:
            nombre_reunion = TrabajoReunionCientificaService._validar_texto(
                data["nombre_reunion"], "nombre_reunion", 3
            )

        procedencia = trabajo.procedencia
        if "procedencia" in data:
            procedencia = TrabajoReunionCientificaService._validar_texto(
                data["procedencia"], "procedencia", 2
            )

        tipo_reunion_id = trabajo.tipo_reunion_id
        if "tipo_reunion_id" in data:
            tipo_reunion_id = TrabajoReunionCientificaService._validar_tipo_reunion(
                data["tipo_reunion_id"]
            )

        grupo_utn_id = trabajo.grupo_utn_id
        if "grupo_utn_id" in data:
            grupo_utn_id = TrabajoReunionCientificaService._validar_grupo(
                data["grupo_utn_id"]
            )

        TrabajoReunionCientificaService._validar_no_duplicado(
            titulo,
            nombre_reunion,
            procedencia,
            fechas,
            trabajo.id,
        )
        expositores = None
        if "expositores" in data:
            expositores = validar_expositores(data["expositores"], grupo_utn_id, trabajo.expositores)
        elif grupo_utn_id != trabajo.grupo_utn_id and trabajo.expositores:
            validar_expositores([a.serialize() for a in trabajo.expositores], grupo_utn_id, trabajo.expositores)


        try:
            anteriores = [fecha.isoformat() for fecha in fechas_trabajo(trabajo)]
            nuevas = [fecha.isoformat() for fecha in fechas]
            cambio = AuditoriaService.construir_cambio(anteriores, nuevas)
            if cambio:
                cambios["fechas_presentacion"] = cambio
                existentes = {j.fecha: j for j in trabajo.jornadas}
                trabajo.jornadas = [existentes.get(fecha) or TrabajoReunionJornada(fecha=fecha) for fecha in fechas]
                trabajo.fecha_presentacion = fecha_presentacion

            cambio = AuditoriaService.construir_cambio(
                trabajo.titulo_trabajo,
                titulo
            )
            if cambio:
                cambios["titulo_trabajo"] = cambio
                trabajo.titulo_trabajo = titulo

            cambio = AuditoriaService.construir_cambio(
                trabajo.nombre_reunion,
                nombre_reunion
            )
            if cambio:
                cambios["nombre_reunion"] = cambio
                trabajo.nombre_reunion = nombre_reunion

            cambio = AuditoriaService.construir_cambio(
                trabajo.procedencia,
                procedencia
            )
            if cambio:
                cambios["procedencia"] = cambio
                trabajo.procedencia = procedencia

            cambio = AuditoriaService.construir_cambio(
                trabajo.tipo_reunion_id,
                tipo_reunion_id
            )
            if cambio:
                cambios["tipo_reunion_id"] = cambio
                trabajo.tipo_reunion_id = tipo_reunion_id

            cambio = AuditoriaService.construir_cambio(
                trabajo.grupo_utn_id,
                grupo_utn_id
            )
            if cambio:
                cambios["grupo_utn_id"] = cambio
                trabajo.grupo_utn_id = grupo_utn_id

            cambio = AuditoriaService.construir_cambio(trabajo.enlace, enlace)
            if cambio:
                cambios["enlace"] = cambio
                trabajo.enlace = enlace

            for campo, valor in clasificacion.items():
                cambio = AuditoriaService.construir_cambio(getattr(trabajo, campo), valor)
                if cambio:
                    cambios[campo] = cambio
                    setattr(trabajo, campo, valor)

            if cambios:
                trabajo.mark_updated(user_id)
                AuditoriaService.registrar_cambios(
                    entidad="trabajo_reunion_cientifica",
                    registro_id=trabajo.id,
                    cambios=cambios,
                    user_id=user_id
                )

            if expositores is not None:
                sincronizar_expositores(trabajo, expositores, user_id)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return trabajo.serialize()

    @staticmethod
    def delete(trabajo_id: int, user_id: int):
        TrabajoReunionCientificaService._validar_user_id(user_id)
        trabajo = TrabajoReunionCientificaService._get_activo_or_404(trabajo_id)
        trabajo.soft_delete(user_id)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return {"message": "Trabajo eliminado correctamente (soft delete)"}

    @staticmethod
    def restore(trabajo_id: int):
        trabajo = TrabajoReunionCientificaService._get_or_404(trabajo_id)

        if trabajo.deleted_at is None and trabajo.activo is True:
            raise ConflictError("El trabajo ya se encuentra activo")

        trabajo.restore()
        trabajo.activo = True

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return trabajo.serialize()

    @staticmethod
    def snapshot_para_memoria_version(memoria_version, user_id):
        trabajos = consultar_entidades_memoria(TrabajoReunionCientifica, memoria_version)

        snapshots = []
        for trabajo in trabajos:
            if not any(registro_puntual_en_memoria(memoria_version, trabajo, fecha) for fecha in fechas_trabajo(trabajo)):
                continue
            autores = [autor.serialize() for autor in trabajo.autorias]

            snapshot = TrabajoReunionCientificaMemoriaVersion(
                memoria_version_id=memoria_version.id,
                trabajo_reunion_id=trabajo.id,
                enlace=trabajo.enlace,
                referato=trabajo.referato,
                alcance=trabajo.alcance,
                titulo_trabajo=trabajo.titulo_trabajo,
                nombre_reunion=trabajo.nombre_reunion,
                procedencia=trabajo.procedencia,
                fecha_presentacion=trabajo.fecha_presentacion,
                fechas_presentacion=[fecha.isoformat() for fecha in fechas_trabajo(trabajo)],
                tipo_reunion_id=trabajo.tipo_reunion_id,
                tipo_reunion_nombre=(
                    trabajo.tipo_reunion_cientifica.nombre
                    if trabajo.tipo_reunion_cientifica else None
                ),
                grupo_utn_id=trabajo.grupo_utn_id,
                grupo_utn_nombre=(
                    trabajo.grupo_utn.nombre_sigla_grupo
                    if trabajo.grupo_utn else None
                ),
                autores=autores,
                expositores=[a.serialize() for a in trabajo.expositores],
                created_by=user_id
            )
            db.session.add(snapshot)
            snapshots.append(snapshot)

        return snapshots

    @staticmethod
    def obtener_snapshots_por_memoria_version(memoria_version_id: int):
        snapshots = (
            TrabajoReunionCientificaMemoriaVersion.query
            .filter(
                TrabajoReunionCientificaMemoriaVersion.memoria_version_id == memoria_version_id,
                TrabajoReunionCientificaMemoriaVersion.deleted_at.is_(None)
            )
            .order_by(
                TrabajoReunionCientificaMemoriaVersion.fecha_presentacion.desc(),
                TrabajoReunionCientificaMemoriaVersion.id.desc()
            )
            .all()
        )

        return [snapshot.serialize() for snapshot in snapshots]
