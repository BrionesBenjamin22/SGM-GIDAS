# Gestion de secretos

El backend admite cada secreto sensible mediante una variable directa o mediante
un archivo montado:

| Variable directa | Variable de archivo |
| --- | --- |
| `SECRET_KEY` | `SECRET_KEY_FILE` |
| `JWT_SECRET` | `JWT_SECRET_FILE` |
| `REFRESH_SECRET` | `REFRESH_SECRET_FILE` |

Si existe un valor directo no vacio, se mantiene por compatibilidad. Para usar un
archivo, se debe omitir el valor directo y montar el archivo como solo lectura. Un
archivo ausente o vacio provoca un fallo de arranque seguro.

En produccion los tres valores deben ser diferentes, no usar placeholders y poseer
al menos 32 caracteres. Los archivos reales no deben copiarse a la imagen ni al
repositorio.

## Override Compose de referencia

La ruta y el mecanismo de montaje dependen del host o secret manager. Un override
privado puede montar los archivos bajo `/run/secrets/` y definir las variables
`*_FILE` en `backend` y, si carga la aplicacion, en `migrate`. Ese override y los
archivos reales deben permanecer fuera de Git.

## Rotacion

- rotar `SECRET_KEY` invalida sesiones firmadas por Flask;
- rotar `JWT_SECRET` invalida access tokens vigentes;
- rotar `REFRESH_SECRET` invalida refresh tokens vigentes y requiere limpiar o
  revocar sus sesiones persistidas;
- probar primero en preproduccion y conservar un rollback controlado;
- no registrar valores en comandos, logs, tickets ni documentacion.

## Mejora introducida

Los secretos pueden inyectarse sin quedar incluidos en variables renderizadas de
Compose o inspeccion del contenedor. La validacion de independencia evita que la
compromision de una clave afecte simultaneamente sesiones Flask, access tokens y
refresh tokens.

## Escaneo versionable

Ejecutar desde la raiz:

```text
python backend/tools/scan_tracked_secrets.py
```

El control revisa archivos tracked y archivos nuevos no ignorados. No lee `.env`
ignorados, no imprime valores detectados y debe integrarse al proveedor CI elegido.
Es una barrera basica de alta señal y no reemplaza un scanner especializado ni la
rotacion inmediata ante una exposicion.
