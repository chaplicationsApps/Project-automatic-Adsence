# Crear una herramienta declarativa

El motor convierte una definición JSON validada en campos, cálculos y resultados. Su contrato actual está en `src/lib/tools/schema.ts`; las tres herramientas iniciales están en `src/lib/tools/seeds.ts`. Esta guía describe la implementación de las fases 0–1, no todas las capacidades previstas en el PRD.

## Ejemplo mínimo completo

Este JSON es válido para el esquema `1.0`. Define un borrador que calcula el doble de una cantidad. El estado `draft` permite validarlo, pero no lo incorpora al catálogo público.

```json
{
  "schemaVersion": "1.0",
  "version": 1,
  "slug": "calcular-doble",
  "title": "Calculadora del doble",
  "shortDescription": "Multiplica una cantidad por dos.",
  "category": "matematicas",
  "status": "draft",
  "inputs": [
    {
      "id": "amount",
      "type": "number",
      "label": "Cantidad",
      "required": true,
      "defaultValue": "15",
      "min": 0,
      "max": 1000000
    }
  ],
  "outputs": [
    {
      "id": "result",
      "label": "El doble",
      "formula": "amount * 2",
      "decimals": 2
    }
  ],
  "content": {
    "intro": "Introduce una cantidad para obtener su doble.",
    "methodology": "Multiplicamos la cantidad por dos, sin redondear los pasos intermedios.",
    "examples": [
      {
        "title": "El doble de 15",
        "description": "15 × 2 = 30."
      }
    ],
    "faq": [
      {
        "question": "¿Admite decimales?",
        "answer": "Sí. Por ejemplo, el doble de 1,5 es 3."
      }
    ],
    "sources": [],
    "limitations": [
      "Este ejemplo admite cantidades entre cero y un millón."
    ]
  },
  "seo": {
    "title": "Calculadora del doble",
    "description": "Calcula el doble de una cantidad con un ejemplo y una explicación."
  },
  "relatedTools": []
}
```

El esquema es estricto, incluidos los objetos anidados: rechaza campos desconocidos. No añadas propiedades del ejemplo conceptual del PRD que todavía no están implementadas, como `calculation`, `locale`, `monetization` o `social`.

## Identidad y contenido

- `schemaVersion` debe ser exactamente `"1.0"`. `version` es un entero entre 1 y 1 000 000.
- `slug` y `category` usan letras ASCII minúsculas, números y guiones entre segmentos, con un máximo de 100 caracteres. La categoría debe existir al persistirla en la base de datos; el esquema JSON solo comprueba su formato.
- Los estados admitidos son `draft`, `review`, `published` y `archived`. El esquema no ejecuta transiciones de estado ni publica contenido.
- Los identificadores de entradas y salidas tienen entre 1 y 48 caracteres: empiezan por una letra ASCII y continúan con letras, números o `_`. Distinguen mayúsculas de minúsculas. No se pueden repetir ni compartir entre una entrada y una salida.
- No uses nombres de funciones del motor ni estos nombres reservados: `constructor`, `prototype`, `__proto__`, `globalThis`, `window`, `document`, `process`, `require`, `import`, `eval`, `Function`.
- `relatedTools` admite hasta ocho slugs distintos y no puede incluir el de la propia herramienta. El esquema no comprueba que esos slugs existan; revisa los enlaces del catálogo.
- `content` requiere introducción, metodología, al menos un ejemplo, una pregunta frecuente y una limitación. `sources` puede estar vacío; cuando haya fuentes, cada una necesita `label` y una URL HTTPS válida. Redacta contenido útil y añade las fuentes que sustenten sus afirmaciones.

| Campo | Máximo |
| --- | ---: |
| `title` / `shortDescription` | 120 / 240 caracteres |
| `seo.title` / `seo.description` | 70 / 180 caracteres |
| `content.intro` / `content.methodology` | 4000 caracteres cada uno |
| Ejemplos | 10; título de 160 y descripción de 1000 caracteres |
| Preguntas frecuentes | 12; pregunta de 200 y respuesta de 2000 caracteres |
| Fuentes | 12; etiqueta de 200 y URL de 2048 caracteres |
| Limitaciones | 10, de 1000 caracteres cada una |

## Entradas

Se admiten entre 1 y 32 entradas. Todas necesitan `id`, `type`, `label` y `required`. Pueden incluir `helpText`, `placeholder`, `defaultValue` y `unit`. Los límites de longitud son 100 caracteres para la etiqueta y el placeholder, 300 para la ayuda, 64 para el valor predeterminado y 30 para la unidad.

`calculateTool` recibe los valores como `Record<string, string>`. Por ejemplo, `{ amount: "15" }`, no `{ amount: 15 }`.

