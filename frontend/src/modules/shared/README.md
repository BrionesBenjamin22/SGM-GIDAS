# Borradores de formularios

`useFormDraft` coordina carga, guardado automático, descarte y confirmación de
navegación. `formDraftService` consume los endpoints `/api/v1/borradores` sin usar
almacenamiento del navegador para el contenido. El perfil muestra la lista del
usuario y un aviso mientras haya al menos un borrador activo.
La lista permite abrir cada borrador o descartarlo con una confirmación. Tras
descartarlo, el contador se actualiza y se vuelve a consultar el servidor.
Para Personal, Becario e Investigador, cada entrada muestra el nombre ingresado
en el borrador; el ID queda como referencia secundaria. Si aún no hay un nombre
válido, muestra el tipo de registro y el ID.

Los formularios admitidos pasan un objeto de valores serializable y una función
`onRestore` que reconstruye su estado controlado. Una salida con cambios ofrece
guardar el borrador, descartarlo o seguir editando. El guardado definitivo elimina
el borrador. El estado visible distingue guardando, guardado y fallo.

El payload lleva `__draft_meta.schema=1` y una huella de los valores originales.
Al recuperar una edición, si esos valores difieren de los actuales, el diálogo
avisa que el registro cambió para que se revisen los datos antes de guardar.
La huella detecta cambios de interfaz; no es una firma de seguridad.

Los formularios de contraseñas y credenciales quedan excluidos. El backend
revalida módulo, tamaño y claves sensibles, y mantiene el aislamiento por usuario.
La versión recuperable después de perder la sesión es la última confirmada por el
servidor; cambios aún pendientes de envío pueden perderse.
