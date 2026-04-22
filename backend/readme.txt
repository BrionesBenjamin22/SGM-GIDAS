
Campo agregado monto_destinado

Filtros agregados a ProyectoInvestigacion

orden == "asc"  ordena alfabeticamete A-Z
orden == "desc" ordena alfabeticamete Z-A

orden == "monto_asc":
    query = query.order_by(ProyectoInvestigacion.monto_destinado.asc()) Ordena de menor a Mayor
orden == "monto_desc":
    query = query.order_by(ProyectoInvestigacion.monto_destinado.desc()) Ordena de Mayor a menor