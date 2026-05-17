# Sistema GIDAS

Sistema web orientado a la gestión de la **UCT / grupo de investigación** y, especialmente, al armado de las **memorias institucionales** a partir de los elementos administrados por el grupo a lo largo de cada período.

El proyecto permite registrar, consultar, auditar y versionar información académica, administrativa y de producción científica, para luego consolidarla en una memoria cerrada y exportarla en formato Excel institucional.

---

## Propósito del sistema

SGM no es solo un sistema CRUD de entidades aisladas. Su objetivo principal es:

- centralizar la información del grupo de investigación
- mantener trazabilidad y auditoría sobre los cambios
- construir memorias por período con versionado explícito
- congelar snapshots históricos al cerrar una memoria
- exportar el contenido real de cada memoria cerrada a Excel

Esto implica que el sistema distingue entre:

- **datos vivos del sistema**
- **historial de cambios consumible**
- **snapshot histórico de memoria**

La memoria cerrada siempre debe trabajar sobre snapshots, no sobre tablas vivas.

---

## Funcionalidades principales

- Gestión de UCT, autoridades y configuración institucional
- Gestión de usuarios y roles (`ADMIN`, `GESTOR`, `LECTURA`)
- Administración de:
  - investigadores
  - becarios
  - personal
  - proyectos
  - actividades en docencia
  - documentación bibliográfica
  - equipamiento
  - erogaciones
  - transferencias socio-productivas
  - trabajos en reuniones científicas
  - trabajos en revistas
  - distinciones
  - registros de propiedad
  - artículos de divulgación
  - visitas académicas
  - participaciones relevantes
- Auditoría por campo y eventos de relaciones
- Búsqueda global
- Gestión de memorias con versiones y estados
- Exportación de Excel basada en memorias cerradas

---

## Arquitectura general

El sistema se organiza como una arquitectura desacoplada:

- **Frontend**: React + Vite
- **Backend**: Flask + SQLAlchemy
- **Base de datos**: PostgreSQL
- **Proxy**: Nginx
- **Orquestación**: Docker Compose

```text
[ React / Vite ] -> [ Nginx ] -> [ Flask API ] -> [ PostgreSQL ]
```

---

## Stack tecnológico

### Backend

- Python 3
- Flask
- Flask-SQLAlchemy
- Flask-Migrate / Alembic
- PostgreSQL
- Flask-CORS
- Flask-Limiter
- PyJWT
- openpyxl

### Frontend

- React
- TypeScript
- Vite
- TailwindCSS
- React Query
- React Router
- Recharts

### Infraestructura

- Docker
- Docker Compose
- Nginx

---

## Estructura del proyecto

```text
Sistema Gidas/
├── backend/
├── frontend/
├── docs/
├── nginx/
├── docker-compose.yml
└── README.md
```

### Carpetas clave

- `backend/`
  API, dominio, servicios, modelos, migraciones y tests.
- `frontend/`
  Interfaz de usuario, páginas, servicios HTTP y componentes.
- `docs/`
  Documentación técnica y funcional del proyecto.
- `nginx/`
  Configuración del proxy reverso y rate limiting.

---

## Módulo de memorias

El módulo de memorias es el núcleo funcional del sistema.

### Conceptos principales

- **Memoria**
  Representa la identidad persistente del expediente.

- **MemoriaVersion**
  Representa cada ciclo de trabajo editable de una memoria.

- **Estados**
  - `abierta`
  - `en revision`
  - `cerrada`

### Reglas importantes

- Cada memoria nace con una versión inicial.
- Una versión cerrada no se modifica.
- Si el trabajo continúa, se crea una nueva versión de esa memoria.
- Al cerrar una memoria, el sistema genera snapshots históricos.
- El Excel debe tomar únicamente los datos de esa versión cerrada.
- La planificación futura del grupo se carga una vez cerrada la memoria y refiere al período siguiente.

### Permisos por rol

- **ADMIN**
  - crea memorias
  - cambia estados
  - reabre memorias
  - puede exportar Excel

- **GESTOR**
  - no gestiona estados ni reapertura
  - puede exportar Excel una vez generado el snapshot

- **LECTURA**
  - solo consulta información y elementos registrados

---

## Requisitos previos