| Tipo | Valor recibido | Valor utilizado por las fórmulas |
| --- | --- | --- |
| `number` | Número decimal como texto | Número finito |
| `integer` | Número entero como texto | Número entero |
| `date` | Fecha estricta `AAAA-MM-DD` | Número entero de días UTC desde el 1 de enero de 1970 |
| `select` | El `value` de una opción | El `numericValue` registrado en esa opción |

Los números admiten punto o coma decimal y notación científica. No admiten separadores de miles, hexadecimal, `NaN` ni `Infinity`. Su valor absoluto no puede superar `10^15`; `min` y `max` pueden restringirlo más. Por ejemplo, `1,000` significa uno con tres posiciones decimales, no mil. Escribe `1000` para mil.

En `number` e `integer`, `min`, `max` y `step` son opcionales. `step` debe ser positivo y, para enteros, también entero. **El motor valida el rango y la condición de entero, pero no comprueba que el valor sea múltiplo de `step`**; actualmente es un dato para el control de entrada. No lo uses como garantía de una regla de negocio.

`defaultValue` siempre es texto y debe ser válido para su entrada. En una entrada obligatoria, el evaluador rechaza un valor ausente o vacío aunque exista un predeterminado; el formulario puede usarlo para rellenarse inicialmente. Una entrada opcional debe declarar un predeterminado: el evaluador lo usa cuando recibe un valor ausente o vacío. Se eliminan espacios exteriores de los valores recibidos.

Una selección define entre 1 y 32 opciones, con valores únicos:

```json
{
  "id": "fromUnit",
  "type": "select",
  "label": "Unidad de origen",
  "required": true,
  "defaultValue": "km",
  "options": [
    { "value": "km", "label": "Kilómetros", "numericValue": 1000 },
    { "value": "m", "label": "Metros", "numericValue": 1 }
  ]
}
```

Al recibir `"km"`, la variable `fromUnit` vale `1000`. El usuario no puede proporcionar un factor arbitrario: se rechaza cualquier opción no registrada. La etiqueta de cada opción tiene un máximo de 100 caracteres y su `value`, de 40. `numericValue` debe ser finito y estar entre `-10^15` y `10^15`.

### Fechas y UTC

Se admiten fechas reales del calendario gregoriano entre `0001-01-01` y `9999-12-31`. Se rechazan fechas inexistentes, como `2025-02-29`, y formatos que incluyan horas o zonas horarias.

Para contar días de separación utiliza `abs(endDate - startDate)`. El resultado es absoluto, no incluye el día inicial y no cambia con el horario de verano. Entre el 28 de febrero y el 1 de marzo de 2024 hay dos días. Entre una fecha y ella misma hay cero. No se descuentan festivos ni fines de semana. El motor no incorpora funciones adicionales de calendario.

## Fórmulas y salidas

Se admiten entre 1 y 12 salidas, cada una con `id`, `label`, `formula` y `decimals`; `unit` y `description` son opcionales. La etiqueta admite 100 caracteres, la unidad 30 y la descripción 300.

Una fórmula solo puede referirse a los identificadores de las entradas de su definición. No puede leer otra salida, aunque esta aparezca antes en el array. Repite la expresión necesaria en cada salida. Todas las variables deben existir, incluso las que aparecen en una rama que no se ejecutará.

| Operadores | Semántica |
| --- | --- |
| `+`, `-`, `*`, `/` | Aritmética; `+` y `-` también pueden ser unarios |
| `%` | Resto de división; no es un operador de porcentaje |
| `^` | Potencia, asociativa a la derecha |
| `<`, `>`, `<=`, `>=`, `==`, `!=` | Comparaciones numéricas: devuelven 1 o 0 |
| `(`, `)` | Agrupación |

La precedencia es: potencia, signo unario, multiplicación/división/resto, suma/resta y comparaciones. Así, `2 ^ 3 ^ 2` vale 512 y `-2 ^ 2` vale -4. Usa paréntesis para hacer explícita la intención.

| Función | Argumentos y comportamiento |
| --- | --- |
| `round(x)` / `round(x, n)` | Redondea a 0 o a `n` decimales; `n` debe ser entero entre 0 y 12 |
| `floor(x)` / `ceil(x)` | Entero inferior / superior |
| `abs(x)` | Valor absoluto |
| `min(...)` / `max(...)` | Mínimo / máximo de 1 a 16 argumentos |
| `pow(base, exponent)` | Potencia, con las mismas restricciones que `^` |
| `sqrt(x)` | Raíz cuadrada, para `x >= 0` |
| `log(x)` | Logaritmo natural, para `x > 0` |
| `exp(x)` | Exponencial natural |
| `if(condition, yes, no)` | Si la condición es distinta de cero, evalúa `yes`; si es cero, evalúa `no` |

