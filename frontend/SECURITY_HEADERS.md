# Security headers del frontend

El frontend productivo y el proxy principal aplican una CSP basada en recursos del
mismo origen. Scripts, fuentes y conexiones se limitan a `'self'`; imagenes admiten
ademas `data:` y `blob:` para previsualizaciones y descargas locales.

`style-src` conserva `'unsafe-inline'` porque los componentes React generan estilos
inline. La excepcion no se extiende a scripts y `unsafe-eval` no esta permitido.

La politica debe validarse luego de cada cambio de dependencias o integracion
externa. No se debe ampliar con comodines; cualquier nuevo origen debe documentarse
y limitarse a la directiva que realmente lo necesita.
