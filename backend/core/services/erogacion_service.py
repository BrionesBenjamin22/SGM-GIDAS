from core.models.erogacion import Erogacion, TipoErogacion
from core.models.fuente_financiamiento import FuenteFinanciamiento
from core.models.grupo import GrupoInvestigacionUtn
from extension import db
from datetime import datetime


class ErogacionService:

    # ==========================================
    # HELPERS
    # ==========================================

    @staticmethod
    def _get_activa_or_404(erogacion_id: int):
        erogacion = db.session.get(Erogacion, erogacion_id)
        if not erogacion or erogacion.deleted_at is not None:
            raise Exception("Erogación no encontrada")
        return erogacion


    # ==========================================
    # GET ALL
    # ==========================================

    @staticmethod
    def get_all(filters: dict = None):
        query = Erogacion.query

        if not filters:
            filters = {"activos": "true"}

        activos = filters.get("activos", "true")
        if activos is None:
            activos = "true"

        activos = activos.strip().lower()

        if activos == "true":
            query = query.filter(Erogacion.deleted_at.is_(None))
        elif activos == "false":
            query = query.filter(Erogacion.deleted_at.isnot(None))
        elif activos == "all":
            pass
        else:
            query = query.filter(Erogacion.deleted_at.is_(None))

        if filters:

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
            elif orden == "desc":
                query = query.order_by(Erogacion.fecha.desc())

        return [e.serialize() for e in query.all()]


    # ==========================================
    # GET BY ID
    # ==========================================

    @staticmethod
    def get_by_id(erogacion_id: int):
        erogacion = db.session.get(Erogacion, erogacion_id)
        if not erogacion:
            raise Exception("Erogación no encontrada")
        return erogacion.serialize()


    # ==========================================
    # CREATE
    # ==========================================

    @staticmethod
    def create(data: dict, user_id: int):

        if not data:
            raise Exception("El body es obligatorio")

        numero = data.get("numero_erogacion")
        grupo_id = data.get("grupo_utn_id")

        if not numero:
            raise ValueError("El número de erogación es obligatorio")

        if not grupo_id:
            raise ValueError("El grupo es obligatorio")

        # Validar grupo
        grupo = db.session.get(GrupoInvestigacionUtn, grupo_id)
        if not grupo or grupo.deleted_at is not None:
            raise Exception("Grupo inválido")

        # Validar duplicado activo
        existe = Erogacion.query.filter(
            Erogacion.numero_erogacion == numero,
            Erogacion.grupo_utn_id == grupo_id,
            Erogacion.deleted_at.is_(None)
        ).first()

        if existe:
            raise Exception("Ya existe una erogación activa con ese número en el grupo")

        # Validar egresos / ingresos
        try:
            egresos = float(data["egresos"])
            ingresos = float(data["ingresos"])
        except:
            raise Exception("Ingresos y egresos deben ser numéricos")

        if egresos < 0 or ingresos < 0:
            raise Exception("Ingresos y egresos no pueden ser negativos")

        if egresos == 0 and ingresos == 0:
            raise Exception("Egresos e ingresos no pueden ser ambos 0")

        # Validar tipo
        tipo = db.session.get(TipoErogacion, data.get("tipo_erogacion_id"))
        if not tipo:
            raise Exception("Tipo de erogación inválido")

        # Validar fuente
        fuente = db.session.get(FuenteFinanciamiento, data.get("fuente_financiamiento_id"))
        if not fuente:
            raise Exception("Fuente de financiamiento inválida")

        fecha = datetime.strptime(
            data.get("fecha"), "%Y-%m-%d"
        ).date() if data.get("fecha") else datetime.today().date()

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


    # ==========================================
    # UPDATE
    # ==========================================

    @staticmethod
    def update(erogacion_id: int, data: dict):

        erogacion = ErogacionService._get_activa_or_404(erogacion_id)

        if "egresos" in data:
            erogacion.egresos = float(data["egresos"])

        if "ingresos" in data:
            erogacion.ingresos = float(data["ingresos"])

        if erogacion.egresos == 0 and erogacion.ingresos == 0:
            raise Exception("Egresos e ingresos no pueden ser ambos 0")

        db.session.commit()
        return erogacion.serialize()


    # ==========================================
    # SOFT DELETE
    # ==========================================

    @staticmethod
    def delete(erogacion_id: int, user_id: int):

        erogacion = ErogacionService._get_activa_or_404(erogacion_id)

        erogacion.soft_delete(user_id)

        db.session.commit()

        return {"message": "Erogación eliminada correctamente"}
