# Autenticación y usuarios en frontend

## Errores por campo (ISS-09)

Al cambiar la contraseña, el service instala el nuevo access token y el
contexto actualiza usuario y tiempos. El backend reemplaza la cookie de refresh
revocada para que una recarga conserve la sesión.
Si una sesión previamente activa ya no puede restaurarse, Login muestra una
sola vez un aviso claro para iniciar sesión nuevamente. El aviso de vencimiento
anticipado sigue usando `session_expires_at` del backend.

Los formularios del módulo consumen `error.details.fields` mediante
`applyFieldErrors` de `src/lib/httpError.ts`, muestran el mensaje junto al control
y enfocan el primer campo inválido. Los nombres locales de los controles se
vinculan con las claves API, sin cambiar el payload del service ni los permisos.
Los errores sin campo o con campos desconocidos conservan el aviso general;
los errores inesperados muestran un mensaje publico seguro o un fallback accionable, sin identificadores internos.
Se conservan las reglas y el momento de validación existentes. Véase el contrato
transversal en `../README.md`.

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
- `utils/roleCapabilities.ts`: descripción reutilizable de las capacidades y
  restricciones visibles para cada rol.

## Permisos y navegación

- `ADMIN`: administra usuarios y accede a las operaciones reservadas.
- `ADMIN` y `GESTOR`: acceden a altas y ediciones de entidades mediante rutas protegidas.
- `LECTURA`: accede a homes y detalles, pero no a rutas mutables.
- `MiPerfil` muestra una tarjeta de permisos de la sesión con las acciones
  disponibles y restringidas del rol activo.
- Todo usuario con `primer_login` debe cambiar su contraseña antes de ingresar al resto del sistema.
- Durante el refresh inicial se muestra un estado de verificación y no se redirige prematuramente al login.
- La landing dirige a `/registro` cuando falta el administrador inicial, a `/inicio` cuando existe sesión y a `/login` cuando el sistema ya está configurado.
- La consulta del administrador inicial solo se habilita después de restaurar la sesión y cuando no existe un usuario autenticado.

El backend mantiene la autorización definitiva. Las restricciones del router son defensa en profundidad y prevención de errores de uso.
El contrato frontend utiliza exclusivamente `ADMIN`, `GESTOR` y `LECTURA`; el
alias heredado `LECTOR` no forma parte de los tipos ni de las vistas nuevas.

- Las respuestas de autenticacion informan el vencimiento del access token y de la
  sesion renovable. La actividad solo dispara refresh cuando el access token esta
  proximo a vencer y las solicitudes concurrentes comparten una unica renovacion.
- Antes del vencimiento definitivo se muestra un dialogo accesible con las acciones
  `Continuar sesion` y `Cerrar sesion`.
- Si la sesion vence, se conserva una ruta interna con `pathname`, busqueda y hash;
  el login la restaura sin aceptar redirecciones externas.

## Validaciones y errores

Seguimiento ISS-08: la renovación distingue HTTP 401 (sesión inválida) de
errores de red, 403, 429, 5xx y respuestas malformadas (renovación no verificable).
Estos últimos conservan el token existente, no habilitan operaciones sin permiso
y ofrecen reintento en el diálogo. El vencimiento definitivo sigue vigente.
Las consultas y descargas propagan el error temporal sin emitir expiración.
`tests/sessionRefreshFailure.test.ts` ejecuta el cliente HTTP con fetch simulado.

- Los formularios validan usuario, email y contraseña antes de enviar.
- El perfil envía únicamente campos modificados y no llama al backend si no existen cambios.
- Los mensajes HTTP se obtienen mediante `getErrorMessage`, que solo consume contratos conocidos y utiliza mensajes accionables como fallback.
- Un fallo al consultar el estado de configuración nunca se interpreta como un sistema ya configurado ni habilita el registro.
- Un refetch conserva la última acción válida cuando existen datos en cache; solo un error inicial sin datos muestra el bloque de recuperación.
- El error de configuración ofrece reintento y contacto institucional con feedback accesible.
- Las contraseñas temporales tienen 16 caracteres, incluyen las clases requeridas y se generan con Web Crypto sin sesgo por módulo.

- Los borradores usan claves por usuario, modulo y registro. El sanitizador excluye
  claves de tokens, contrasenas, secretos, credenciales y autorizacion.
- Los cambios pendientes se escriben con debounce durante la edición y se fuerzan
  al abandonar o desmontar el formulario para no perder los últimos campos.
- Cuando existe un borrador previo, un diálogo modal inhabilita el resto de la
  pantalla hasta que el usuario decida recuperarlo o descartarlo.

## Verificación

Desde `frontend/`:

```text
npm test
npm run typecheck
npm run build:production
```

`tests/landingAccessState.test.ts` cubre la precedencia de sesión, carga inicial,
errores, primer administrador, login y conservación de datos durante refetch.

## Indicadores de campos obligatorios (ISS-21)

En Mi perfil, nombre de usuario y correo muestran el indicador de campo obligatorio durante la edicion. Login, registro y cambio de contrasena ya lo mostraban.

## Validaciones de formularios (ISS-19)

Registro y cambio de contraseña validan sus campos antes de enviar, conservan los valores y enfocan el primer control inválido. Las validaciones del servidor usan `error.details.fields`; los errores sin campo concreto se anuncian como aviso general. El envío permanece bloqueado mientras se procesa la solicitud.

Usuarios aplica el mismo foco local, bloquea un segundo envío y anuncia los errores generales con `role="alert"`. Si todos los errores del backend tienen control conocido, solo se muestran junto a los campos.
