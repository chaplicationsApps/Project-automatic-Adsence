import { z } from "zod";
import { isSafeIdentifier, validateFormula } from "./formula";
import { parseInputNumber, parseUtcDay } from "./inputs";

const text = (maximum: number) => z.string().trim().min(1).max(maximum);
const identifier = text(48).refine(isSafeIdentifier, "Identificador no permitido.");
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
const finiteNumber = z.number().finite().min(-1e15).max(1e15);
const sharedInput = {
  id: identifier,
  label: text(100),
  helpText: text(300).optional(),
  placeholder: text(100).optional(),
  defaultValue: z.string().max(64).optional(),
  required: z.boolean(),
  unit: text(30).optional(),
};

export const toolInputSchema = z.discriminatedUnion("type", [
  z.object({ ...sharedInput, type: z.literal("number"), min: finiteNumber.optional(), max: finiteNumber.optional(), step: finiteNumber.positive().optional() }).strict(),
  z.object({ ...sharedInput, type: z.literal("integer"), min: finiteNumber.int().optional(), max: finiteNumber.int().optional(), step: finiteNumber.int().positive().optional() }).strict(),
  z.object({ ...sharedInput, type: z.literal("date") }).strict(),
  z.object({ ...sharedInput, type: z.literal("select"), options: z.array(z.object({ value: text(40), label: text(100), numericValue: finiteNumber }).strict()).min(1).max(32) }).strict(),
]);

export const toolOutputSchema = z.object({
  id: identifier,
  label: text(100),
  formula: text(1024),
  decimals: z.number().int().min(0).max(12),
  unit: text(30).optional(),
  description: text(300).optional(),
}).strict();

export const toolDefinitionSchema = z.object({
  schemaVersion: z.literal("1.0"),
  version: z.number().int().positive().max(1_000_000),
  slug,
  title: text(120),
  shortDescription: text(240),
  category: slug,
  status: z.enum(["draft", "review", "published", "archived"]),
  inputs: z.array(toolInputSchema).min(1).max(32),
  outputs: z.array(toolOutputSchema).min(1).max(12),
  content: z.object({
    intro: text(4000),
    methodology: text(4000),
    examples: z.array(z.object({ title: text(160), description: text(1000) }).strict()).min(1).max(10),
    faq: z.array(z.object({ question: text(200), answer: text(2000) }).strict()).min(1).max(12),
    sources: z.array(z.object({ label: text(200), url: z.url().max(2048).refine((url) => url.startsWith("https://"), "La fuente debe usar HTTPS.") }).strict()).max(12),
    limitations: z.array(text(1000)).min(1).max(10),
  }).strict(),
  seo: z.object({ title: text(70), description: text(180) }).strict(),
  relatedTools: z.array(slug).max(8),
}).strict().superRefine((definition, context) => {
  const addIssue = (path: (string | number)[], message: string) => context.addIssue({ code: "custom", path, message });
  const inputIds = new Set<string>();
  for (const [index, input] of definition.inputs.entries()) {
    if (inputIds.has(input.id)) addIssue(["inputs", index, "id"], "Identificador de entrada duplicado.");
    inputIds.add(input.id);
    if (input.type === "number" || input.type === "integer") {
      if (input.min !== undefined && input.max !== undefined && input.min > input.max) addIssue(["inputs", index, "max"], "El máximo debe ser igual o mayor que el mínimo.");
      if (input.defaultValue !== undefined) {
        const value = parseInputNumber(input.defaultValue);
        if (value === null || (input.type === "integer" && !Number.isInteger(value)) || (input.min !== undefined && value < input.min) || (input.max !== undefined && value > input.max)) {
          addIssue(["inputs", index, "defaultValue"], "Valor predeterminado no válido.");
        }
      }
    }
    if (input.type === "date" && input.defaultValue !== undefined && parseUtcDay(input.defaultValue) === null) addIssue(["inputs", index, "defaultValue"], "Fecha predeterminada no válida.");
    if (input.type === "select") {
      const values = input.options.map((option) => option.value);
      if (new Set(values).size !== values.length) addIssue(["inputs", index, "options"], "Las opciones deben tener valores únicos.");
      if (input.defaultValue !== undefined && !values.includes(input.defaultValue)) addIssue(["inputs", index, "defaultValue"], "La opción predeterminada no existe.");
    }
    if (!input.required && input.defaultValue === undefined) addIssue(["inputs", index, "defaultValue"], "Las entradas opcionales deben declarar un valor predeterminado.");
  }
  const outputIds = new Set<string>();
  for (const [index, output] of definition.outputs.entries()) {
    if (outputIds.has(output.id) || inputIds.has(output.id)) addIssue(["outputs", index, "id"], "El identificador de salida debe ser único.");
    outputIds.add(output.id);
    try { validateFormula(output.formula, [...inputIds]); }
    catch (error) { addIssue(["outputs", index, "formula"], error instanceof Error ? error.message : "Fórmula no válida."); }
  }
  if (new Set(definition.relatedTools).size !== definition.relatedTools.length || definition.relatedTools.includes(definition.slug)) addIssue(["relatedTools"], "Las herramientas relacionadas deben ser únicas y distintas de la actual.");
});

export type ToolInput = z.infer<typeof toolInputSchema>;
export type ToolOutput = z.infer<typeof toolOutputSchema>;
export type ToolDefinition = z.infer<typeof toolDefinitionSchema>;
export type DefinitionValidation = { ok: true; definition: ToolDefinition } | { ok: false; errors: string[] };

export function validateDefinition(value: unknown): DefinitionValidation {
  const result = toolDefinitionSchema.safeParse(value);
  return result.success
    ? { ok: true, definition: result.data }
    : { ok: false, errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
}