`if` evalúa solo la rama elegida. Por ejemplo, `if(total == 0, 0, part / total * 100)` protege explícitamente la división. No existe sintaxis textual `then/else`, ni operadores `&&`, `||` o `?:`.

Dentro de una fórmula, los decimales usan punto y las comas separan argumentos: `round(12.345, 2)`. Se admiten literales como `.5` y `1.5e2`. No hay cadenas, objetos, propiedades, arrays, constantes como `PI`, llamadas dinámicas, JavaScript, importaciones, bucles ni acceso a red o archivos.

`decimals` es un entero entre 0 y 12 que controla la presentación del resultado. `calculateTool` conserva el valor numérico sin aplicar ese redondeo. Si el cálculo requiere redondear un paso, indícalo mediante `round`. La aritmética usa coma flotante binaria; no garantiza exactitud decimal financiera. `round` utiliza la semántica de `Math.round`, con empates hacia el infinito positivo.

### Límites de ejecución

Cada fórmula tiene un máximo de 1024 caracteres y 256 tokens. Tanto el parser como el árbol de expresión tienen un límite de profundidad de 32; la raíz se cuenta como profundidad 0. La evaluación permite hasta 256 visitas a nodos por salida.

El exponente de `pow` y `^` debe estar entre -100 y 100. El argumento de `exp` tiene el mismo límite. Todos los literales, variables y resultados evaluados deben ser finitos. Se rechazan división o resto entre cero, cero elevado a un exponente negativo, dominios inválidos y desbordamientos. Un esquema válido no garantiza que todas las combinaciones de entrada produzcan un resultado: comprueba los casos límite de cada fórmula.

## Validación y pruebas

`validateDefinition` devuelve `{ ok: true, definition }` o `{ ok: false, errors: string[] }`. Usa la definición validada para calcular:

```ts
import { validateDefinition } from "@/lib/tools/schema";
import { calculateTool } from "@/lib/tools/evaluate";

const checked = validateDefinition(rawDefinition);
if (!checked.ok) throw new Error(checked.errors.join("\n"));

const result = calculateTool(checked.definition, { amount: "15" });
// Ejemplo anterior: { ok: true, values: { result: 30 } }
```

Si falla un campo, el resultado es `{ ok: false, errors: { [inputId]: mensaje } }`. Los errores generales usan `errors._form`. No se devuelven resultados parciales cuando falla una salida.

Desde la raíz del repositorio:

```sh
npm test
npm test -- tests/unit/tools-formula.test.ts tests/unit/tools-schema.test.ts tests/unit/tools-seeds.test.ts
npm run check
```

`npm run check` ejecuta lint, comprobación de tipos, pruebas unitarias y build. Las pruebas de navegador se ejecutan por separado con `npm run test:e2e`, según la configuración del proyecto.

Para una herramienta nueva, comprueba al menos un resultado conocido calculado independientemente, límites, entradas vacías e inválidas, y cualquier división, potencia o función con dominio restringido. Para fechas, incluye un año bisiesto y un intervalo que atraviese un cambio de horario. Verifica también las unidades, la presentación, el contenido y los enlaces relacionados.

## Semillas y publicación

Las semillas actuales son la calculadora de porcentajes, la diferencia entre fechas y el conversor de longitud. Se validan al cargar `seedTools` mediante el mismo esquema que las definiciones persistidas.

```sh
npm run db:seed:sql
```

Este comando regenera únicamente `supabase/seed.sql` a partir de `src/lib/tools/seeds.ts`; **no ejecuta el SQL ni se conecta a la base de datos**. El SQL está pensado para la carga inicial de semillas publicadas: inserta categorías, herramientas, su primera versión y una entrada de auditoría. Fija las herramientas como publicadas e indexables, con monetización desactivada. No es una ruta genérica para importar borradores.

La carga es idempotente: si ya existe una categoría o un slug, conserva lo existente. En particular, **cambiar una semilla y volver a ejecutar el SQL no actualiza su contenido, no crea una nueva versión y no cambia su versión publicada**. No edites el SQL generado como fuente de contenido.

El ejemplo de esta guía puede validarse como borrador sin añadirlo a `seedTools`. El editor administrativo, la vista previa editorial, la aprobación, la publicación de nuevas versiones y el rollback pertenecen a la fase 2 y todavía están pendientes. El catálogo público de la base de datos solo renderiza la versión seleccionada de herramientas publicadas; cambiar `status` en un objeto local no realiza esa publicación.
