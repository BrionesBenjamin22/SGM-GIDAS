from sqlalchemy import or_
from sqlalchemy.orm import joinedload
from datetime import datetime
from extension import db
from core.models.fuente_financiamiento import FuenteFinanciamiento
from core.models.participacion_relevante import ParticipacionRelevante
from core.models.personal import Personal, Becario, Investigador
from core.models.proyecto_investigacion import ProyectoInvestigacion, BecarioProyecto, InvestigadorProyecto, TipoProyecto
from core.models.actividad_docencia import ActividadDocencia, InvestigadorActividadGrado
from core.models.articulo_divulgacion import ArticuloDivulgacion
from core.models.equipamiento import Equipamiento
from core.models.transferencia_socio import TipoContrato, TransferenciaSocioProductiva
from core.models.erogacion import Erogacion, TipoErogacion
from core.models.registro_patente import RegistrosPropiedad, TipoRegistroPropiedad
from core.models.documentacion_autores import DocumentacionBibliografica, Autor
from core.models.tipo_personal import TipoPersonal
from core.models.trabajo_reunion import TrabajoReunionCientifica
from core.models.trabajo_revista import TrabajosRevistasReferato
from core.models.directivos import Directivo, DirectivoGrupo, Cargo
from core.models.becas import Beca, Beca_Becario
import unicodedata


