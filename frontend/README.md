# GIDAS UCT – Frontend

## Requisitos
- **Node.js v20.19 o superior** (incluye npm).
  - Verificar instalación:
    ```bash
    node -v
    npm -v
    ```
  - Si no está instalado:
    - Descargar desde [https://nodejs.org/](https://nodejs.org/).
    
- **Git** instalado (para clonar el repo).

## Instrucciones

```bash
# 1. Clonar el repo
git clone <URL_DEL_REPO> gidas-uct
cd gidas-uct

# 2. Instalar dependencias
npm install

# 3. Correr en desarrollo
npm run dev
```

## Arquitectura frontend

El frontend se organiza como monolito modular bajo `src/modules`.

Cada modulo contiene, cuando aplica:

- `pages`: vistas de home, formulario y detalle.
- `services`: clientes HTTP, tipos TypeScript y contratos con backend.
- `hooks`: hooks reutilizables del dominio.
- `components`: componentes especificos del dominio.

Modulos actuales:

- `auth`
- `catalogos`
- `dashboard`
- `grupo`
- `memorias`
- `personal`
- `produccion`
- `proyectos`
- `recursos`
- `search`
- `shared`
- `transferencia`

Las implementaciones de dominio y sus imports residen directamente bajo
`src/modules/<modulo>`. Las antiguas fachadas `src/pages`, `src/services` y
`src/hooks` fueron retiradas para evitar dos rutas de acceso al mismo codigo.

Los componentes reutilizables globales permanecen en `src/components`, el layout
global en `src/layouts`, el contexto de autenticacion en `src/context` y los
estilos base en `src/styles`.

## Variables de entorno

El frontend usa variables publicas de Vite. Los archivos de referencia son:

- `.env.example`
- `.env.testing.example`
- `.env.production.example`

Variables principales:

- `VITE_APP_ENV`: marca el ambiente visible para el build (`local`, `testing`, `production`).
- `VITE_API_BASE_URL`: URL base versionada de la API. Usar `http://localhost:5000/api/v1` para backend local o `/api/v1` cuando se accede por nginx.
- `VITE_API_URL`: variable legacy aceptada por compatibilidad. Si no termina en `/api/v1`, el cliente HTTP agrega el prefijo versionado.
- `VITE_SERVER_FILTER_PERSONAL`: activa el filtrado del servidor para personal.

Scripts por ambiente:

```bash
npm run dev:testing
npm run build:testing
npm run build:production
```

## Docker y produccion

El frontend se construye con Dockerfile multi-stage:

- `dependencies`: instala dependencias con `npm ci`.
- `build`: genera el bundle estatico de Vite.
- `production`: sirve `dist` con Nginx no privilegiado en el puerto interno 8080.
- `development`: ejecuta Vite para desarrollo local.

En produccion debe usarse `VITE_API_BASE_URL=/api/v1` para que el proxy Nginx del proyecto enrute la API versionada sin exponer el backend al host. Las variables `VITE_*` son publicas y quedan embebidas en el bundle, por lo que no deben contener claves, tokens ni secretos.

Controles aplicados en produccion:

- imagen final sin Node.js ni dependencias de desarrollo.
- servidor Nginx no privilegiado.
- cache de assets estaticos versionados.
- fallback SPA hacia `index.html`.
- contenedor compatible con filesystem read-only, `no-new-privileges` y capacidades Linux reducidas desde Compose.

Para desarrollo con Docker usar el compose de desarrollo desde la raiz del proyecto:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
```

El archivo `docker-compose.dev.yml` es un override: debe ejecutarse junto con
`docker-compose.yml` para que todos los servicios compartan la misma red.

## Inicio de sesion

El flujo publico y autenticado se organiza asi:

- `/`: landing publica del sistema.
- `/login`: formulario de acceso.
- `/registro`: configuracion del administrador inicial, disponible solo si no existen usuarios.
- `/inicio`: home operativo protegido.

Al abrir una ruta protegida, el sistema muestra primero el login. Una
sesion almacenada se valida contra `GET /api/v1/auth/perfil` antes de permitir
el renderizado del layout y sus vistas. Si la validacion falla, la sesion local
se elimina y el usuario permanece en el login. El backend tambien rechaza en
esa validacion cuentas inactivas o eliminadas.

La landing reutiliza el componente `Footer` existente sin modificarlo. Landing
y login consultan el estado de configuracion inicial; el enlace de registro no
se renderiza salvo que el backend confirme que todavia no existe ningun usuario.

## Historial de directivos

El home de la UCT ofrece un popover no modal para consultar los periodos del
equipo directivo. La consulta se realiza al abrirlo mediante
`GET /api/v1/grupo/directivos/grupo/:grupoId` y presenta 3 registros por pagina.
El popover no usa backdrop y permite continuar interactuando con la pagina.