### Para correr con Docker

- Docker
- Docker Compose

### Para correr localmente por separado

- Python 3
- Node.js 18 o superior
- npm
- PostgreSQL

---

## Ejecución con Docker Compose

Es la forma recomendada para levantar todo el entorno integrado.

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd "Sistema Gidas"
```

### 2. Configurar variables de entorno

El proyecto usa archivos de entorno dentro de cada módulo. Como base mínima:

- `backend/.env.docker`
- `frontend/.env`

### 3. Levantar servicios

```bash
docker compose up --build
```

### Servicios disponibles

- **Proxy / acceso principal**: `http://localhost`
- **Base de datos**: `localhost:5433`

En el esquema Docker actual:

- el frontend queda detrás de `nginx`
- el backend queda detrás de `nginx`
- PostgreSQL expone `5433` localmente

---

## Ejecución local por separado

Útil para desarrollo fino de frontend o backend sin usar el compose completo.

### Backend

Desde `backend/`:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
flask db upgrade
python app.py
```

API por defecto:

```text
http://localhost:5000
```

### Frontend

Desde `frontend/`:

```bash
npm install
npm run dev
```

Frontend por defecto:

```text
http://localhost:5173
```

Nota:
- si corrés frontend y backend por separado sin `nginx`, el frontend debe apuntar al backend mediante `VITE_API_URL`
- si usás `nginx`, podés trabajar con rutas relativas como `/api`

---

## Variables y entorno

### Backend

El backend carga variables desde el archivo definido en `ENV_FILE`. Si no se informa, usa `.env.local`.

Variables frecuentes:

- `SECRET_KEY`
- `JWT_SECRET`
- `REFRESH_SECRET`
- `DATABASE_URL`
- `FRONTEND_URL`
- `FRONTEND_URLS`
- `JWT_EXPIRATION_MINUTES`

### Frontend

Variable importante:

- `VITE_API_URL`

Ejemplos comunes:

- con backend local:
  - `VITE_API_URL=http://localhost:5000`
- con proxy:
  - `VITE_API_URL=/api`

---

## Base de datos y migraciones

El esquema se administra con Alembic a través de Flask-Migrate.

Comandos habituales:

```bash
flask db upgrade
flask db migrate -m "mensaje"
flask db downgrade
flask db heads
```

Antes de avanzar con cambios estructurales importantes, conviene verificar que exista un único `head`.

---

## Seguridad y operación

El sistema ya incorpora medidas operativas básicas:

- autenticación JWT
- control de permisos por rol
- CORS configurado para desarrollo y despliegue
- rate limiting en backend y `nginx`
- healthcheck del backend en `/health`

Endpoint:

```http
GET /health
```

Respuesta esperada:

```json
{
  "status": "ok"
}
```

---

## Testing

La mayor cobertura actual está en backend.

Desde `backend/`:

```bash
python -m unittest discover -s tests -v
```

Los tests cubren principalmente:

- reglas de negocio de services
- auditoría
- snapshots por cierre de memoria
- pertenencia temporal de entidades a memorias
- contratos HTTP básicos

---

## Documentación adicional

En la carpeta `docs/` se documentan decisiones y piezas importantes del sistema.

Documentos destacados:

- [Documentación técnica de memorias](./docs/memorias_tecnica.md)
- [Resumen técnico de plantilla Excel](./docs/excel_memoria_template_summary.md)

Además, en `backend/readme.txt` hay una descripción técnica más detallada del backend y del dominio de memorias.

---

## Estado actual del proyecto

El sistema se encuentra funcional y orientado a uso institucional controlado.

Actualmente ya dispone de:

- administración integral de entidades del grupo
- historiales de cambios consumibles en frontend
- snapshots por memoria cerrada
- navegación contextual desde memorias hacia los módulos filtrados
- exportación Excel por memoria cerrada

El foco principal del proyecto está puesto en:

- la gestión correcta del contenido de cada memoria
- la coherencia histórica de los snapshots
- la generación de documentación institucional consistente

---

## Autores

- Benjamín Briones
- Valentina Falco
- Zoe Quiróz

Estudiantes de Ingeniería en Sistemas - UTN FRLP

---

## Licencia

Proyecto desarrollado con fines académicos e institucionales.
