# Catalogos frontend

## Alcance

El modulo centraliza la consulta y administracion de valores reutilizados por
personal, proyectos, produccion, recursos y transferencia. `CatalogosHome` agrupa
los catalogos por dominio, permite buscarlos y presenta sus valores, estados,
auditoria e historial.

`ObjetosFinHome` conserva la vista combinada heredada de equipamientos y erogaciones;
los flujos principales de esas entidades se documentan en el modulo `recursos`.

## Services, tipos y hooks

- `catalogoServices.ts` expone las operaciones genericas de listado, historial,
  alta, actualizacion y baja logica.
- Los services especificos de categorias UTN, fuentes, procedencias y tipos ofrecen
  opciones tipadas a los formularios consumidores.
- Los hooks basados en React Query encapsulan carga, cache e invalidacion de las
  opciones compartidas por los modulos funcionales.

Los endpoints se reciben como definiciones internas constantes, no desde entradas
del usuario. Los cuerpos se serializan como JSON y los errores reconocidos se
procesan mediante el extractor seguro compartido.

## Permisos y estados

Los roles `ADMIN` y `GESTOR` pueden crear, editar y eliminar valores. `LECTURA`
puede consultar catalogos e historiales, pero la interfaz no presenta acciones de
mutacion. El backend vuelve a validar el rol y constituye la autoridad final.

Cuando el contrato informa `activo` o `deleted_at`, la interfaz distingue activos e
inactivos y evita editar o volver a eliminar un valor dado de baja. La eliminacion
es logica cuando lo implementa el catalogo correspondiente.

## Validaciones y actualizaciones

- Los nombres se recortan y no pueden quedar vacios.
- Las becas exigen seleccionar su fuente de financiamiento.
- Las descripciones se recortan antes de persistirse.
- En edicion se comparan nombre, descripcion y relacion; si no existen diferencias,
  no se llama al backend.
- Los errores de carga, dependencias, historial y mutaciones permanecen visibles y
  accionables.

## Paginacion e historial

Cada panel muestra como maximo 9 valores por pagina. El historial de cada valor se
consume desde `/:id/historial` y se pagina de a 3 eventos, incluyendo cambios de
campos y eventos de sistema cuando el backend los informa.

## Contratos relevantes

- Listado: `GET <endpoint>?activos=all`.
- Historial: `GET <endpoint>/:id/historial`.
- Alta: `POST <endpoint>` con el campo de nombre propio del catalogo.
- Edicion: `PUT <endpoint>/:id` solo con diferencias reales.
- Baja: `DELETE <endpoint>/:id`.

Las respuestas incluyen como minimo `id` y el campo de nombre. Pueden incorporar
`activo`, marcas de auditoria y relaciones tipadas, como `fuente_financiamiento` en
becas.
