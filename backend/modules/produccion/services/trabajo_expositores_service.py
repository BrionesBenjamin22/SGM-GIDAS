"""Validación y sincronización transaccional de expositores."""
import unicodedata

from extension import db
from modules.personal.models.personal import Investigador, Becario, Personal
from modules.produccion.models.trabajo_expositor import TrabajoReunionExpositor
from modules.shared.exceptions import ValidationError
from modules.shared.services.auditoria_service import AuditoriaService

MODELOS = {"investigador": Investigador, "becario": Becario, "personal": Personal}


def nombre_clave(nombre):
    return "".join(c for c in unicodedata.normalize("NFD", nombre.lower()) if not unicodedata.combining(c))


def error_expositores(mensaje):
    raise ValidationError(mensaje, details={"fields": {"expositores": mensaje}})


def validar_expositores(valores, grupo_id, existentes=()):
    if not isinstance(valores, list) or not valores:
        error_expositores("Agregue al menos un expositor.")
    actuales = {(a.rol, a.integrante.id) for a in existentes if a.integrante is not None}
    vistos, identidades, resultado = set(), set(), []
    for valor in valores:
        if not isinstance(valor, dict) or not isinstance(valor.get("rol"), str):
            error_expositores("Revise los expositores seleccionados.")
        rol = valor["rol"]
        if rol == "externo":
            nombre = valor.get("nombre_apellido")
            if not isinstance(nombre, str):
                error_expositores("Ingrese nombre y apellido del expositor externo.")
            nombre = " ".join(nombre.split())
            if not 2 <= len(nombre) <= 120 or not any(c.isalpha() for c in nombre) or any(unicodedata.category(c).startswith("C") for c in nombre):
                error_expositores("Ingrese un nombre externo válido de entre 2 y 120 caracteres.")
            if valor.get("id") is not None:
                error_expositores("Un expositor externo se registra únicamente por nombre.")
            clave = (rol, nombre_clave(nombre))
            datos = {"nombre_externo": nombre, "nombre_clave": clave[1]}
        else:
            identificador = valor.get("id")
            if rol not in MODELOS or type(identificador) is not int or identificador <= 0 or valor.get("nombre_externo") is not None:
                error_expositores("Seleccione una referencia interna válida.")
            persona = db.session.get(MODELOS[rol], identificador)
            if persona is None or persona.grupo_utn_id != grupo_id or grupo_id is None:
                error_expositores("Seleccione integrantes del grupo del trabajo.")
            clave = (rol, identificador)
            if clave not in actuales and (not persona.activo or persona.deleted_at is not None):
                error_expositores("Solo puede agregar integrantes activos.")
            if persona.identidad_id is not None:
                if persona.identidad_id in identidades:
                    error_expositores("Quite el expositor repetido.")
                identidades.add(persona.identidad_id)
            datos = {f"{rol}_id": identificador, rol: persona}
        if clave in vistos:
            error_expositores("Quite el expositor repetido.")
        vistos.add(clave)
        resultado.append((clave, datos))
    return resultado


def sincronizar_expositores(trabajo, valores, user_id):
    actuales = {(a.rol, a.nombre_clave if a.rol == "externo" else a.integrante.id): a for a in trabajo.expositores}
    nuevas = dict(valores)
    cambio = False
    for clave, asociacion in actuales.items():
        if clave not in nuevas:
            detalle = asociacion.serialize()
            trabajo.expositores.remove(asociacion)
            AuditoriaService.registrar_evento_relacion(entidad="trabajo_reunion_cientifica", registro_id=trabajo.id, relacion="expositores", accion="desvincular", detalle=detalle, user_id=user_id)
            cambio = True
    for clave, datos in valores:
        if clave not in actuales:
            asociacion = TrabajoReunionExpositor(**datos)
            trabajo.expositores.append(asociacion)
            AuditoriaService.registrar_evento_relacion(entidad="trabajo_reunion_cientifica", registro_id=trabajo.id, relacion="expositores", accion="vincular", detalle=asociacion.serialize(), user_id=user_id)
            cambio = True
    if cambio:
        trabajo.mark_updated(user_id)
