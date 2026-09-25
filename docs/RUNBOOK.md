# Operación de la primera entrega

## Variables

| Variable | Uso |
| --- | --- |
| `APP_BASE_URL` | Origen HTTPS final para canonical/metadata; local: `http://127.0.0.1:3000`. Si no se define, usa `VERCEL_URL` y después localhost. |
| `CATALOG_SOURCE` | `supabase` para datos reales; `seed` solo en desarrollo/CI o una demo explícita. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publishable; RLS protege los datos. No introducir una clave secreta. |
| `SITE_INDEXABLE` | `false` por defecto. `true` solo para el dominio final preparado para indexación. Las previews de Vercel siempre son noindex. |

Los flags de integraciones se inicializan como `false` en `system_settings`. Todavía no hay workers, scripts de publicidad ni proveedores de IA: cambiar un flag no implementa el servicio. No guardes secretos en esa tabla. Los eventos `claro:tool-event` son un punto de integración local, sin envío a un proveedor de analítica.

## Desplegar en Vercel

1. Autoriza el conector o la integración GitHub para el equipo que aloja el proyecto.
2. Importa `chaplicationsApps/Project-automatic-Adsence`, preset Next.js, directorio raíz del repositorio y Node.js 24.
3. Configura las variables anteriores antes del build. Preview: `SITE_INDEXABLE=false`. Producción: también `false` hasta completar contenido legal y dominio.
4. Despliega la rama revisada. Para una preview con Supabase, usa la misma URL/clave publishable; las páginas públicas siempre consultan como anónimo.
5. Comprueba `/api/health`, las tres herramientas, copia, búsqueda y `/admin` sin sesión. Verifica `noindex` en preview y ausencia de scripts de anuncios.
6. Prepara una cuenta administrativa según `ADMIN_SETUP.md` y comprueba login/logout con esa cuenta. No habilites registro público.

Las variables `NEXT_PUBLIC_*` se incorporan durante el build: genera otro despliegue después de cambiarlas. Un healthcheck correcto solo verifica que responde la aplicación; no garantiza acceso a la base. Para comprobar la integración abre el catálogo y una herramienta.

### Despliegue verificado — 25 de septiembre de 2026

- URL pública: <https://project-automatic-adsence.vercel.app>.
- Proyecto Vercel: `project-automatic-adsence`, equipo `jchamorrorodriguez-8538`.
- Despliegue: `dpl_4j1NqG5eBUPpU4N9xi3ovqPGAaAf`, producción, estado `READY`, código de `47afdf4` (PR #1 integrado).
- Catálogo real de Supabase operativo; indexación y servicios opcionales desactivados.
- Verificación: 14 pruebas E2E aprobadas contra producción (escritorio y móvil), canonical y `noindex` comprobados en navegador y sin logs de error del despliegue durante la comprobación. No equivale a monitorización continua ni a una prueba de carga.
- Se desplegó mediante el conector, enviando un `.env.production` exclusivo del despliegue con la URL/clave **publishable** y las opciones públicas de la aplicación. No se incluyeron claves privadas ni se guardó este archivo en Git. El intento anterior con `env` dentro de un `vercel.json` enviado como archivo no proporcionó las variables a la compilación.

Después de verificar esa entrega, se guardaron las cinco variables de la tabla en los ajustes de Vercel para **Production y Preview** y se conectó `chaplicationsApps/Project-automatic-Adsence`. La rama de producción es `main` y la asignación automática del dominio está activada. Los próximos despliegues Git usarán las variables del proyecto; no necesitan un archivo de entorno en el repositorio. El primer merge posterior a esta conexión debe comprobarse en Deployments. El acceso con una cuenta administradora real sigue pendiente.

### Repetir las pruebas sobre una URL publicada

Las mismas pruebas de navegación, cálculo, copia y protección administrativa se pueden ejecutar contra un despliegue accesible, sin arrancar el servidor local. En PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://project-automatic-adsence.vercel.app'
npm run test:e2e
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

Sin `PLAYWRIGHT_BASE_URL` se conserva la ejecución local habitual. Estas pruebas no escriben en la base de datos ni inician sesión como administrador; el login/logout con una cuenta real sigue siendo una comprobación aparte.

## Datos y migraciones

Mantén el mismo historial de migraciones en local y remoto. Aplica DDL con Supabase CLI o `apply_migration`; usa SQL para datos. Antes de aplicar una migración a una base con datos reales revisa su efecto y respaldo.

El seed es idempotente por slug. Si una herramienta existe, se conserva íntegra; regenerar el SQL no publica una nueva versión. Un cambio editorial posterior debe crear una versión nueva, validar el JSON y mover `current_version` con su auditoría en una transacción. Esa operación del panel pertenece a Fase 2.

## Diagnóstico

- **Catálogo no disponible:** revisa variables, acceso Supabase y los códigos `catalog.read_failed` / `catalog.versions_failed` del servidor. No hay fallback silencioso al seed.
- **Definición inválida:** revisa el JSON y la coincidencia de slug, categoría, versión y estado entre definición y versión publicada. No se ejecuta contenido no validado.
- **Sin acceso al panel:** confirma sesión y `app_metadata.role`. `user_metadata` no concede acceso. Tras cambiar permisos, renueva/revoca sesiones según `ADMIN_SETUP.md`.
- **Vercel 403 para un equipo:** reautoriza el conector para ese equipo. Una respuesta de cero proyectos en el ámbito personal no demuestra acceso al equipo.
- **Fallo TLS local de Node en Windows con un certificado corporativo:** configura la cadena de confianza del sistema; `NODE_OPTIONS=--use-system-ca` permite a Node 24 usarla. No deshabilites la validación TLS.

## Revertir

En Vercel vuelve al despliegue anterior verificado. La primera entrega no aplica migraciones automáticamente al desplegar; revertir la app no revierte la base. Mantén las migraciones aplicadas y corrige hacia delante con otra migración compatible. No borres versiones ni auditorías como parte de una reversión.
