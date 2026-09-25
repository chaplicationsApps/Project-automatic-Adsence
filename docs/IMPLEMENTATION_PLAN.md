# Plan de implementación — primer hito

## Alcance autorizado

Fases 0–1 del PRD: base Next.js/TypeScript, Supabase y administración autenticada, CI, flags desactivados, landing y catálogo, esquema declarativo versionado, motor de fórmulas seguro y tres herramientas seed. Verificar lint, tipos, unitarias, build y navegación E2E. Las fases posteriores conservan interfaces, sin activar generación IA, publicidad, vídeo o publicación social.

## Estado inicial

- Repositorio sin aplicación; PRD y auditoría locales sin seguimiento.
- Supabase accesible y vacío en el esquema público.
- Vercel devuelve una lista vacía de equipos; vinculación pendiente de identificar la cuenta/equipo.
- Codex Security ya aparece entre las skills disponibles tras la auditoría.

## Arquitectura de la primera entrega

Una aplicación Next.js con módulos internos, evitando monorepo prematuro:

- `src/lib/tools`: esquema Zod, parser restringido, evaluador, catálogo seed y pruebas independientes.
- `src/components`: renderer declarativo, catálogo, controles y layout compartidos.
- `src/app`: home, catálogo, categoría, herramientas, legales provisionales y admin.
- `src/lib/supabase`: clientes SSR, acceso público y autorización administrativa.
- `supabase/migrations`: categorías, herramientas/versiones, configuración, auditoría y estructura de jobs, con RLS.
- `tests/e2e`: cálculo, búsqueda, responsive, SEO, protección administrativa.
- `.github/workflows`: install reproducible, lint, tipos, unitarias, build y E2E.

Las páginas públicas leen solo versiones publicadas. El desarrollo local puede usar el catálogo seed mediante un modo explícito; una base conectada vacía o caída no debe sustituirse silenciosamente por datos demo. Las operaciones administrativas deben comprobar el rol real, además de autenticación.

## Orden de trabajo

1. Fijar dependencias y contratos; construir en paralelo motor, interfaz y capa de datos/auth.
2. Integrar clientes Supabase, aplicar migración versionada al proyecto vacío y validar RLS.
3. Conectar las tres definiciones y comprobar resultados, metadata y errores.
4. Ejecutar verificaciones automáticas y revisar el navegador en móvil/escritorio.
5. Preparar Git/CI y preview; desplegar cuando el acceso Vercel sea verificable.
6. Documentar resultados reales y pasos restantes sin presentar servicios no verificados como operativos.

## Controles

- Fórmulas sin `eval`, `new Function`, acceso a propiedades ni módulos remotos; límites de tamaño/profundidad y resultados finitos.
- Datos de calculadoras procesados en cliente; no registrar sus valores.
- Rol admin basado en una asignación controlada en servidor; nunca en metadata editable por el usuario.
- Claves privadas fuera del repositorio y del navegador; todos los servicios externos opcionales desactivados.
- Anuncios y textos legales no se consideran preparados para producción hasta la configuración/revisión del titular.

## Estado verificado — 25 de septiembre de 2026

- Aplicación Next.js 16.3.6 con catálogo, búsqueda, categorías, páginas de herramientas, legales provisionales y panel de consulta autenticado.
- Motor declarativo con 129 pruebas y autorización/configuración con otras 6: 135 aprobadas. ESLint, TypeScript y build de producción aprobados.
- 14 pruebas Playwright aprobadas contra el catálogo real de Supabase, en Chromium escritorio y móvil. No son una prueba de carga: se ejecutan con dos workers; una primera ejecución con once saturó el entorno y agotó tiempos de espera.
- Supabase: migraciones `20260924161445_bootstrap` y `20260925052424_tighten_function_grants_and_read_policies` aplicadas. Tres herramientas, tres versiones y tres entradas de auditoría. Seed repetido sin duplicados.
- Permisos comprobados con fixtures transaccionales y rollback para anónimo, usuario normal y admin. Avisos de seguridad de Supabase: cero tras restringir la función de event trigger preexistente. Trigger de habilitación RLS conservado.
- Indexación global desactivada; las herramientas también respetan `is_indexable`. Sin publicidad, IA, publicación web/social ni workers activos.
- Vercel reconoce el equipo tras reautorizar el conector. La preview y GitHub se preparan después de estas comprobaciones.

No se ha probado el login con una cuenta administradora real: todavía debe provisionarse en Supabase Auth. La autenticación sí cuenta con pruebas unitarias y comprobación de la redirección de acceso anónimo. CRUD, aprobación y publicación editorial corresponden a la siguiente fase.
