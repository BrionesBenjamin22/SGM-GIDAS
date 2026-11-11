"""Validación de clasificación explícita, sin inferir datos históricos."""
from modules.shared.exceptions import ValidationError


def validar_clasificacion(data, *, reunion=False, actual=None):
    resultado = {}
    errores = {}
    if reunion:
        valores = {campo: data.get(campo, getattr(actual, campo, None)) for campo in ("referato", "alcance")}
        if type(valores["referato"]) is not bool:
            errores["referato"] = "Seleccione Sí o No."
        if not isinstance(valores["alcance"], str) or valores["alcance"] not in ("nacional", "internacional"):
            errores["alcance"] = "Seleccione Nacional o Internacional."
        if errores:
            raise ValidationError("Revise los campos indicados e intente nuevamente.", details={"fields": errores})
        return valores
    if "referato" in data:
        valor = data["referato"]
        if valor is not None and type(valor) is not bool:
            errores["referato"] = "Seleccione Sí, No o Sin informar."
        else:
            resultado["referato"] = valor
    if errores:
        raise ValidationError("Revise los campos indicados e intente nuevamente.", details={"fields": errores})
    return resultado
