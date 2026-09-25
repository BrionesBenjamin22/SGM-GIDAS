# Catalogos frontend

## Alcance

El modulo centraliza la consulta y administracion de valores reutilizados por
personal, proyectos, produccion, recursos y transferencia. `CatalogosHome` permite
seleccionar un tipo de catalogo y buscar sus valores. La tabla compacta muestra el
nombre vigente, estado, auditoria y acciones permitidas.

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

Tipo de revista se administra mediante `/tipos-revista/` y es independiente de
Tipo de reunión científica. Sus valores iniciales de testing son `Nacional` e
`Internacional`; el formulario de Trabajos en revistas consume el service y
hook dedicados del módulo Producción.

## Permisos y estados

Los roles `ADMIN` y `GESTOR` pueden crear, editar y eliminar valores. `LECTURA`
puede consultar catalogos e historiales, pero la interfaz no presenta acciones de
mutacion. El backend vuelve a validar el rol y constituye la autoridad final.

Cuando el contrato informa `activo` o `deleted_at`, la interfaz distingue activos e
inactivos y evita editar o volver a eliminar un valor dado de baja. La eliminacion
es logica cuando lo implementa el catalogo correspondiente.

## Validaciones y actualizaciones

- Los nombres se recortan y deben contener al menos una letra Unicode. Pueden
  incluir numeros y signos junto a texto descriptivo. La validacion se aplica en
  altas y al cambiar el nombre en edicion; los registros existentes no se migran.
- Las becas exigen seleccionar su fuente de financiamiento.
- Las descripciones se recortan antes de persistirse.
- En edicion se comparan nombre, descripcion y relacion; si no existen diferencias,
  no se llama al backend.
- Los errores de carga, dependencias, historial y mutaciones permanecen visibles y
  accionables.

## Paginacion e historial

El catalogo seleccionado muestra como maximo 9 valores por pagina. Cada fila ofrece
una accion `Historial`: al abrirla consulta `/:id/historial` y muestra hasta 3
eventos por pagina, incluyendo cambios de campos y eventos de sistema cuando el
backend los informa. La carga inicial no solicita todos los historiales.

Editar un nombre conserva el ID del valor y registra el cambio historico. La baja
logica se muestra como `Inactivo`; los valores disponibles se indican `Vigente`.
Las advertencias generales se retiraron de la pantalla. El manual de usuario queda
fuera de este issue por indicacion del usuario.

## Contratos relevantes

- Listado: `GET <endpoint>?activos=all`.
- Historial: `GET <endpoint>/:id/historial`.
- Alta: `POST <endpoint>` con el campo de nombre propio del catalogo.
- Edicion: `PUT <endpoint>/:id` solo con diferencias reales.
- Baja: `DELETE <endpoint>/:id`.

Las respuestas incluyen como minimo `id` y el campo de nombre. Pueden incorporar
`activo`, marcas de auditoria y relaciones tipadas, como `fuente_financiamiento` en
becas.

## Feedback de acciones (seguimiento ISS-09)

Las acciones asíncronas del módulo usan Button con loading/loadingText
o ConfirmDialog, que espera la promesa devuelta por onConfirm. Durante la
operación se muestra texto de progreso con un icono animado, aria-busy y
role=status. El botón de acción se deshabilita hasta terminar; las
confirmaciones bloquean además cancelar, el fondo y los campos del diálogo.
El estado se libera al resolver o fallar, conservando errores y mensajes de
éxito existentes. Los callbacks basados en React Query deben devolver
mutateAsync para que el diálogo cubra toda la operación.
CatalogPanel comparte un bloqueo entre alta, edición y eliminación.
Muestra Creando, Guardando o Eliminando según la acción.

## Indicadores de campos obligatorios (ISS-21)

En altas y ediciones, el nombre muestra el indicador obligatorio. La fuente de financiamiento se indica como obligatoria al crear una beca, conforme a la validacion del formulario.

## Paginación de listados (ISS-23)

Los resultados paginados muestran controles centrados de anterior, números
de página y siguiente, inmediatamente debajo de las tarjetas o resultados.
El máximo de resultados por página conserva el contrato del módulo.
