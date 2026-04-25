Backend - Sistema GIDAS

Descripcion general
Este backend implementa la API del sistema GIDAS sobre Flask, SQLAlchemy y PostgreSQL.
Su responsabilidad principal es administrar la informacion academica, administrativa y de produccion del laboratorio, manteniendo trazabilidad operativa, auditoria de cambios y versionado historico de memorias.

En el estado actual del proyecto, la memoria es una entidad central del dominio:
- una memoria nace con una version inicial en estado abierta
- puede pasar por los estados abierta, en revision y cerrada
- al cerrarse genera snapshots historicas de las entidades relevantes del sistema
- si debe retomarse el trabajo, no se reabre la version cerrada: se crea una nueva version de la misma memoria

Esta estructura permite que la generacion final del Excel se apoye en una foto historica consistente de la ultima version cerrada de la memoria.

Stack tecnologico
- Python 3
- Flask
- Flask-SQLAlchemy
- Flask-Migrate / Alembic
- PostgreSQL
- PyJWT
- openpyxl

Estructura principal
- app.py
  Punto de entrada de la aplicacion y factory principal.
- config.py
  Configuracion de entorno, base de datos, CORS y JWT.
- extension.py
  Inicializacion compartida de SQLAlchemy y Migrate.
- core/models
  Entidades del dominio y tablas auxiliares de auditoria y snapshot.
- core/services
  Logica de negocio, validaciones, historiales, snapshots y exportacion.
- core/controllers
  Adaptacion HTTP entre rutas y servicios.
- core/routes
  Blueprints y definicion de endpoints.
- migrations
  Historial de migraciones Alembic.
- tests
  Tests unitarios y de integracion liviana del backend.

Capacidades actuales del backend
- Autenticacion con JWT y control de acceso por rol.
- CRUD y consultas de entidades academicas y administrativas del sistema.
- Auditoria de cambios por campo mediante una tabla generica.
- Registro de eventos sobre relaciones relevantes.
- Modelo de memorias con versionado explicito.
- Snapshots historicas por version cerrada de memoria para entidades consumidas por la memoria y el futuro proceso de exportacion.
- Endpoints de historial consumible para frontend en entidades clave.

Modelo de memorias
La capa de memorias ya no responde a un CRUD simple. El dominio se organiza de la siguiente manera:
- Memoria
  Representa la identidad persistente del expediente o memoria academica.
- MemoriaVersion
  Representa cada ciclo de trabajo editable de una memoria.
- Estados
  abierta, en revision, cerrada.
- Regla de cierre
  cuando una version se cierra, se persiste una foto historica de las entidades relevantes.
- Regla de reapertura
  una version cerrada no se modifica; si el trabajo continua, se crea una nueva version de la memoria.

Auditoria y trazabilidad
El backend registra informacion de auditoria en dos niveles:
- Auditoria estructural del registro
  created_at, updated_at, deleted_at, created_by, updated_by, deleted_by.
- Auditoria por campo
  cambios de valor registrados en una tabla generica de historial.

Ademas, las relaciones relevantes del dominio tambien pueden generar eventos de auditoria, por ejemplo vinculaciones o desvinculaciones.

Variables de entorno
La aplicacion carga variables desde el archivo definido en ENV_FILE. Si no se informa, usa .env.local.

Variables importantes:
- SECRET_KEY
- JWT_SECRET
- REFRESH_SECRET
- DATABASE_URL
- FRONTEND_URL
- JWT_EXPIRATION_MINUTES

Valor por defecto de base de datos:
postgresql://postgres:postgres@localhost:5432/gidas_db

Ejecucion local
1. Crear y activar entorno virtual.
2. Instalar dependencias:
   pip install -r requirements.txt
3. Configurar variables de entorno en .env.local.
4. Aplicar migraciones:
   flask db upgrade
5. Ejecutar la aplicacion:
   python app.py

La API se inicia por defecto en:
http://0.0.0.0:5000

Migraciones
El esquema se administra con Alembic a traves de Flask-Migrate.

Comandos habituales:
- flask db upgrade
- flask db migrate -m "mensaje"
- flask db downgrade
- flask db heads

Antes de continuar una linea de desarrollo importante, conviene verificar que exista un unico head activo.

Tests
La carpeta tests contiene tests unitarios y de integracion liviana.
Estos tests validan principalmente:
- reglas de negocio de los services
- auditoria por campo
- transiciones de estado de memoria
- generacion de snapshots por cierre
- permisos de rutas y middleware
- contrato HTTP basico entre rutas, controller y service

Ejemplos de ejecucion:
- python -m unittest discover -s tests -v
- python -m unittest tests.test_memoria_service tests.test_memoria_routes -v

Alcance actual de los tests
Los tests estan orientados a logica de backend y contratos del sistema. No reemplazan la validacion final sobre base real ni la verificacion completa de la exportacion Excel, que debe hacerse una vez cerrada la integracion funcional del modulo de memorias.

Consideraciones de mantenimiento
- Los models deben contener solo entidades y relaciones.
- Las transiciones de estado y reglas del dominio viven en services.
- Toda nueva entidad que participe del contenido final de memoria debe evaluarse en dos planos:
  1. historial consumible para frontend
  2. snapshot historica al cierre de MemoriaVersion
- La exportacion Excel debe consumir la ultima version cerrada de memoria y no las tablas vivas.

Estado funcional del backend
El backend ya representa una base estable para:
- evolucion del modulo de memorias
- consolidacion de historiales consumibles
- armado de snapshots historicas
- futura integracion final de exportacion Excel basada en version cerrada

Este archivo debe actualizarse cuando cambie la arquitectura de memorias, la estrategia de auditoria o el contrato principal de exportacion.
