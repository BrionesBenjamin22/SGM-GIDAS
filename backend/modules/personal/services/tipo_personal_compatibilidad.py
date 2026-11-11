"""Compatibilidad de las funciones del catálogo con la clase Personal.

Los nombres de clases reservadas no son funciones de apoyo. Se reconocen por
su denominación, sin depender de los IDs de una instalación. Las funciones
propias del catálogo (por ejemplo Especialista de laboratorio) siguen admitidas.
"""

import unicodedata


def normalizar_nombre_tipo(nombre):
    base = unicodedata.normalize("NFKD", nombre.casefold())
    base = "".join(char for char in base if not unicodedata.combining(char))
    return " ".join("".join(char if char.isalnum() else " " for char in base).split())


def es_funcion_profesional(nombre):
    # Conserva el criterio de clasificación de la sección 2.2 de la Memoria.
    return "profesional" in normalizar_nombre_tipo(nombre or "")


def compatible_con_personal(nombre):
    palabras = normalizar_nombre_tipo(nombre).split()
    if palabras[:1] == ["personal"]:
        palabras = palabras[1:]
    clases_reservadas = {
        "docente", "docentes", "investigador", "investigadores",
        "investigadora", "investigadoras", "becario", "becarios",
        "becaria", "becarias",
    }
    return bool(palabras) and palabras[0] not in clases_reservadas
