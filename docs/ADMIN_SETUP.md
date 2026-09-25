# Preparación de administración

El panel de `/admin` consulta herramientas y opciones reales de Supabase. La creación, edición y aprobación de herramientas pertenecen a la Fase 2; aún no están disponibles. Sin configuración válida el acceso se mantiene cerrado.

## Proyecto y variables

1. Aplica la migración inicial de `supabase/migrations/` al proyecto elegido y después el seed.
2. Configura en el entorno local y en Vercel `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con la URL y la clave **publishable** del proyecto. La aplicación valida el prefijo `sb_publishable_` y nunca necesita una clave secreta o `service_role` para el panel.
3. Reinicia el servidor local o genera un nuevo despliegue para recoger cambios de las variables públicas.
4. En Supabase Auth, habilita el acceso por correo y contraseña y deshabilita el registro público. Configura Site URL y las URLs de redirección autorizadas para el dominio real y el desarrollo local.

No pegues claves, contraseñas ni tokens en el repositorio, documentación o conversación. La clave publishable identifica el proyecto; RLS y el rol autenticado protegen los datos.

## Cuenta administradora

Un operador autorizado debe crear la cuenta en Supabase Auth, verificar su correo y establecer una contraseña segura mediante el flujo del proveedor. Esta entrega no crea cuentas ni inventa direcciones.

Desde una operación administrativa del proveedor, establece `app_metadata.role = "admin"` para el identificador de esa cuenta, conservando cualquier otro metadato existente. Nunca uses `user_metadata.role`: el usuario puede modificarlo. El panel no incluye registro público ni una operación para asignarse permisos.

Tras cambiar un rol, cierra sesión y vuelve a entrar para renovar el JWT. Los cambios de `app_metadata` no modifican los JWT ya emitidos: al retirar permisos, revoca las sesiones y considera el tiempo de expiración de los tokens existentes para el acceso directo a la Data API. El panel comprueba el usuario actual contra Auth mediante `getUser()` en cada acceso, además de RLS.

## Comprobación

- Sin las variables, `/admin/login` muestra el estado de preparación y no presenta un formulario de acceso.
- Sin sesión, `/admin` redirige a `/admin/login`.
- Una cuenta normal, incluso con `user_metadata.role = "admin"`, no accede a las herramientas privadas ni al panel.
- La cuenta administradora accede al catálogo de la base de datos y a sus opciones. Los errores de conexión se muestran como errores; no se sustituyen por cifras de ejemplo.
- Tras cerrar sesión, `/admin` vuelve a pedir acceso.
- Todas las rutas `/admin/*` tienen `noindex` y `Cache-Control: private, no-store`; el proxy conserva cookies y cabeceras de renovación. No añadas ISR ni caché CDN a estas rutas.

Para probar RLS, usa únicamente una base local o desechable ya migrada:

```sh
psql -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql "$LOCAL_DATABASE_URL"
```

La prueba inserta fixtures, simula roles `anon`, usuario normal y administrador, verifica que un rol manipulable no concede permisos, y revierte toda la transacción. No crea usuarios reales. No ejecutes estos fixtures en producción.

## Contrato de publicación

`categories.slug` es la clave textual de la categoría. `tool_definitions.category_slug` la referencia. `tool_versions` contiene JSON por `(tool_id, version)`. `tool_definitions.current_version` selecciona una versión de la misma herramienta mediante una FK compuesta.

El público solo puede leer definiciones con `status = 'published'` y el JSON de la versión seleccionada. Versiones históricas, nuevas versiones todavía privadas, borradores, jobs, opciones y auditoría quedan protegidos. Los clientes públicos no heredan cookies de administrador. El seed debe insertar la herramienta y su versión en la misma transacción, o insertar primero como borrador, añadir versión y luego publicar.

La auditoría es de solo lectura e inserción para administradores; no permite modificar o borrar entradas. Las futuras operaciones de publicación deberán registrar su cambio y auditoría en una misma transacción. Los valores de `system_settings` son configuración, nunca secretos. Las integraciones y automatizaciones aún no están implementadas y sus flags empiezan desactivados.

## Referencias

- [Supabase: SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase: sesiones y caché](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [Supabase: RLS y metadatos](https://supabase.com/docs/guides/database/postgres/row-level-security)
