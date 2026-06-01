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

## Variables de entorno

El frontend usa variables publicas de Vite. Los archivos de referencia son:

- `.env.example`
- `.env.testing.example`
- `.env.production.example`

Variables principales:

- `VITE_APP_ENV`: marca el ambiente visible para el build (`local`, `testing`, `production`).
- `VITE_API_URL`: URL base de la API. Usar `http://localhost:5000` para backend local o `/api` cuando se accede por nginx.
- `VITE_SERVER_FILTER_PERSONAL`: activa el filtrado del servidor para personal.

Scripts por ambiente:

```bash
npm run dev:testing
npm run build:testing
npm run build:production
```