class SearchService:

    # ==================================================
    # FUNCIÓN DE NORMALIZACIÓN (quita acentos)
    # ==================================================
    @staticmethod
    def normalize_text(text: str) -> str:
        if not text:
            return ""
        return ''.join(
            c for c in unicodedata.normalize('NFD', text)
            if unicodedata.category(c) != 'Mn'
        ).lower()

    @staticmethod
    def matches_deleted_filter(obj, eliminados: str) -> bool:
        if eliminados == "all":
            return True

        if not hasattr(obj, "deleted_at"):
            return eliminados == "false"

        deleted = getattr(obj, "deleted_at", None) is not None
        return deleted if eliminados == "true" else not deleted

    @staticmethod
    def with_status(obj, data: dict) -> dict:
        if hasattr(obj, "deleted_at"):
            eliminado = getattr(obj, "deleted_at", None) is not None
            data["activo"] = not eliminado
            data["eliminado"] = eliminado
        else:
            data.setdefault("activo", True)
            data.setdefault("eliminado", False)
        return data

    # ==================================================
    # SEARCH PRINCIPAL
    # ==================================================
    @staticmethod
    def search(
        query_text: str,
        orden: str = "alf_asc",
        eliminados: str = "false"
    ):

        if not query_text or len(query_text.strip()) < 2:
            raise ValueError("El texto debe tener al menos 2 caracteres")

        query_normalized = SearchService.normalize_text(query_text.strip())
        resultados = []

        # ==================================================
        # PERSONAL
        # ==================================================
        personal_results = db.session.query(Personal)\
            .options(joinedload(Personal.tipo_personal))\
            .all()

        for p in personal_results:
            if not SearchService.matches_deleted_filter(p, eliminados):
                continue
            nombre_normalizado = SearchService.normalize_text(p.nombre_apellido)

            if query_normalized in nombre_normalizado:
                resultados.append(SearchService.with_status(p, {
                    "tipo": "Persona",
                    "id": p.id,
                    "titulo": p.nombre_apellido,
                    "subtitulo": p.tipo_personal.nombre if p.tipo_personal else None,
                    "fecha": None,
                    "url": f"/personal/{p.id}"
                }))

        # ==================================================
        # BECARIOS
        # ==================================================
        becario_results = db.session.query(Becario)\
        .options(
            joinedload(Becario.tipo_formacion),
            joinedload(Becario.participaciones_proyecto)
                .joinedload(BecarioProyecto.proyecto)
        )\
        .all()


        for b in becario_results:
            if not SearchService.matches_deleted_filter(b, eliminados):
                continue
            nombre_normalizado = SearchService.normalize_text(b.nombre_apellido)

            if query_normalized in nombre_normalizado:
                resultados.append(SearchService.with_status(b, {
                    "tipo": "Becario",
                    "id": b.id,
                    "titulo": b.nombre_apellido,
                    "subtitulo": b.tipo_formacion.nombre if b.tipo_formacion else None,
                    "fecha": None,
                    "url": f"/becarios/{b.id}",
                    "extra": {
                        "proyectos": [
                            {
                                "id": p.proyecto.id,
                                "nombre": p.proyecto.nombre_proyecto,
                                "fecha_inicio": str(p.fecha_inicio),
                                "fecha_fin": str(p.fecha_fin) if p.fecha_fin else None
                            }
                            for p in b.participaciones_proyecto
                        ]

                    }
                }))

        # ==================================================
        # BECAS
        # ==================================================
        beca_results = db.session.query(Beca)\
            .options(
                joinedload(Beca.fuente_financiamiento),
                joinedload(Beca.becarios)
                    .joinedload(Beca_Becario.becario)
            )\
            .all()

        for beca in beca_results:
            if not SearchService.matches_deleted_filter(beca, eliminados):
                continue
            nombre_norm = SearchService.normalize_text(beca.nombre_beca)
            descripcion_norm = SearchService.normalize_text(beca.descripcion)
            fuente_norm = SearchService.normalize_text(
                beca.fuente_financiamiento.nombre
                if beca.fuente_financiamiento else ""
            )
            becarios_norm = [
                SearchService.normalize_text(relacion.becario.nombre_apellido)
                for relacion in beca.becarios
                if relacion.becario
            ]

            if (
                query_normalized in nombre_norm
                or query_normalized in descripcion_norm
                or query_normalized in fuente_norm
                or any(query_normalized in becario for becario in becarios_norm)
            ):
                resultados.append(SearchService.with_status(beca, {
                    "tipo": "Beca",
                    "id": beca.id,
                    "titulo": beca.nombre_beca,
                    "subtitulo": (
                        beca.fuente_financiamiento.nombre
                        if beca.fuente_financiamiento else None
                    ),
                    "fecha": None,
                    "url": f"/becas/{beca.id}",
                    "extra": {
                        "descripcion": beca.descripcion,
                        "fuente_financiamiento": (
                            beca.fuente_financiamiento.nombre
                            if beca.fuente_financiamiento else None
                        ),
                        "becarios": [
                            {
                                "id": relacion.becario.id,
                                "nombre_apellido": relacion.becario.nombre_apellido,
                                "fecha_inicio": str(relacion.fecha_inicio),
                                "fecha_fin": (
                                    str(relacion.fecha_fin)
                                    if relacion.fecha_fin else None
                                ),
                                "monto_percibido": relacion.monto_percibido
                            }
                            for relacion in beca.becarios
                            if relacion.becario
                        ]
                    }
                }))

        # ==================================================
        # INVESTIGADORES
        # ==================================================
        investigador_results = db.session.query(Investigador)\
        .options(
            joinedload(Investigador.tipo_dedicacion),
            joinedload(Investigador.categoria_utn),
            joinedload(Investigador.programa_incentivos),
            joinedload(Investigador.grupo_utn),
            joinedload(Investigador.participaciones_proyecto)
                .joinedload(InvestigadorProyecto.proyecto),
            joinedload(Investigador.participaciones_relevantes),
            joinedload(Investigador.trabajos_reunion_cientifica)
        )\
        .all()

        for i in investigador_results:
            if not SearchService.matches_deleted_filter(i, eliminados):
                continue
            nombre_normalizado = SearchService.normalize_text(i.nombre_apellido)

            if query_normalized in nombre_normalizado:
                resultados.append(SearchService.with_status(i, {
                    "tipo": "Investigador",
                    "id": i.id,
                    "titulo": i.nombre_apellido,
                    "subtitulo": i.tipo_dedicacion.nombre if i.tipo_dedicacion else None,
                    "fecha": None,
                    "url": f"/investigadores/{i.id}",
                    "extra": {
                        "categoria_utn": i.categoria_utn.nombre if i.categoria_utn else None,
                        "programa_incentivos": i.programa_incentivos.nombre if i.programa_incentivos else None,
                        "grupo": i.grupo_utn.nombre_sigla_grupo if i.grupo_utn else None,
                        "proyectos": [
                            {
                                "id": p.proyecto.id,
                                "nombre": p.proyecto.nombre_proyecto,
                                "fecha_inicio": str(p.fecha_inicio),
                                "fecha_fin": str(p.fecha_fin) if p.fecha_fin else None
                            }
                            for p in i.participaciones_proyecto
                        ],
                        
                        "participaciones_relevantes": [
                            {"id": pr.id, "evento": pr.nombre_evento}
                            for pr in i.participaciones_relevantes
                        ],
                        "trabajos_reunion": [
                            {"id": tr.id, "titulo": tr.titulo_trabajo}
                            for tr in i.trabajos_reunion_cientifica
                        ]
                    }
                }))

        # ==================================================
        # ACTIVIDADES DE DOCENCIA
        # ==================================================
        actividad_results = db.session.query(ActividadDocencia)\
            .options(
                joinedload(ActividadDocencia.investigador),
                joinedload(ActividadDocencia.investigadores_grado)
                    .joinedload(InvestigadorActividadGrado.grado_academico),
                joinedload(ActividadDocencia.rol_actividad)
            )\
            .all()

        for a in actividad_results:
            if not SearchService.matches_deleted_filter(a, eliminados):
                continue
            curso_norm = SearchService.normalize_text(a.curso)
            institucion_norm = SearchService.normalize_text(a.institucion)
            grado_activo = next(
                (
                    h.grado_academico
                    for h in a.investigadores_grado
                    if h.fecha_fin is None and h.grado_academico
                ),
                None
            )

            if query_normalized in curso_norm or query_normalized in institucion_norm:
                resultados.append(SearchService.with_status(a, {
                    "tipo": "Actividad de Docencia",
                    "id": a.id,
                    "titulo": a.curso,
                    "subtitulo": a.institucion,
                    "fecha": a.fecha_inicio,
                    "url": f"/actividades-docencia/{a.id}",
                    "extra": {
                        "fecha_inicio": str(a.fecha_inicio),
                        "fecha_fin": str(a.fecha_fin) if a.fecha_fin else None,
                        "investigador": a.investigador.nombre_apellido if a.investigador else None,
                        "grado_academico": {
                            "id": grado_activo.id,
                            "nombre": grado_activo.nombre
                        } if grado_activo else None,
                        "rol_actividad": {
                            "id": a.rol_actividad.id,
                            "nombre": a.rol_actividad.nombre
                        } if a.rol_actividad else None
                    }
                }))
        # ==================================================
        # PROYECTOS DE INVESTIGACIÓN (por nombre)
        # ==================================================

        proyecto_results = db.session.query(ProyectoInvestigacion)\
            .options(
                joinedload(ProyectoInvestigacion.tipo_proyecto),
                joinedload(ProyectoInvestigacion.grupo_utn),
                joinedload(ProyectoInvestigacion.fuente_financiamiento),
                joinedload(ProyectoInvestigacion.participaciones_investigador)
                    .joinedload(InvestigadorProyecto.investigador),
                joinedload(ProyectoInvestigacion.participaciones_becario)
                    .joinedload(BecarioProyecto.becario)
            )\
            .all()

        for proyecto in proyecto_results:
            if not SearchService.matches_deleted_filter(proyecto, eliminados):
                continue

            nombre_norm = SearchService.normalize_text(proyecto.nombre_proyecto)
            descripcion_norm = SearchService.normalize_text(proyecto.descripcion_proyecto)

            if query_normalized in nombre_norm or query_normalized in descripcion_norm:


                resultados.append(SearchService.with_status(proyecto, {
                    "tipo": "Proyecto de Investigación",
                    "id": proyecto.id,
                    "titulo": proyecto.nombre_proyecto,
                    "subtitulo": proyecto.tipo_proyecto.nombre if proyecto.tipo_proyecto else None,
                    "fecha": proyecto.fecha_inicio,
                    "url": f"/proyectos/{proyecto.id}",
                    "extra": {
                        "codigo": proyecto.codigo_proyecto,
                        "descripcion": proyecto.descripcion_proyecto,
                        "grupo": proyecto.grupo_utn.nombre_sigla_grupo
                            if proyecto.grupo_utn else None,
                        "fuente_financiamiento": proyecto.fuente_financiamiento.nombre
                            if proyecto.fuente_financiamiento else None,
                        "investigadores": [
                            {
                                "id": p.investigador.id,
                                "nombre": p.investigador.nombre_apellido,
                                "fecha_inicio": str(p.fecha_inicio),
                                "fecha_fin": str(p.fecha_fin) if p.fecha_fin else None
                            }
                            for p in proyecto.participaciones_investigador
                        ],
                        "becarios": [
                            {
                                "id": p.becario.id,
                                "nombre": p.becario.nombre_apellido,
                                "fecha_inicio": str(p.fecha_inicio),
                                "fecha_fin": str(p.fecha_fin) if p.fecha_fin else None
                            }
                            for p in proyecto.participaciones_becario
                        ]
                    }
                }))
                
                    
        # ==================================================
        # TIPO PROYECTO
        # ==================================================

        tipo_proyecto_results = db.session.query(TipoProyecto)\
            .options(joinedload(TipoProyecto.proyectos_investigacion))\
            .all()

        for tipo in tipo_proyecto_results:
            if not SearchService.matches_deleted_filter(tipo, eliminados):
                continue

            tipo_nombre_norm = SearchService.normalize_text(tipo.nombre)

            if query_normalized in tipo_nombre_norm:

                proyectos = [
                    {
                        "id": proyecto.id,
                        "nombre": proyecto.nombre_proyecto,
                        "codigo": proyecto.codigo_proyecto,
                        "url": f"/proyectos/{proyecto.id}"
                    }
                    for proyecto in tipo.proyectos_investigacion
                ]

                resultados.append(SearchService.with_status(tipo, {
                    "tipo": "Tipo de Proyecto",
                    "id": tipo.id,
                    "titulo": tipo.nombre,
                    "subtitulo": "Clasificación de proyectos",
                    "fecha": None,
                    "url": f"/tipos-proyecto/{tipo.id}",
                    "extra": {
                        "cantidad_proyectos": len(proyectos),
                        "proyectos": proyectos
                    }
                }))
                    
        # ==================================================
        # EQUIPAMIENTO
        # ==================================================

        equipamiento_results = db.session.query(Equipamiento)\
            .options(joinedload(Equipamiento.grupo_utn))\
            .all()

        for e in equipamiento_results:
            if not SearchService.matches_deleted_filter(e, eliminados):
                continue

            denominacion_norm = SearchService.normalize_text(e.denominacion)

            if query_normalized in denominacion_norm:

                resultados.append(SearchService.with_status(e, {
                    "tipo": "Equipamiento",
                    "id": e.id,
                    "titulo": e.denominacion,
                    "subtitulo": e.descripcion_breve,
                    "fecha": e.fecha_incorporacion,
                    "url": f"/equipamiento/{e.id}",
                    "extra": {
                        "grupo": e.grupo_utn.nombre_sigla_grupo if e.grupo_utn else None,
                        "monto_invertido": e.monto_invertido,
                        "fecha_incorporacion": str(e.fecha_incorporacion)
                    }
                }))

        # ==================================================
        # DOCUMENTACIÓN BIBLIOGRÁFICA
        # ==================================================

        documentos = db.session.query(DocumentacionBibliografica)\
            .options(
                joinedload(DocumentacionBibliografica.autores),
                joinedload(DocumentacionBibliografica.grupo_utn)
            )\
            .all()

        for doc in documentos:
            if not SearchService.matches_deleted_filter(doc, eliminados):
                continue

            titulo_norm = SearchService.normalize_text(doc.titulo)
            editorial_norm = SearchService.normalize_text(doc.editorial)

            if (
                query_normalized in titulo_norm
                or query_normalized in editorial_norm
            ):

                resultados.append(SearchService.with_status(doc, {
                    "tipo": "Documentación",
                    "id": doc.id,
                    "titulo": doc.titulo,
                    "subtitulo": doc.editorial,
                    "fecha": doc.fecha,
                    "url": f"/documentacion-bibliografica/{doc.id}",
                    "extra": {
                        "anio": doc.anio,
                        "grupo": doc.grupo_utn.nombre_unidad_academica if doc.grupo_utn else None,
                        "autores": [
                            {
                                "id": a.id,
                                "nombre_apellido": a.nombre_apellido
                            }
                            for a in doc.autores
                        ]
                    }
                }))

        # ==================================================
        # AUTORES
        # ==================================================

        autores = db.session.query(Autor)\
            .options(joinedload(Autor.libros))\
            .all()

        for autor in autores:
            if not SearchService.matches_deleted_filter(autor, eliminados):
                continue

            nombre_norm = SearchService.normalize_text(autor.nombre_apellido)

            if query_normalized in nombre_norm:

                documentos = [
                    {
                        "id": l.id,
                        "titulo": l.titulo,
                        "tipo": "Libro",  # Ajustar si tu modelo tiene campo tipo
                        "url": f"/documentacion-bibliografica/{l.id}"
                    }
                    for l in autor.libros
                ]

                resultados.append(SearchService.with_status(autor, {
                    "tipo": "Autor",
                    "id": autor.id,
                    "titulo": autor.nombre_apellido,
                    "subtitulo": "Autor bibliográfico",
                    "fecha": None,
                    "url": f"/autores/{autor.id}",
                    "extra": {
                        "cantidad_documentos": len(documentos),
                        "documentos": documentos
                    }
                }))
                
                
        # ==================================================
        # TIPO EROGACIÓN
        # ==================================================

        tipos_erogacion = db.session.query(TipoErogacion)\
            .options(joinedload(TipoErogacion.erogaciones))\
            .all()

        for tipo in tipos_erogacion:
            if not SearchService.matches_deleted_filter(tipo, eliminados):
                continue

            tipo_norm = SearchService.normalize_text(tipo.nombre)

            if query_normalized in tipo_norm:

                erogaciones = sorted(
                    tipo.erogaciones,
                    key=lambda e: e.fecha if hasattr(e, "fecha") else None,
                    reverse=True
                )

                erogaciones_data = [
                    {
                        "id": e.id,
                        "numero_erogacion": e.numero_erogacion,
                        "ingresos": e.ingresos,
                        "egresos": e.egresos,
                        "fecha": e.fecha,
                        "url": f"/erogaciones/{e.id}"
                    }
                    for e in erogaciones[:5]  # recientes
                ]

                total_egresos = sum(e.egresos or 0 for e in tipo.erogaciones)
                total_ingresos = sum(e.ingresos or 0 for e in tipo.erogaciones)

                resultados.append(SearchService.with_status(tipo, {
                    "tipo": "Tipo de Erogación",
                    "id": tipo.id,
                    "titulo": tipo.nombre,
                    "subtitulo": "Clasificación de gastos",
                    "fecha": None,
                    "url": f"/tipos-erogacion/{tipo.id}",
                    "extra": {
                        "cantidad_erogaciones": len(tipo.erogaciones),
                        "total_egresos": total_egresos,
                        "total_ingresos": total_ingresos,
                        "erogaciones_recientes": erogaciones_data
                    }
                }))
                    
        # ==================================================
        # FUENTE DE FINANCIAMIENTO
        # ==================================================

        fuentes = db.session.query(FuenteFinanciamiento).all()

        for fuente in fuentes:
            if not SearchService.matches_deleted_filter(fuente, eliminados):
                continue

            nombre_norm = SearchService.normalize_text(fuente.nombre)

            if query_normalized in nombre_norm:

                proyectos = [
                    {
                        "id": p.id,
                        "nombre": p.nombre_proyecto,
                        "monto_destinado": p.monto_destinado,
                        "url": f"/proyectos/{p.id}"
                    }
                    for p in fuente.proyectos_investigacion.all()
                ]

                resultados.append(SearchService.with_status(fuente, {
                    "tipo": "Fuente de Financiamiento",
                    "id": fuente.id,
                    "titulo": fuente.nombre,
                    "subtitulo": "Fuente activa",
                    "fecha": None,
                    "url": f"/fuentes-financiamiento/{fuente.id}",
                    "extra": {
                        "cantidad_proyectos": len(proyectos),
                        "proyectos": proyectos
                    }
                }))
                
        # ==================================================
        # PARTICIPACIÓN RELEVANTE
        # ==================================================

        participaciones = db.session.query(ParticipacionRelevante)\
            .options(joinedload(ParticipacionRelevante.investigador))\
            .all()

        for pr in participaciones:
            if not SearchService.matches_deleted_filter(pr, eliminados):
                continue

            evento_norm = SearchService.normalize_text(pr.nombre_evento)
            forma_norm = SearchService.normalize_text(pr.forma_participacion)

            if (
                query_normalized in evento_norm
                or query_normalized in forma_norm
            ):

                resultados.append(SearchService.with_status(pr, {
                    "tipo": "Participación Relevante",
                    "id": pr.id,
                    "titulo": pr.nombre_evento,
                    "subtitulo": pr.forma_participacion,
                    "fecha": pr.fecha,
                    "url": f"/participaciones-relevantes/{pr.id}",
                    "extra": {
                        "investigador": pr.investigador.nombre_apellido if pr.investigador else None
                    }
                }))
                
        # ==================================================
        # REGISTROS DE PROPIEDAD
        # ==================================================

        registros = db.session.query(RegistrosPropiedad)\
            .options(
                joinedload(RegistrosPropiedad.tipo_registro),
                joinedload(RegistrosPropiedad.grupo_utn)
            )\
            .all()

        for r in registros:
            if not SearchService.matches_deleted_filter(r, eliminados):
                continue

            articulo_norm = SearchService.normalize_text(r.nombre_articulo)
            organismo_norm = SearchService.normalize_text(r.organismo_registrante)

            if (
                query_normalized in articulo_norm
                or query_normalized in organismo_norm
            ):

                resultados.append(SearchService.with_status(r, {
                    "tipo": "Registro de Propiedad",
                    "id": r.id,
                    "titulo": r.nombre_articulo,
                    "subtitulo": r.organismo_registrante,
                    "fecha": r.fecha_registro,
                    "url": f"/registros-propiedad/{r.id}",
                    "extra": {
                        "tipo_registro": r.tipo_registro.nombre if r.tipo_registro else None,
                        "grupo": r.grupo_utn.nombre_sigla_grupo if r.grupo_utn else None
                    }
                }))
                
        # ==================================================
        # TIPO REGISTRO PROPIEDAD
        # ==================================================

        tipos_registro = db.session.query(TipoRegistroPropiedad)\
            .options(joinedload(TipoRegistroPropiedad.registros_propiedad))\
            .all()

        for tipo in tipos_registro:
            if not SearchService.matches_deleted_filter(tipo, eliminados):
                continue

            tipo_norm = SearchService.normalize_text(tipo.nombre)

            if query_normalized in tipo_norm:

                registros = [
                    {
                        "id": r.id,
                        "articulo": r.nombre_articulo,
                        "organismo": r.organismo_registrante,
                        "url": f"/registros-propiedad/{r.id}"
                    }
                    for r in tipo.registros_propiedad
                ]

                resultados.append(SearchService.with_status(tipo, {
                    "tipo": "Tipo Registro Propiedad",
                    "id": tipo.id,
                    "titulo": tipo.nombre,
                    "subtitulo": "Clasificación de registros",
                    "fecha": None,
                    "url": f"/tipos-registro-propiedad/{tipo.id}",
                    "extra": {
                        "cantidad_registros": len(registros),
                        "registros": registros
                    }
                }))
        # ==================================================
        # TRANSFERENCIA SOCIO PRODUCTIVA
        # ==================================================

        transferencias = db.session.query(TransferenciaSocioProductiva)\
            .options(
                joinedload(TransferenciaSocioProductiva.tipo_contrato_transferencia),
                joinedload(TransferenciaSocioProductiva.grupo_utn)
            )\
            .all()

        for t in transferencias:
            if not SearchService.matches_deleted_filter(t, eliminados):
                continue

            descripcion_norm = SearchService.normalize_text(t.descripcion_actividad)
            demandante_norm = SearchService.normalize_text(t.demandante)

            if (
                query_normalized in descripcion_norm
                or query_normalized in demandante_norm
            ):

                resultados.append(SearchService.with_status(t, {
                    "tipo": "Transferencia Socio Productiva",
                    "id": t.id,
                    "titulo": t.descripcion_actividad,
                    "subtitulo": t.demandante,
                    "fecha": t.fecha_inicio,
                    "url": f"/transferencias/{t.id}",
                    "extra": {
                        "tipo_contrato": (
                            t.tipo_contrato_transferencia.nombre
                            if t.tipo_contrato_transferencia else None
                        ),
                        "grupo": (
                            t.grupo_utn.nombre_sigla_grupo
                            if t.grupo_utn else None
                        ),
                        "monto": t.monto,
                        "adoptantes": [
                            p.adoptante.nombre
                            for p in t.participaciones
                            if p.deleted_at is None and p.adoptante
                        ]
                    }
                }))
                
                        
        # ==================================================
        # TIPO CONTRATO TRANSFERENCIA
        # ==================================================

        tipos_contrato = db.session.query(TipoContrato)\
            .options(joinedload(TipoContrato.transferencias))\
            .all()

        for tipo in tipos_contrato:
            if not SearchService.matches_deleted_filter(tipo, eliminados):
                continue

            tipo_norm = SearchService.normalize_text(tipo.nombre)

            if query_normalized in tipo_norm:

                transferencias = [
                    {
                        "id": t.id,
                        "descripcion": t.descripcion_actividad,
                        "demandante": t.demandante,
                        "url": f"/transferencias/{t.id}"
                    }
                    for t in tipo.transferencias
                ]

                resultados.append(SearchService.with_status(tipo, {
                    "tipo": "Tipo de Contrato",
                    "id": tipo.id,
                    "titulo": tipo.nombre,
                    "subtitulo": "Clasificación contractual",
                    "fecha": None,
                    "url": f"/tipos-contrato/{tipo.id}",
                    "extra": {
                        "cantidad_transferencias": len(transferencias),
                        "transferencias": transferencias
                    }
                }))

        # ==================================================
        # TIPO PERSONAL
        # ==================================================

        tipos_personal = db.session.query(TipoPersonal).all()

        for tipo in tipos_personal:
            if not SearchService.matches_deleted_filter(tipo, eliminados):
                continue

            tipo_norm = SearchService.normalize_text(tipo.nombre)

            if query_normalized in tipo_norm:

                personal_data = [
                    {
                        "id": p.id,
                        "nombre_apellido": p.nombre_apellido,
                        "horas_semanales": p.horas_semanales,
                        "activo": p.activo,
                        "url": f"/personal/{p.id}"
                    }
                    for p in tipo.personal.all()
                ]

                resultados.append(SearchService.with_status(tipo, {
                    "tipo": "Tipo Personal",
                    "id": tipo.id,
                    "titulo": tipo.nombre,
                    "subtitulo": "Clasificación de personal",
                    "fecha": None,
                    "url": f"/tipos-personal/{tipo.id}",
                    "extra": {
                        "cantidad_personal": len(personal_data),
                        "personal": personal_data
                    }
                }))

        # ==================================================
        # TRABAJO REUNIÓN CIENTÍFICA
        # ==================================================

        trabajos_reunion = db.session.query(TrabajoReunionCientifica)\
            .options(
                joinedload(TrabajoReunionCientifica.tipo_reunion_cientifica),
                joinedload(TrabajoReunionCientifica.investigadores),
                joinedload(TrabajoReunionCientifica.grupo_utn)
            )\
            .all()

        for tr in trabajos_reunion:
            if not SearchService.matches_deleted_filter(tr, eliminados):
                continue

            titulo_norm = SearchService.normalize_text(tr.titulo_trabajo)
            reunion_norm = SearchService.normalize_text(tr.nombre_reunion)
            procedencia_norm = SearchService.normalize_text(tr.procedencia)
            investigadores_norm = [
                SearchService.normalize_text(inv.nombre_apellido)
                for inv in tr.investigadores
            ]
            
            if (
                query_normalized in titulo_norm
                or query_normalized in reunion_norm
                or query_normalized in procedencia_norm
                or any(query_normalized in inv for inv in investigadores_norm)
            ):

                resultados.append(SearchService.with_status(tr, {
                    "tipo": "Trabajo en Reunión Científica",
                    "id": tr.id,
                    "titulo": tr.titulo_trabajo,
                    "subtitulo": tr.nombre_reunion,
                    "fecha": tr.fecha_inicio,
                    "url": f"/trabajos-reunion/{tr.id}",
                    "extra": {
                        "tipo_reunion": (
                            tr.tipo_reunion_cientifica.nombre
                            if tr.tipo_reunion_cientifica else None
                        ),
                        "procedencia": tr.procedencia,
                        "grupo": (
                            tr.grupo_utn.nombre_unidad_academica
                            if tr.grupo_utn else None
                        ),
                        "investigadores": [
                            {
                                "id": inv.id,
                                "nombre": inv.nombre_apellido
                            }
                            for inv in tr.investigadores
                        ]
                    }
                }))
                
                
        # ==================================================
        # TRABAJOS EN REVISTAS CON REFERATO
        # ==================================================

        trabajos_revista = db.session.query(TrabajosRevistasReferato)\
            .options(
                joinedload(TrabajosRevistasReferato.grupo_utn),
                joinedload(TrabajosRevistasReferato.tipo_reunion),
                joinedload(TrabajosRevistasReferato.investigadores)
            )\
            .all()

        for tr in trabajos_revista:
            if not SearchService.matches_deleted_filter(tr, eliminados):
                continue

            titulo_norm = SearchService.normalize_text(tr.titulo_trabajo)
            revista_norm = SearchService.normalize_text(tr.nombre_revista)
            editorial_norm = SearchService.normalize_text(tr.editorial)
            issn_norm = SearchService.normalize_text(tr.issn)
            pais_norm = SearchService.normalize_text(tr.pais)
            investigadores_norm = [
                SearchService.normalize_text(inv.nombre_apellido)
                for inv in tr.investigadores
            ]

            if (
                query_normalized in titulo_norm
                or query_normalized in revista_norm
                or query_normalized in editorial_norm
                or query_normalized in issn_norm
                or query_normalized in pais_norm
                or any(query_normalized in inv for inv in investigadores_norm)
            ):

                resultados.append(SearchService.with_status(tr, {
                    "tipo": "Trabajo en Revista con Referato",
                    "id": tr.id,
                    "titulo": tr.titulo_trabajo,
                    "subtitulo": tr.nombre_revista,
                    "fecha": tr.fecha,
                    "url": f"/trabajos-revistas/{tr.id}",
                    "extra": {
                        "editorial": tr.editorial,
                        "issn": tr.issn,
                        "pais": tr.pais,
                        "grupo": tr.grupo_utn.nombre_sigla_grupo if tr.grupo_utn else None,
                        "tipo_reunion": tr.tipo_reunion.nombre if tr.tipo_reunion else None,
                        "investigadores": [
                            {
                                "id": inv.id,
                                "nombre": inv.nombre_apellido
                            }
                            for inv in tr.investigadores
                        ]
                    }
                }))



        # ==================================================
        # DIRECTIVOS
        # ==================================================

        directivo_results = db.session.query(Directivo)\
            .options(
                joinedload(Directivo.participaciones_grupo)
                    .joinedload(DirectivoGrupo.cargo),
                joinedload(Directivo.participaciones_grupo)
                    .joinedload(DirectivoGrupo.grupo_utn)
            )\
            .all()

        for d in directivo_results:
            if not SearchService.matches_deleted_filter(d, eliminados):
                continue

            nombre_norm = SearchService.normalize_text(d.nombre_apellido)

            if query_normalized in nombre_norm:

                participacion_activa = next(
                    (p for p in d.participaciones_grupo if p.fecha_fin is None),
                    None
                )

                if participacion_activa:

                    resultados.append(SearchService.with_status(d, {
                        "tipo": "Directivo",
                        "id": d.id,
                        "titulo": d.nombre_apellido,
                        "subtitulo": participacion_activa.cargo.nombre if participacion_activa.cargo else None,
                        "fecha": participacion_activa.fecha_inicio,
                        "url": f"/directivos/{d.id}",
                        "extra": {
                            "cargo": participacion_activa.cargo.nombre if participacion_activa.cargo else None,
                            "grupo_utn": participacion_activa.grupo_utn.nombre_sigla_grupo if participacion_activa.grupo_utn else None,
                            "grupo_utn_id": participacion_activa.grupo_utn.id if participacion_activa.grupo_utn else None,
                            "fecha_inicio": participacion_activa.fecha_inicio,
                            "url_grupo": f"/uct/{participacion_activa.grupo_utn.id}" if participacion_activa.grupo_utn else None
                        }
                    }))


        # ==================================================
        # ARTICULOS DE DIVULGACION
        # ==================================================

        articulos = db.session.query(ArticuloDivulgacion)\
            .options(
                joinedload(ArticuloDivulgacion.grupo_utn)
            )\
            .all()

        for a in articulos:
            if not SearchService.matches_deleted_filter(a, eliminados):
                continue

            titulo_norm = SearchService.normalize_text(a.titulo)
            descripcion_norm = SearchService.normalize_text(a.descripcion)

            if (
                query_normalized in titulo_norm
                or query_normalized in descripcion_norm
            ):

                resultados.append(SearchService.with_status(a, {
                    "tipo": "Artículo de Divulgación",
                    "id": a.id,
                    "titulo": a.titulo,
                    "grupo": (
                        a.grupo_utn.nombre_sigla_grupo
                        if a.grupo_utn else None
                    ),
                    "fecha": a.fecha_publicacion,
                    "url": f"/articulos-divulgacion/{a.id}",
                    "extra": {
                        "descripcion": a.descripcion
                    }
                }))



        # ==================================================
        # ORDENAMIENTO GLOBAL
        # ==================================================
        if orden == "alf_asc":
            resultados.sort(
                key=lambda x: (
                    0 if x.get("activo") else 1,
                    x["titulo"].lower()
                )
            )

        elif orden == "alf_desc":
            resultados.sort(
                key=lambda x: (
                    0 if x.get("activo") else 1,
                    x["titulo"].lower()
                ),
                reverse=True
            )
            
        elif orden == "fecha_desc":
            resultados.sort(
                key=lambda x: x["fecha"] or datetime.min.date(),
                reverse=True
            )

        elif orden == "fecha_asc":
            resultados.sort(
                key=lambda x: x["fecha"] or datetime.min.date()
            )

        return resultados
