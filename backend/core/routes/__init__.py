from core.routes.auth_rutas import auth_bp
from core.routes.articulo_divulgacion_rutas import articulo_divulgacion_bp
from core.routes.tipo_personal_rutas import tipo_personal_bp
from core.routes.categoria_utn_routes import categoria_utn_bp
from core.routes.grupo_rutas import grupo_utn_bp
from core.routes.personal_rutas import personal_bp
from core.routes.tipo_dedicacion_rutas import tipo_dedicacion_bp
from core.routes.tipo_formacion_rutas import tipo_formacion_becario_bp
from core.routes.becario_rutas import becario_bp
from core.routes.fuente_financiamiento_rutas import fuente_financiamiento_bp
from core.routes.investigador_rutas import investigador_bp
from core.routes.personal_completo_ruta import personal_completo_bp
from core.routes.programa_actividades_rutas import planificacion_grupo_bp
from core.routes.programa_incentivos_rutas import programa_incentivos_bp
from core.routes.visita_rutas import visita_academica_bp
from core.routes.tipo_registro_rutas import tipo_registro_propiedad_bp
from core.routes.registro_propiedad_rutas import registros_propiedad_bp
from core.routes.autores_rutas import autor_bp
from core.routes.documentacion_rutas import documentacion_bibliografica_bp
from core.routes.tipo_erogacion_rutas import tipo_erogacion_bp
from core.routes.erogacion_rutas import erogacion_bp
from core.routes.equipamiento_rutas import equipamiento_bp
from core.routes.distinciones_rutas import distincion_recibida_bp
from core.routes.trabajo_reunion_rutas import trabajo_reunion_cientifica_bp
from core.routes.actividad_docencia_rutas import actividad_docencia_bp
from core.routes.tipo_contrato_rutas import tipo_contrato_bp
from core.routes.transferencia_socio_rutas import transferencia_socio_productiva_bp
from core.routes.trabajo_revista_rutas import trabajos_revistas_referato_bp
from core.routes.tipo_proyecto_rutas import tipo_proyecto_bp
from core.routes.proyecto_investigacion_rutas import proyecto_investigacion_bp
from core.routes.participacion_relevante_rutas import participacion_relevante_bp
from core.routes.grado_academico_rutas import grado_academico_bp
from core.routes.rol_actividad_rutas import rol_actividad_bp
from core.routes.adoptante_rutas import adoptante_bp
from core.routes.search_rutas import search_bp
from core.routes.tipo_reunion_rutas import tipo_reunion_bp
from core.routes.directivo_rutas import directivo_bp
from core.routes.becas_rutas import beca_bp
from core.routes.cargos_rutas import cargo_bp
from core.routes.dashboard_rutas import dashboard_bp
from core.routes.memorias_rutas import memoria_bp
from core.routes.status import health_bp

blueprints = [
    health_bp,
    actividad_docencia_bp,
    articulo_divulgacion_bp,
    adoptante_bp,
    auth_bp,
    autor_bp,
    becario_bp,
    beca_bp,
    categoria_utn_bp,
    cargo_bp,
    dashboard_bp,
    distincion_recibida_bp,
    directivo_bp,
    documentacion_bibliografica_bp,
    equipamiento_bp,
    erogacion_bp,
    fuente_financiamiento_bp,
    grupo_utn_bp,
    grado_academico_bp,
    investigador_bp,
    participacion_relevante_bp,
    personal_bp,
    personal_completo_bp,
    planificacion_grupo_bp,
    proyecto_investigacion_bp,
    programa_incentivos_bp,
    registros_propiedad_bp,
    rol_actividad_bp,
    search_bp,
    tipo_contrato_bp,
    tipo_dedicacion_bp,
    tipo_erogacion_bp,
    tipo_formacion_becario_bp,
    tipo_personal_bp,
    tipo_registro_propiedad_bp, 
    tipo_proyecto_bp,
    trabajo_reunion_cientifica_bp,
    trabajos_revistas_referato_bp,
    transferencia_socio_productiva_bp,
    visita_academica_bp,
    tipo_reunion_bp,
    memoria_bp
]
