import { evaluateFormula, FormulaError } from "./formula";
import { parseInputNumber, parseUtcDay } from "./inputs";
import { type ToolDefinition, validateDefinition } from "./schema";

export type CalculationResult =
  | { ok: true; values: Record<string, number> }
  | { ok: false; errors: Record<string, string> };

export function calculateTool(definition: ToolDefinition, rawInputs: Record<string, string>): CalculationResult {
  const checked = validateDefinition(definition);
  if (!checked.ok) return { ok: false, errors: { _form: "La definición de esta herramienta no es válida." } };
  const errors: Record<string, string> = {};
  const variables: Record<string, number> = Object.create(null) as Record<string, number>;
  for (const input of checked.definition.inputs) {
    const candidate: unknown = Object.hasOwn(rawInputs, input.id) ? rawInputs[input.id] : undefined;
    let raw = typeof candidate === "string" ? candidate.trim() : "";
    if (raw === "" && !input.required) raw = input.defaultValue ?? "";
    if (raw === "") { errors[input.id] = "Completa este campo."; continue; }
    if (raw.length > 64) { errors[input.id] = "El valor es demasiado largo."; continue; }
    if (input.type === "select") {
      const selected = input.options.find((option) => option.value === raw);
      if (!selected) errors[input.id] = "Elige una de las opciones disponibles.";
      else variables[input.id] = selected.numericValue;
    } else if (input.type === "date") {
      const day = parseUtcDay(raw);
      if (day === null) errors[input.id] = "Introduce una fecha válida (AAAA-MM-DD).";
      else variables[input.id] = day;
    } else {
      const value = parseInputNumber(raw);
      if (value === null) { errors[input.id] = "Introduce un número finito, sin separadores de miles (máximo 10¹⁵)."; continue; }
      if (input.type === "integer" && !Number.isInteger(value)) { errors[input.id] = "Introduce un número entero."; continue; }
      if (input.min !== undefined && value < input.min) { errors[input.id] = `El valor mínimo es ${input.min}.`; continue; }
      if (input.max !== undefined && value > input.max) { errors[input.id] = `El valor máximo es ${input.max}.`; continue; }
      variables[input.id] = value;
    }
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  const values: Record<string, number> = {};
  try {
    for (const output of checked.definition.outputs) values[output.id] = evaluateFormula(output.formula, variables);
    return { ok: true, values };
  } catch (error) {
    return { ok: false, errors: { _form: error instanceof FormulaError ? error.message : "No se ha podido completar el cálculo." } };
  }
}
