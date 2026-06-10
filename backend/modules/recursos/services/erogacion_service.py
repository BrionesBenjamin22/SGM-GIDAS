from datetime import datetime

from core.models.erogacion import Erogacion, TipoErogacion, ErogacionMemoriaVersion
from core.models.fuente_financiamiento import FuenteFinanciamiento
from core.models.grupo import GrupoInvestigacionUtn
from core.services.auditoria_service import AuditoriaService
from core.services.memoria_periodo_service import esta_en_periodo_memoria
from extension import db


class ErogacionService:

    @staticmethod
    def _get_activa_or_404(erogacion_id: int):
        erogacion = db.session.get(Erogacion, erogacion_id)
        if not erogacion or erogacion.deleted_at is not None:
            raise Exception("Erogacion no encontrada")
        return erogacion

    @staticmethod
    def get_all(filters: dict = None):
        query = Erogacion.query

        if not filters:
            filters = {"activos": "true"}

        activos = (filters.get("activos", "true") or "true").strip().lower()

        if activos == "true":
            query = query.filter(Erogacion.deleted_at.is_(None))
        elif activos == "false":
            query = query.filter(Erogacion.deleted_at.isnot(None))

        if filters.get("fuente_financiamiento_id"):
            query = query.filter(
                Erogacion.fuente_financiamiento_id == filters["fuente_financiamiento_id"]
            )

        if filters.get("tipo_erogacion_id"):
            query = query.filter(
                Erogacion.tipo_erogacion_id == filters["tipo_erogacion_id"]
            )

        orden = filters.get("orden")
        if orden == "asc":
            query = query.order_by(Erogacion.fecha.asc())
        else:
            query = query.order_by(Erogacion.fecha.desc())

        return [e.serialize() for e in query.all()]

    @staticmethod
    def get_by_id(erogacion_id: int):
        erogacion = db.session.get(Erogacion, erogacion_id)
        if not erogacion:
            raise Exception("Erogacion no encontrada")
        return erogacion.serialize()

    @staticmethod
    def get_historial(erogacion_id: int):
        erogacion = db.session.get(Erogacion, erogacion_id)
        if not erogacion:
            raise Exception("Erogacion no encontrada")
        return AuditoriaService.obtener_historial_entidad(
            entidad="erogacion",
            registro_id=erogacion.id
        )


    @staticmethod
    def vaLidar_numero_erogacion(numero, grupo_id, erogacion_id=None):
        query = Erogacion.query.filter(
            Erogacion.numero_erogacion == numero,
            Erogacion.grupo_utn_id == grupo_id,
            Erogacion.deleted_at.is_(None)
        )
        if erogacion_id:
            query = query.filter(Erogacion.id != erogacion_id)

        existe = query.first()
        if existe:
            raise Exception("Ya existe una erogacion activa con ese numero en el grupo")
        
        numero_int = int(numero)  # Validar que sea un número entero
        if numero_int <= 0:
            raise Exception("El numero de erogacion debe ser un entero positivo")
        
    @staticmethod
    def create(data: dict, user_id: int):
        if not data:
            raise Exception("El body es obligatorio")

        numero = data.get("numero_erogacion")
        ErogacionService.vaLidar_numero_erogacion(numero, data.get("grupo_utn_id"))
        grupo_id = data.get("grupo_utn_id")

        if not numero:
            raise ValueError("El numero de erogacion es obligatorio")
        if not grupo_id:
            raise ValueError("El grupo es obligatorio")

        grupo = db.session.get(GrupoInvestigacionUtn, grupo_id)
        if not grupo or grupo.deleted_at is not None:
            raise Exception("Grupo invalido")

        existe = Erogacion.query.filter(
            Erogacion.numero_erogacion == numero,
            Erogacion.grupo_utn_id == grupo_id,
            Erogacion.deleted_at.is_(None)
        ).first()
        if existe:
            raise Exception("Ya existe una erogacion activa con ese numero en el grupo")

        try:
            egresos = float(data["egresos"])
            ingresos = float(data["ingresos"])
        except Exception:
            raise Exception("Ingresos y egresos deben ser numericos")

        if egresos < 0 or ingresos < 0:
            raise Exception("Ingresos y egresos no pueden ser negativos")
        if egresos == 0 and ingresos == 0:
            raise Exception("Egresos e ingresos no pueden ser ambos 0")

        tipo = db.session.get(TipoErogacion, data.get("tipo_erogacion_id"))
        if not tipo:
            raise Exception("Tipo de erogacion invalido")

        fuente = db.session.get(
            FuenteFinanciamiento,
            data.get("fuente_financiamiento_id")
        )
        if not fuente:
            raise Exception("Fuente de financiamiento invalida")

        fecha = (
            datetime.strptime(data.get("fecha"), "%Y-%m-%d").date()
            if data.get("fecha") else datetime.today().date()
        )

        erogacion = Erogacion(
            numero_erogacion=numero,
            egresos=egresos,
            ingresos=ingresos,
            fecha=fecha,
            tipo_erogacion_id=tipo.id,
            fuente_financiamiento_id=fuente.id,
            grupo_utn_id=grupo.id,
            created_by=user_id
        )

        db.session.add(erogacion)
        db.session.commit()
        return erogacion.serialize()

    @staticmethod
    def update(erogacion_id: int, data: dict, user_id: int):
        erogacion = ErogacionService._get_activa_or_404(erogacion_id)
        cambios = {}

        if "egresos" in data:
            nuevo_egreso = float(data["egresos"])
            cambio = AuditoriaService.construir_cambio(
                erogacion.egresos,
                nuevo_egreso
            )
            if cambio:
                cambios["egresos"] = cambio
                erogacion.egresos = nuevo_egreso

        if "ingresos" in data:
            nuevo_ingreso = float(data["ingresos"])
            cambio = AuditoriaService.construir_cambio(
                erogacion.ingresos,
                nuevo_ingreso
            )
            if cambio:
                cambios["ingresos"] = cambio
                erogacion.ingresos = nuevo_ingreso

        if erogacion.egresos == 0 and erogacion.ingresos == 0:
            raise Exception("Egresos e ingresos no pueden ser ambos 0")

        if cambios:
            erogacion.mark_updated(user_id)
            AuditoriaService.registrar_cambios(
                entidad="erogacion",
                registro_id=erogacion.id,
                cambios=cambios,
                user_id=user_id
            )

        db.session.commit()
        return erogacion.serialize()

    @staticmethod
    def delete(erogacion_id: int, user_id: int):
        erogacion = ErogacionService._get_activa_or_404(erogacion_id)
        erogacion.soft_delete(user_id)
        db.session.commit()
        return {"message": "Erogacion eliminada correctamente"}

    @staticmethod
    def snapshot_para_memoria_version(memoria_version, user_id):
        erogaciones = Erogacion.query.filter().all()

        snapshots = []
        for erogacion in erogaciones:
            if not esta_en_periodo_memoria(memoria_version, erogacion.fecha):
                continue
            snapshot = ErogacionMemoriaVersion(
                memoria_version_id=memoria_version.id,
                erogacion_id=erogacion.id,
                numero_erogacion=erogacion.numero_erogacion,
                egresos=erogacion.egresos,
                ingresos=erogacion.ingresos,
                fecha=erogacion.fecha,
                tipo_erogacion_id=erogacion.tipo_erogacion_id,
                tipo_erogacion_nombre=(
                    erogacion.tipo_erogacion.nombre
                    if erogacion.tipo_erogacion else None
                ),
                fuente_financiamiento_id=erogacion.fuente_financiamiento_id,
                fuente_financiamiento_nombre=(
                    erogacion.fuente_financiamiento.nombre
                    if erogacion.fuente_financiamiento else None
                ),
                grupo_utn_id=erogacion.grupo_utn_id,
                grupo_utn_nombre=(
                    erogacion.grupo_utn.nombre_sigla_grupo
                    if erogacion.grupo_utn else None
                ),
                created_by=user_id
            )
            db.session.add(snapshot)
            snapshots.append(snapshot)

        return snapshots

    @staticmethod
    def obtener_snapshots_por_memoria_version(memoria_version_id: int):
        snapshots = (
            ErogacionMemoriaVersion.query
            .filter(
                ErogacionMemoriaVersion.memoria_version_id == memoria_version_id,
                ErogacionMemoriaVersion.deleted_at.is_(None)
            )
            .order_by(ErogacionMemoriaVersion.fecha.desc())
            .all()
        )
        return [snapshot.serialize() for snapshot in snapshots]
