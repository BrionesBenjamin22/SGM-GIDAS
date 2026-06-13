# Sistema GIDAS

Sistema web para la gestion integral de una Unidad Cientifico Tecnologica
(UCT) o grupo de investigacion. Centraliza informacion institucional,
academica, administrativa y de produccion cientifica, con foco en trazabilidad,
auditoria y armado de memorias institucionales por periodo.

El sistema esta orientado a uso institucional controlado. No contiene datos
productivos, credenciales ni secretos versionados; la configuracion sensible
debe mantenerse siempre en archivos `.env` locales o de despliegue.

---

## Objetivo

GIDAS permite registrar, consultar, auditar y consolidar informacion del grupo
para construir memorias institucionales cerradas y exportables.

El dominio distingue tres niveles de informacion:

- datos vivos del sistema
- historial auditable de cambios
- snapshots historicos asociados a memorias cerradas

Una memoria cerrada debe operar sobre snapshots historicos, no sobre el estado
vivo de las tablas principales.

---

## Funcionalidades principales

- Autenticacion con roles `ADMIN`, `GESTOR` y `LECTURA`.
- Sesiones con access tokens de vida corta y refresh tokens rotativos.
- Gestion de usuarios, perfil y cambio de contrasena.
- Gestion institucional de UCT, directivos, cargos, programas, planificaciones
  y visitas academicas.
- Gestion de personal, investigadores, becarios y personal asociado.
- Gestion de proyectos de investigacion y participaciones relevantes.
- Gestion de recursos: becas, equipamiento, erogaciones y tipos asociados.
- Gestion de produccion academica y cientifica:
  - actividades de docencia
  - documentacion bibliografica
  - trabajos en reuniones cientificas
  - trabajos en revistas
  - distinciones
  - registros de propiedad
  - articulos de divulgacion
- Gestion de transferencia socio-productiva, adoptantes y contratos.
- Catalogos transversales.
- Busqueda global.
- Historial de cambios por entidad cuando el modulo lo expone.
- Memorias con versiones, estados, snapshots y exportacion Excel.

---

## Arquitectura

El proyecto funciona como un monolito modular desacoplado entre frontend y
backend.

```text
Usuario
  |
  v
Nginx proxy
  |
  +--> Frontend React estatico
  |
  +--> Flask API /api/v1
          |
          +--> PostgreSQL
          |
          +--> Redis
```

Componentes:

- `frontend`: React, TypeScript y Vite.
- `backend`: Flask, SQLAlchemy, Flask-Migrate y servicios de dominio.
- `db`: PostgreSQL.
- `redis`: almacenamiento compartido para rate limiting.
- `nginx`: proxy reverso y publicacion de frontend/API.

---

## Stack tecnologico

Backend:

- Python 3
- Flask
- Flask-SQLAlchemy
- Flask-Migrate / Alembic
- PostgreSQL
- Flask-CORS
- Flask-Limiter
- PyJWT
- openpyxl

Frontend:

- React
- TypeScript
- Vite
- React Router
- React Query
- TailwindCSS
- Recharts
- Lucide React

Infraestructura:

- Docker
- Docker Compose
- Nginx
- Redis

---

## Estructura del repositorio

```text
Sistema Gidas/
|-- backend/
|   |-- modules/
|   |-- migrations/
|   |-- tests/
|   `-- tools/
|-- frontend/
|   |-- src/
|   |   |-- modules/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- hooks/
|   |   |-- components/
|   |   `-- layouts/
|-- docs/
|-- nginx/
|-- tasks/
|-- docker-compose.yml
|-- docker-compose.dev.yml
`-- README.md
```

Carpetas clave:

- `backend/modules`: modulos backend por dominio, con modelos, rutas,
  controladores y servicios.
- `frontend/src/modules`: implementacion modular frontend por dominio.
- `frontend/src/pages`, `frontend/src/services` y `frontend/src/hooks`:
  fachadas de compatibilidad para imports y rutas existentes.
- `docs`: documentacion tecnica complementaria.
- `tasks`: seguimiento operativo de tareas del agente.
- `nginx`: configuracion del proxy reverso.

---

## Modulos del sistema

Los modulos actuales existen tanto en backend como en frontend:

- `auth`: login, registro, perfil, usuarios, roles, cambio de contrasena y
  refresh tokens.
- `catalogos`: categorias UTN, fuentes de financiamiento y catalogos de apoyo.
- `dashboard`: consultas agregadas para la vista principal.
- `grupo`: UCT, directivos, cargos, programas, planificaciones y visitas.
- `memorias`: periodos, versiones, estados, snapshots y exportacion.
- `personal`: investigadores, becarios, personal y tipos asociados.
- `produccion`: publicaciones, docencia, documentacion, distinciones,
  registros y articulos.
- `proyectos`: proyectos de investigacion, tipos y participaciones relevantes.
- `recursos`: becas, equipamiento, erogaciones y tipos.
- `search`: busqueda transversal.
- `shared`: auditoria, respuestas, paginacion, middleware y utilidades.
- `transferencia`: transferencias socio-productivas, adoptantes y contratos.

---

## API

La API publica se registra bajo el prefijo versionado:

```text
/api/v1
```

Todas las respuestas servidas desde `/api/v1` deben incluir el header:

```text
API-Version: v1
```

Prefijos principales:

```text
/api/v1/auth
/api/v1/catalogos/categoria-utn
/api/v1/catalogos/fuente-financiamiento
/api/v1/dashboards
/api/v1/grupo
/api/v1/memorias
/api/v1/personal
/api/v1/produccion
/api/v1/proyectos
/api/v1/recursos
/api/v1/search
/api/v1/transferencia
```

Healthcheck:

```http
GET /api/v1/health
```

Respuesta esperada:

```json
{
  "data": {
    "status": "ok"
  },
  "error": null,
  "meta": {}
}
```

Contrato recomendado de exito:

```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

