# SGM GIDAS – Sistema de Gestión del Laboratorio

Sistema web desarrollado para la gestión integral del laboratorio **GIDAS (UTN FRLP)**, orientado a centralizar la información, mejorar la trazabilidad y optimizar la consulta de datos en actividades de investigación y gestión.

---

##  Tecnologías utilizadas

### Backend

* Python
* Flask
* SQLAlchemy
* Alembic (migraciones)
* PostgreSQL

### Frontend

* React
* TypeScript
* Vite
* TailwindCSS
* React Query

### Infraestructura

* Docker
* Docker Compose

---

##  Arquitectura del sistema

El sistema sigue una arquitectura desacoplada:

* **Frontend** → interfaz de usuario
* **Backend** → API REST
* **Base de datos** → PostgreSQL
* **Orquestación** → Docker Compose

```text
[ React ] → [ Flask API ] → [ PostgreSQL ]
```

---

##  Estructura del proyecto

```text
SGM-GIDAS/
├── backend/
├── frontend/
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

##  Instalación y ejecución

### Requisitos

* Docker
* Docker Compose

---

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/sgm-gidas.git
cd sgm-gidas
```

---

### 2. Configurar variables de entorno

Crear el archivo:

```bash
backend/.env.docker
```

Ejemplo:

```env
POSTGRES_DB=gidas_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@db:5432/gidas_db
```

---

### 3. Levantar el sistema

```bash
docker compose up --build
```

---

##  Acceso a la aplicación

* Frontend: http://localhost:5173
* Backend: http://localhost:5000

---

##  Healthchecks

El sistema implementa healthchecks para garantizar el correcto funcionamiento:

* Base de datos → `pg_isready`
* Backend → endpoint `/health`

```bash
GET /health
```

Respuesta:

```json
{
  "status": "ok"
}
```

---

##  Autenticación

El sistema utiliza autenticación basada en tokens.

Roles disponibles:

* ADMIN
* GESTOR
* LECTURA

---

##  Funcionalidades principales

* Gestión de usuarios y roles
* Registro de actividades de investigación
* Administración de recursos y financiamiento
* Búsqueda global de información
* Auditoría de acciones

---

## Características técnicas destacadas

* Arquitectura modular en backend
* Manejo de sesiones con JWT
* Separación por capas (routes, services, models)
* Dockerización completa del sistema
* Persistencia de datos con volúmenes
* Healthchecks para monitoreo de servicios

---

## Estado del proyecto

En desarrollo – versión funcional para entorno académico y despliegue controlado.

---

##  Autores

**Benjamín Briones**
**Valentina Falco**
**Zoe Quiróz**
Estudiantes de Ingeniería en Sistemas – UTN FRLP

---

## Licencia

Este proyecto fue desarrollado con fines académicos.
