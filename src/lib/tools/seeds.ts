import { type ToolDefinition, toolDefinitionSchema } from "./schema";

export const categories = [
  { slug: "matematicas", name: "Matemáticas", description: "Porcentajes y cálculos cotidianos, paso a paso." },
  { slug: "fechas", name: "Fechas y tiempo", description: "Días, intervalos y fechas sin cuentas de más." },
  { slug: "conversiones", name: "Conversores", description: "Cambia de unidad y conserva la precisión." },
];

const percentage: ToolDefinition = {
  schemaVersion: "1.0",
  version: 1,
  slug: "calculadora-porcentajes",
  title: "Calculadora de porcentajes",
  shortDescription: "Calcula un porcentaje de cualquier cantidad y consulta el total al sumarlo o restarlo.",
  category: "matematicas",
  status: "published",
  inputs: [
    { id: "percentage", type: "number", label: "Porcentaje", helpText: "Escribe 15 para calcular el 15 %. Admite porcentajes superiores a 100.", defaultValue: "15", placeholder: "15", required: true, min: 0, max: 100_000, unit: "%" },
    { id: "amount", type: "number", label: "Cantidad", helpText: "Introduce la cantidad de partida, sin separadores de miles.", defaultValue: "200", placeholder: "200", required: true, min: 0, max: 1e12 },
  ],
  outputs: [
    { id: "result", label: "Porcentaje de la cantidad", formula: "amount * percentage / 100", decimals: 4, description: "Esta es la parte que representa el porcentaje indicado." },
    { id: "increased", label: "Cantidad con el porcentaje sumado", formula: "amount * (1 + percentage / 100)", decimals: 4 },
    { id: "decreased", label: "Cantidad con el porcentaje restado", formula: "amount * (1 - percentage / 100)", decimals: 4 },
  ],
  content: {
    intro: "Un porcentaje expresa cuántas partes tomamos de cada cien. Esta calculadora te ayuda a obtener una parte de una cantidad, comprobar un descuento o añadir un incremento sencillo. Introduce el porcentaje y la cantidad de partida: verás la parte calculada y los dos totales posibles. Los resultados conservan la unidad de la cantidad original; si introduces euros, también representan euros.",
    methodology: "Multiplica la cantidad por el porcentaje y divide el producto entre 100. Para añadirlo, suma ese resultado a la cantidad inicial; para restarlo, réstalo. Por ejemplo, 15 % de 200 se calcula como 200 × 15 ÷ 100 = 30. El total con aumento es 230 y el total tras restarlo es 170. No redondeamos los pasos intermedios; la presentación muestra hasta cuatro decimales.",
    examples: [
      { title: "Un descuento del 15 %", description: "Para un precio de 200, escribe 15 como porcentaje y 200 como cantidad. El descuento es 30 y el precio después de restarlo es 170." },
      { title: "Añadir un 8 %", description: "Si una cantidad de 75 aumenta un 8 %, el incremento es 6 y el total es 81. La base del porcentaje sigue siendo 75." },
      { title: "Un porcentaje mayor que 100", description: "El 125 % de 80 es 100. Un porcentaje superior a 100 representa una cantidad mayor que la base; al restarlo, el total puede ser negativo." },
    ],
    faq: [
      { question: "¿Cómo calculo un porcentaje de una cantidad?", answer: "Multiplica la cantidad por el porcentaje y divide entre 100. Para calcular el 20 % de 150: 150 × 20 ÷ 100 = 30." },
      { question: "¿Puedo introducir decimales?", answer: "Sí. Puedes escribir el separador decimal como coma o punto, por ejemplo 12,5 o 12.5. No introduzcas separadores de miles: para mil doscientos escribe 1200." },
      { question: "¿Un aumento del 20 % y una bajada del 20 % se anulan?", answer: "No si se aplican sucesivamente sobre bases distintas. Al subir 100 un 20 % obtienes 120; al bajar esos 120 un 20 % obtienes 96. Aquí los dos totales usan la misma cantidad inicial." },
      { question: "¿Sirve para saber qué porcentaje representa una cantidad respecto a otra?", answer: "Esta herramienta calcula una parte a partir de un porcentaje conocido. Para saber qué porcentaje representa una parte, divide esa parte entre el total y multiplica por 100; el total no puede ser cero." },
    ],
    sources: [{ label: "OpenStax: definición de porcentaje", url: "https://openstax.org/books/prealgebra-2e/pages/6-1-understand-percent" }],
    limitations: ["Calcula porcentajes simples sobre una única base; no acumula descuentos ni intereses compuestos.", "Admite cantidades de 0 a 10¹² y porcentajes de 0 a 100 000. El resultado mostrado puede estar redondeado.", "Es una herramienta aritmética informativa. No incorpora normas fiscales, reglas de facturación ni asesoramiento financiero."],
  },
  seo: { title: "Calculadora de porcentajes: calcula, suma y resta", description: "Calcula el porcentaje de una cantidad, un descuento o un aumento. Fórmula explicada, ejemplos y resultados al instante, sin registro." },
  relatedTools: ["conversor-longitud", "diferencia-entre-fechas"],
};

