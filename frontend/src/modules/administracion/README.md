# Modulo frontend de administracion

## Alcance actual

`AdministracionHome` concentra la experiencia del rol `ADMIN` sin modificar los
roles, permisos ni contratos existentes. La vista reutiliza las consultas de
usuarios, UCT y directivos para presentar conteos y pendientes accionables.

## Navegacion y permisos

- ruta: `/administracion`
- permiso frontend: solo `ADMIN`
- autoridad final: los endpoints backend conservan sus controles actuales
- el menu del administrador presenta una unica entrada `Administracion`
- `GESTOR` conserva su acceso directo a catalogos

## Secciones

- resumen de usuarios y autoridades
- alertas por UCT, autoridades y primeros accesos pendientes
- accesos a usuarios, alta de usuario, organizacion y catalogos
- aviso de alcance futuro para el resumen administrativo agregado

## Estado futuro

Queda fuera de esta etapa la creacion de un modulo backend
`/api/v1/administracion/resumen`. Antes de incorporarlo se deben revisar
contratos, consultas agregadas, auditoria, observabilidad y datos que puedan
considerarse sensibles.
