# Autenticación y usuarios en backend

## Responsabilidades

El módulo concentra rutas, controladores, servicios y modelos de identidad. Gestiona usuarios, roles, contraseñas, access tokens de corta duración, sesiones de refresh revocables y el alta controlada del primer administrador.

## Endpoints

Todos los endpoints se publican bajo `/auth`.

| Método | Ruta | Acceso | Uso |
| --- | --- | --- | --- |
| GET | `/primer-usuario` | Público, limitado | Indica si existe un usuario inicial. |
| POST | `/register` | Primer alta o ADMIN | Crea el administrador inicial bajo las reglas del servicio. |
| POST | `/login` | Público, limitado | Valida credenciales y entrega access token más cookie de refresh. |
| GET | `/perfil` | Autenticado | Obtiene la identidad de la sesión. |
| POST | `/refresh` | Cookie y origen confiable | Rota la sesión de refresh y entrega un access token nuevo. |
| POST | `/logout` | Cookie y origen confiable | Revoca la sesión y elimina la cookie. |
| POST | `/cambiar-password` | Autenticado, limitado | Cambia la contraseña y finaliza el primer login. |
| GET/POST | `/usuarios` | ADMIN | Lista o crea usuarios. |
| GET/PUT | `/usuarios/<id>` | Propietario o ADMIN según operación | Consulta o actualiza datos permitidos. |
| DELETE | `/usuarios/<id>` | ADMIN | Aplica la regla de eliminación definida por el servicio. |

## Controles de seguridad

- La autorización se valida en controller/service; no depende del frontend.
- Las credenciales se validan y almacenan mediante hash, nunca en texto plano.
- La cookie de refresh usa las opciones seguras configuradas por entorno y las operaciones con cookie validan origen.
- Las respuestas de autenticación se marcan `no-store`.
- Login, registro y cambio de contraseña poseen limitación de frecuencia.
- Las sesiones de refresh se registran, rotan y revocan para conservar trazabilidad.
- Los errores inesperados devuelven mensajes genéricos y no exponen detalles internos.

## Despliegue

En servidores se deben definir secretos y orígenes permitidos mediante variables de entorno, habilitar cookies seguras detrás de HTTPS y conservar la misma topología de proxy para frontend y API. No se deben usar valores de desarrollo en producción.

## Verificación

Desde `backend/`, ejecutar las pruebas de middleware, expiración, cookies y rotación de refresh incluidas en `tests/test_auth_*.py`. Antes del despliegue también se debe ejecutar la suite completa con la base de datos del entorno de pruebas.