const dates: ToolDefinition = {
  schemaVersion: "1.0",
  version: 1,
  slug: "diferencia-entre-fechas",
  title: "Días entre dos fechas",
  shortDescription: "Descubre cuántos días separan dos fechas, con años bisiestos y sin cambios por horario de verano.",
  category: "fechas",
  status: "published",
  inputs: [
    { id: "startDate", type: "date", label: "Primera fecha", defaultValue: "2026-09-01", required: true, helpText: "Elige una fecha válida del calendario." },
    { id: "endDate", type: "date", label: "Segunda fecha", defaultValue: "2026-09-24", required: true, helpText: "El orden de las fechas no cambia el resultado." },
  ],
  outputs: [
    { id: "days", label: "Días entre las fechas", formula: "abs(endDate - startDate)", decimals: 0, unit: "días", description: "Diferencia absoluta: no se cuenta el día inicial." },
    { id: "weeks", label: "Equivalencia en semanas", formula: "abs(endDate - startDate) / 7", decimals: 2, unit: "semanas" },
  ],
  content: {
    intro: "Consulta la separación entre dos fechas para preparar una cuenta atrás, revisar la duración de un proyecto o comparar intervalos de calendario. Se cuentan todos los días, incluidos sábados, domingos y festivos. Puedes introducir las fechas en cualquier orden: el resultado siempre será positivo o cero. No necesitas indicar tu ubicación ni tu zona horaria.",
    methodology: "Cada fecha se transforma en un número de días del calendario usando UTC. Restamos ambos valores y tomamos el valor absoluto. Así, dos fechas consecutivas están separadas por un día aunque un cambio de horario haga que entre sus medianoches locales transcurran 23 o 25 horas. Los años bisiestos se validan con el calendario gregoriano. Las semanas equivalen a días ÷ 7, con hasta dos decimales.",
    examples: [
      { title: "De lunes a lunes", description: "Entre el 7 de septiembre de 2026 y el 14 de septiembre de 2026 hay 7 días, equivalentes a 1 semana." },
      { title: "Un febrero bisiesto", description: "Del 28 de febrero de 2024 al 1 de marzo de 2024 hay 2 días: el intervalo incluye el 29 de febrero." },
      { title: "Las mismas fechas en orden inverso", description: "Del 24 al 1 de septiembre de 2026 también hay 23 días. Si eliges la misma fecha en ambos campos, obtendrás 0." },
    ],
    faq: [
      { question: "¿Se incluye el día inicial?", answer: "No. Medimos la distancia entre las fechas: del día 1 al día 2 hay 1 día. Si necesitas contar ambos días del calendario, añade 1 al resultado." },
      { question: "¿Se descuentan fines de semana o festivos?", answer: "No. El cálculo cuenta días naturales. Los plazos laborales o administrativos pueden seguir reglas distintas y necesitar un calendario de festivos específico." },
      { question: "¿Qué pasa al cambiar al horario de verano?", answer: "El resultado sigue contando días de calendario. La herramienta usa UTC y no la duración en horas entre medianoches locales, por lo que esos cambios no alteran la diferencia." },
      { question: "¿Admite el 29 de febrero?", answer: "Sí, cuando existe en el año indicado. Por ejemplo, 2024 es bisiesto y 2025 no. Las fechas inexistentes muestran un error en lugar de corregirse automáticamente." },
    ],
    sources: [{ label: "MDN: fechas y cálculos en UTC", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/UTC" }],
    limitations: ["Admite fechas válidas entre los años 0001 y 9999 del calendario gregoriano; no reproduce calendarios históricos locales.", "Calcula días naturales, no días hábiles, edades legales ni vencimientos administrativos.", "No mide horas transcurridas ni incorpora horas del día o zonas horarias."],
  },
  seo: { title: "Días entre dos fechas: calculadora de diferencia", description: "Calcula los días naturales entre dos fechas, con años bisiestos. Resultado en días y semanas, ejemplos y explicación de cómo se cuenta." },
  relatedTools: ["calculadora-porcentajes", "conversor-longitud"],
};

const units = [
  { value: "km", label: "Kilómetros (km)", numericValue: 1000 },
  { value: "m", label: "Metros (m)", numericValue: 1 },
  { value: "cm", label: "Centímetros (cm)", numericValue: 0.01 },
  { value: "mm", label: "Milímetros (mm)", numericValue: 0.001 },
];

const length: ToolDefinition = {
  schemaVersion: "1.0",
  version: 1,
  slug: "conversor-longitud",
  title: "Conversor de longitud",
  shortDescription: "Convierte kilómetros, metros, centímetros y milímetros en un solo paso, con la equivalencia explicada.",
  category: "conversiones",
  status: "published",
  inputs: [
    { id: "amount", type: "number", label: "Longitud", defaultValue: "1", placeholder: "1", required: true, min: 0, max: 1e12, helpText: "Usa coma o punto decimal, sin separadores de miles." },
    { id: "fromUnit", type: "select", label: "De", defaultValue: "km", required: true, options: units },
    { id: "toUnit", type: "select", label: "A", defaultValue: "m", required: true, options: units },
  ],
  outputs: [
    { id: "result", label: "Longitud convertida", formula: "amount * fromUnit / toUnit", decimals: 8, unit: "en la unidad de destino", description: "El resultado corresponde a la unidad elegida en el campo «A»." },
  ],
  content: {
    intro: "Pasa una medida de kilómetros a metros, de centímetros a milímetros o entre cualquiera de estas cuatro unidades métricas. Introduce la longitud, selecciona la unidad de origen y elige la unidad de destino. La magnitud física no cambia: solo cambia el número con el que la expresamos. Es útil para medidas domésticas, ejercicios y planificación de distancias.",
    methodology: "Convertimos primero a metros y después a la unidad de destino: resultado = cantidad × factor de origen ÷ factor de destino. Los factores respecto al metro son 1000 para km, 1 para m, 0,01 para cm y 0,001 para mm. Por ejemplo, 2,5 km × 1000 ÷ 1 = 2500 m. Estos factores métricos son exactos; la aritmética digital y la presentación pueden introducir pequeños redondeos.",
    examples: [
      { title: "De kilómetros a metros", description: "Un recorrido de 2,5 kilómetros equivale a 2500 metros. Selecciona km en «De» y m en «A»." },
      { title: "De centímetros a milímetros", description: "Una pieza de 12 centímetros mide 120 milímetros. Cada centímetro contiene 10 milímetros." },
      { title: "De milímetros a metros", description: "Una medida de 750 milímetros equivale a 0,75 metros. Para pasar de mm a m, divide entre 1000." },
    ],
    faq: [
      { question: "¿Cuántos centímetros tiene un metro?", answer: "Un metro equivale a 100 centímetros y a 1000 milímetros. Un kilómetro equivale a 1000 metros." },
      { question: "¿Puedo convertir en sentido inverso?", answer: "Sí. Intercambia las unidades de origen y destino e introduce la cantidad correspondiente. Por ejemplo, 2500 m equivalen a 2,5 km." },
      { question: "¿El resultado sirve para superficies o volúmenes?", answer: "No. Esta herramienta convierte longitudes. Para superficies los factores se elevan al cuadrado y para volúmenes al cubo: 1 m² equivale a 10 000 cm², no a 100 cm²." },
      { question: "¿Por qué una medida muy pequeña puede aparecer como cero?", answer: "La presentación muestra hasta ocho decimales. Una cantidad menor que esa precisión puede redondearse a cero; prueba una unidad de destino más pequeña para ver más detalle." },
    ],
    sources: [{ label: "BIPM: Sistema Internacional de Unidades", url: "https://www.bipm.org/en/measurement-units" }],
    limitations: ["Incluye únicamente km, m, cm y mm; no convierte millas, pies, superficies ni volúmenes.", "Admite longitudes entre 0 y 10¹² en la unidad de origen. La presentación muestra hasta ocho decimales.", "La conversión no corrige la incertidumbre de una medición ni determina tolerancias de fabricación."],
  },
  seo: { title: "Conversor de longitud: km, m, cm y mm", description: "Convierte kilómetros, metros, centímetros y milímetros al instante. Factores métricos, ejemplos y explicación del cálculo, sin registro." },
  relatedTools: ["calculadora-porcentajes", "diferencia-entre-fechas"],
};

/** Validate seeds through the same boundary used for persisted definitions. */
export const seedTools: ToolDefinition[] = [percentage, dates, length].map((definition) => toolDefinitionSchema.parse(definition));
