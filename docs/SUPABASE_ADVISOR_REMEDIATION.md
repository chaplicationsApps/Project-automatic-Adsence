# Ajuste de permisos y políticas iniciales

Migración aplicada: `supabase/migrations/20260925052424_tighten_function_grants_and_read_policies.sql`.

Comprobada el 25 de septiembre de 2026: `anon` y `authenticated` no tienen EXECUTE; el event trigger permanece activo (`O`); las pruebas transaccionales de RLS pasan y Supabase Security Advisors devuelve cero avisos.

## Inspección previa

Se consultaron únicamente los catálogos `pg_proc`, `pg_namespace`, `pg_event_trigger` y `pg_policies` del proyecto. La función preexistente `public.rls_auto_enable()` pertenece a `postgres`, devuelve `event_trigger`, es `SECURITY DEFINER` y fija `search_path=pg_catalog`. Su ACL concede ejecución a `PUBLIC`, `anon`, `authenticated`, `postgres` y `service_role`.

La función habilita RLS al crear tablas del esquema `public`. La invoca el event trigger `ensure_rls`, de `postgres`, habilitado (`O`) en `ddl_command_end` para `CREATE TABLE`, `CREATE TABLE AS` y `SELECT INTO`. No fue creada por la migración bootstrap del proyecto.

## Cambio preparado

Se revoca ejecución de esa firma exacta solamente para `PUBLIC`, `anon` y `authenticated`, si existe. No se modifica ni se elimina su función o event trigger; tampoco se cambian los permisos explícitos de `postgres` o `service_role`. El propietario conserva la función para su automatismo de DDL. El cambio reduce la exposición señalada por el advisor; la inspección no demuestra una explotación RPC, y una función de retorno `event_trigger` no es una función de negocio ordinaria.

Las tres tablas públicas tenían una política `SELECT` pública y otra administrativa `ALL`; esta última también se evaluaba en lecturas autenticadas. La migración conserva exactamente su unión lógica y separa `INSERT`, `UPDATE` y `DELETE` administrativas. Para herramientas y versiones deja una lectura `anon` pública y una lectura autenticada que combina admin o contenido publicado. Categorías conserva su única lectura pública existente. Todas las escrituras exigen `app_metadata.role = 'admin'`; `UPDATE` mantiene tanto `USING` como `WITH CHECK`.

No se crea ningún índice: el identificador de `tool_definitions` ya tiene el índice único de la clave primaria. No hay evidencia que justifique otro índice para la FK compuesta `(id, current_version)`.

## Verificación después de aplicar

1. Ejecutar de nuevo `supabase/tests/rls.sql` con rollback: anónimo, usuario normal, metadatos manipulables y admin deben conservar los mismos resultados.
2. Comprobar que estas dos columnas devuelven `false` y que `ensure_rls` sigue habilitado:

```sql
select
  has_function_privilege('anon', 'public.rls_auto_enable()', 'EXECUTE') as anon_execute,
  has_function_privilege('authenticated', 'public.rls_auto_enable()', 'EXECUTE') as authenticated_execute;

select evtname, evtevent, evtenabled, evtfoid::regprocedure, evttags
from pg_event_trigger
where evtname = 'ensure_rls';
```

3. Si se requiere comprobar también el disparo real, ejecutar solo en un entorno de desarrollo una transacción que cree una tabla vacía en `public`, consulte `pg_class.relrowsecurity` y haga rollback. No usar datos reales.
4. Volver a ejecutar advisors de seguridad y rendimiento. Deben desaparecer el permiso de ejecución pública de esta función y los avisos de múltiples políticas permisivas de estas tres tablas. Los avisos de índices no usados son esperables en una base recién creada y no justifican eliminarlos.

La preparación no aplica cambios remotos. La validación posterior a la aplicación debe registrarse por separado.

## Referencias

- [Supabase: múltiples políticas permisivas](https://supabase.com/docs/guides/observability/advisors?queryGroups=lint&lint=0006_multiple_permissive_policies)
- [PostgreSQL: REVOKE](https://www.postgresql.org/docs/current/sql-revoke.html)
- [PostgreSQL: event triggers](https://www.postgresql.org/docs/current/sql-createeventtrigger.html)