Contrato recomendado de error:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Lo sentimos, no pudimos guardar los cambios. Verifique los datos e intente nuevamente.",
    "details": {}
  }
}
```

Los listados migrados aceptan paginacion con `page` y `per_page`. La convencion
del frontend es mostrar hasta 9 elementos por pagina en homes y 3 elementos por
pagina en historiales de cambios.

---

## Rutas frontend principales

El router usa rutas protegidas bajo `/` y rutas publicas para autenticacion:

Publicas:

```text
/login
/registro
```

Protegidas:

```text
/
/busqueda
/mi-perfil
/cambiar-password
/usuarios
/catalogos
/uct/nueva
/personal
/proyectos
/docenciaInvestigador
/documentacion
/trabajos-reunion
/trabajos-revistas
/articulos-divulgacion
/registros-propiedad
/erogaciones
/equipamiento
/objetosfinanciamiento
/transferencias
/distinciones
/participaciones
/visitantes
/memorias
```

Las rutas de alta, edicion y detalle siguen el patron funcional del modulo,
por ejemplo:

```text
/<modulo>/nuevo
/<modulo>/:id
/<modulo>/:id/editar
```

Algunas rutas historicas se mantienen como redirecciones o fachadas de
compatibilidad para no romper enlaces existentes.

---

## Autenticacion y seguridad

El modulo `auth` implementa:

- access tokens JWT de vida corta.
- refresh tokens rotativos.
- persistencia de sesiones refresh guardando solo hash del token.
- revocacion de refresh token en logout.
- revocacion de sesiones activas al cambiar contrasena o eliminar usuarios.
- control de permisos por rol en rutas protegidas.
- mensajes de error seguros y orientados a la accion del usuario.

Medidas operativas:

- CORS configurable por ambiente.
- rate limiting en backend, con Redis como storage compartido.
- rate limiting y headers defensivos en Nginx.
- validacion de secretos obligatorios en produccion.
- rechazo de placeholders y claves debiles en produccion.
- backend servido por Gunicorn en produccion.
- frontend servido como estatico por Nginx no privilegiado.
- contenedores con restricciones como `read_only`, `tmpfs`,
  `no-new-privileges`, `cap_drop` y limites de procesos cuando aplica.

No deben versionarse:

- archivos `.env` reales
- claves secretas
- tokens
- backups de base de datos
- datos productivos
- archivos exportados con informacion sensible

---

## Memorias institucionales

El modulo de memorias es el nucleo funcional del sistema.

Conceptos:

- `Memoria`: identidad persistente del expediente.
- `MemoriaVersion`: ciclo editable o cerrado de una memoria.
- Estados principales: `abierta`, `en revision`, `cerrada`.

Reglas:

- cada memoria nace con una version inicial.
- una version cerrada no debe modificarse.
- si el trabajo continua, se crea una nueva version.
- al cerrar una memoria se generan snapshots historicos.
- la exportacion Excel debe usar los datos congelados de la version cerrada.

Permisos generales:

- `ADMIN`: crea memorias, cambia estados, reabre y exporta.
- `GESTOR`: gestiona contenido y puede exportar cuando corresponde.
- `LECTURA`: consulta informacion disponible.

---

## Entornos y variables

El proyecto usa plantillas versionables para configurar entornos sin exponer
datos sensibles.

Archivos de referencia:

```text
.env.example
.env.testing.example
.env.production.example
backend/.env.example
backend/.env.testing.example
backend/.env.production.example
frontend/.env.example
frontend/.env.testing.example
frontend/.env.production.example
```

Archivos reales esperados:

```text
backend/.env
frontend/.env
.env.testing
backend/.env.testing
frontend/.env.testing
.env.production
backend/.env.production
frontend/.env.production
```

Variables relevantes del backend:

```text
APP_ENV
SECRET_KEY
JWT_SECRET
REFRESH_SECRET
DATABASE_URL
FRONTEND_URL
FRONTEND_URLS
JWT_EXPIRATION_MINUTES
RATELIMIT_STORAGE_URI
```

Variables relevantes del frontend:

```text
VITE_APP_ENV
VITE_API_BASE_URL
VITE_API_URL
VITE_SERVER_FILTER_PERSONAL
```

`VITE_API_BASE_URL` debe apuntar a la API versionada. Ejemplos:

```text
http://localhost:5000/api/v1
/api/v1
```

Las variables `VITE_*` son publicas y quedan embebidas en el build del
frontend. No deben contener secretos.

---

## Ejecucion con Docker

Desarrollo local con Compose:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Produccion o entorno integrado:

```bash
docker compose --env-file .env.production up --build -d
```

Servicios esperados:

- Nginx publica la aplicacion.
- Frontend sirve archivos estaticos o Vite segun el compose usado.
- Backend expone la API internamente.
- PostgreSQL y Redis quedan dentro de la red Docker en produccion.

Para despliegues con HTTPS, se recomienda usar un proxy externo del servidor
con certificados administrados fuera del repositorio y reenviar el trafico al
Nginx interno del compose.

---

## Ejecucion local sin Docker

Backend:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
flask db upgrade
python app.py
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Scripts frontend utiles:

```bash
npm run typecheck
npm run build
npm run build:testing
npm run build:production
```

---

## Base de datos y migraciones

El esquema se administra con Alembic mediante Flask-Migrate.

Comandos habituales desde `backend/`:

```bash
flask db heads
flask db current
flask db upgrade
flask db migrate -m "descripcion"
flask db downgrade
```

Antes de aplicar cambios estructurales, conviene verificar el estado de heads y
current. El objetivo operativo es mantener un historial de migraciones claro y
evitar divergencias no documentadas.

---

## Testing y validacion

Backend:

```bash
cd backend
venv\Scripts\python.exe -m unittest discover -s tests -v
```

Frontend:

```bash
cd frontend
npm run typecheck
npm run build
```

Cobertura actual mas fuerte:

- reglas de negocio de servicios backend
- autenticacion y refresh tokens
- auditoria
- snapshots de memorias
- pertenencia temporal de entidades a memorias
- contratos HTTP principales

La validacion manual sigue siendo importante para flujos completos de UI:
login, logout, refresh, cambio de contrasena, navegacion entre modulos,
formularios, historiales y exportacion.

---

## Documentacion adicional

Documentos disponibles:

- [Despliegue en produccion con Nginx y Certbot](./docs/despliegue_produccion.md)
- [Documentacion tecnica de memorias](./docs/memorias_tecnica.md)
- [Resumen tecnico de plantilla Excel](./docs/excel_memoria_template_summary.md)
- [Backend modular](./backend/modules/README.md)
- [Frontend modular](./frontend/src/modules/README.md)
- [Frontend](./frontend/README.md)

---

## Estado actual

El sistema esta funcional como aplicacion institucional de laboratorio o grupo
de investigacion. La arquitectura ya contempla modularidad, API versionada,
auditoria, historial, roles, autenticacion con refresh token rotativo,
compatibilidad Docker, healthchecks y separacion frontend/backend.

Estado observado en el repositorio:

- backend y frontend estan organizados por los mismos dominios principales.
- las rutas backend estan registradas bajo `/api/v1`.
- el frontend consume la API versionada mediante cliente HTTP centralizado.
- los modulos principales tienen pantallas de home, formulario y detalle cuando
  aplica.
- los endpoints de historial existen en la mayoria de entidades operativas
  relevantes y se consumen progresivamente desde los detalles.
- las memorias mantienen su propio flujo de versiones, estados, snapshots y
  exportacion.

Puntos a seguir monitoreando:

- mantener un unico head efectivo de Alembic antes de nuevas migraciones.
- completar documentacion tecnica especifica por modulo a medida que se
  estabilicen contratos.
- revisar periodicamente que todos los detalles consuman historial cuando el
  endpoint exista.
- sostener pruebas manuales de flujos completos antes de un despliegue real.
- agregar una tarea programada futura para purgar sesiones refresh vencidas o
  revocadas luego del periodo de retencion definido.

---

## Licencia y uso

Proyecto desarrollado con fines academicos e institucionales.

El uso, despliegue y carga de datos reales deben realizarse conforme a las
politicas internas de la organizacion responsable.
