# Autenticación y usuarios en frontend

## Alcance

El módulo implementa la landing pública, inicio y cierre de sesión, recuperación de sesión, registro del primer administrador, cambio obligatorio de contraseña, perfil propio y administración de usuarios. El token de acceso se conserva únicamente en memoria; la renovación usa la cookie `HttpOnly` emitida por backend.

## Estructura

- `pages/Landing.tsx`: composición visual de la landing pública y coordinación de sesión/configuración.
- `components/LandingAccessAction.tsx`: estados accesibles de carga, error, reintento y navegación de la landing.
- `services/authService.ts`: contrato de sesión, refresh, logout y contraseña.
- `services/usuariosService.ts`: CRUD administrativo y tipos de usuario.
- `hooks/useSystemSetup.ts`: consulta reutilizable y condicionable del estado de configuración.
- `utils/landingAccessState.ts`: decisión pura del estado de acceso visible en la landing.
- `utils/password.ts`: generación criptográfica de contraseñas temporales.

## Permisos y navegación

- `ADMIN`: administra usuarios y accede a las operaciones reservadas.
- `ADMIN` y `GESTOR`: acceden a altas y ediciones de entidades mediante rutas protegidas.
- `LECTURA`: accede a homes y detalles, pero no a rutas mutables.
- Todo usuario con `primer_login` debe cambiar su contraseña antes de ingresar al resto del sistema.
- Durante el refresh inicial se muestra un estado de verificación y no se redirige prematuramente al login.
- La landing dirige a `/registro` cuando falta el administrador inicial, a `/inicio` cuando existe sesión y a `/login` cuando el sistema ya está configurado.
- La consulta del administrador inicial solo se habilita después de restaurar la sesión y cuando no existe un usuario autenticado.

El backend mantiene la autorización definitiva. Las restricciones del router son defensa en profundidad y prevención de errores de uso.

## Validaciones y errores

- Los formularios validan usuario, email y contraseña antes de enviar.
- El perfil envía únicamente campos modificados y no llama al backend si no existen cambios.
- Los mensajes HTTP se obtienen mediante `getErrorMessage`, que solo consume contratos conocidos y utiliza mensajes accionables como fallback.
- Un fallo al consultar el estado de configuración nunca se interpreta como un sistema ya configurado ni habilita el registro.
- Un refetch conserva la última acción válida cuando existen datos en cache; solo un error inicial sin datos muestra el bloque de recuperación.
- El error de configuración ofrece reintento y contacto institucional con feedback accesible.
- Las contraseñas temporales tienen 16 caracteres, incluyen las clases requeridas y se generan con Web Crypto sin sesgo por módulo.

## Verificación

Desde `frontend/`:

```text
npm test
npm run typecheck
npm run build:production
```

`tests/landingAccessState.test.ts` cubre la precedencia de sesión, carga inicial,
errores, primer administrador, login y conservación de datos durante refetch.
