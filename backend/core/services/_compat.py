"""Helpers para exponer servicios modulares desde el namespace legacy."""

from importlib import import_module
import sys


def alias_module(nombre_legacy: str, nombre_modular: str):
    modulo = import_module(nombre_modular)
    sys.modules[nombre_legacy] = modulo
    return modulo
