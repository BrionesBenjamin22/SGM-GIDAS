# Security headers del backend

Todas las respuestas de la API, incluidos errores, incorporan CSP restrictiva,
proteccion de MIME, politica de frames, referrer y permissions policy. Las
respuestas usan `Cache-Control: private, no-store` para evitar almacenamiento de
datos autenticados o sensibles.

La CSP del backend usa `default-src 'none'` porque la API entrega datos y no debe
ejecutar recursos web. No contiene `unsafe-inline` ni `unsafe-eval`.

## HSTS

HSTS permanece desactivado hasta validar HTTPS extremo a extremo. Solo se emite si:

- `HSTS_ENABLED=True`;
- Flask reconoce la solicitud como HTTPS mediante el proxy confiable;
- `HSTS_MAX_AGE` se encuentra entre 0 y 63072000 segundos.

Antes de activarlo deben comprobarse certificado, hostname, cadena y disponibilidad
HTTPS. Luego se debe recrear el backend y verificar que HTTP no entregue HSTS y que
HTTPS entregue el valor configurado.
