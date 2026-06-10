"""Compatibility wrapper for the modular backend layout."""

from core.services._compat import alias_module

_module = alias_module(
    __name__,
    "modules.produccion.services.registro_propiedad_service",
)
globals().update(_module.__dict__)
