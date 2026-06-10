"""Compatibility wrapper for the modular backend layout."""

from core.services._compat import alias_module

_module = alias_module(__name__, "modules.recursos.services.becas_service")
globals().update(_module.__dict__)
