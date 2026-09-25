# Claro · Fábrica de microherramientas

Primera entrega de las Fases 0–1 del PRD: catálogo público, motor declarativo seguro y administración autenticada. Incluye calculadora de porcentajes, días entre fechas y conversor de longitud. El nombre Claro es provisional.

## Desarrollo

Requiere Node.js 24.13 o posterior dentro de la rama 24 y npm.

```sh
npm ci
```

Copia `.env.example` a `.env.local`. El modo `CATALOG_SOURCE=seed` permite trabajar sin servicios externos. Para leer la base real usa `CATALOG_SOURCE=supabase`, la URL de Supabase y su clave publishable. No uses claves secretas ni `service_role` en la aplicación.

```sh
npm run dev
```

Abre <http://127.0.0.1:3000>. El panel está en `/admin`; requiere una cuenta con `app_metadata.role=admin`. Consulta [ADMIN_SETUP.md](docs/ADMIN_SETUP.md) para prepararla.

## Verificación

```sh
npm run check
npx playwright install chromium
npm run test:e2e
```

`check` ejecuta ESLint, TypeScript, Vitest y el build de producción. Playwright inicia el build con el catálogo seed y prueba escritorio y móvil. El workflow de GitHub Actions repite estas comprobaciones en cada PR y push a `main` o `codex/**`.

Las pruebas SQL de permisos están en `supabase/tests/rls.sql`. Ejecútalas en una base de desarrollo migrada: todos los datos de prueba se revierten en una transacción. Las pruebas de navegador no necesitan cuentas ni contraseñas reales.

## Base de datos y despliegue

Las migraciones versionadas están en `supabase/migrations/`. `npm run db:seed:sql` genera `supabase/seed.sql` a partir de las definiciones validadas. El seed inserta las herramientas que faltan y nunca sobrescribe versiones existentes.

Vercel utiliza el preset Next.js, la raíz del repositorio y Node.js 24. Las variables y el procedimiento de comprobación están en [RUNBOOK.md](docs/RUNBOOK.md). Mantén `SITE_INDEXABLE=false` hasta disponer del dominio y contenido legal definitivos.

## Qué incluye

- Home, búsqueda, categorías, páginas de herramientas, SEO y sitemap filtrado por publicación/indexación.
- Fórmulas interpretadas con gramática restringida, sin ejecutar JavaScript. Los cálculos se realizan en el dispositivo.
- Supabase con RLS, versiones de herramientas, ajustes, estructura de jobs y auditoría.
- Inicio/cierre de sesión administrativo y panel de consulta. Las claves privadas no intervienen en las lecturas públicas.
- Eventos locales de interacción sin almacenar ni transmitir los valores de las calculadoras.

El CRUD editorial, la aprobación/publicación desde el panel, los workers de jobs, IA, AdSense, originalidad y publicación social corresponden a fases posteriores. Sus flags permanecen desactivados. Las páginas legales actuales identifican expresamente su estado provisional; no habilitan monetización.

## Documentación

- [PRD](PRD/PRD_Fabrica_Microherramientas_Astra6.md)
- [Plan y estado de la entrega](docs/IMPLEMENTATION_PLAN.md)
- [Auditoría de herramientas de automatización](docs/AUTOMATION_AUDIT.md)
- [Contrato y autoría de herramientas](docs/TOOL_AUTHORING.md)
- [Administración](docs/ADMIN_SETUP.md)
- [Operación y despliegue](docs/RUNBOOK.md)
