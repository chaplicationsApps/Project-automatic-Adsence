import { describe, expect, it } from "vitest";
import { calculateTool } from "../../src/lib/tools/evaluate";
import { seedTools } from "../../src/lib/tools/seeds";
import { type ToolDefinition, validateDefinition } from "../../src/lib/tools/schema";

const fixture = () => structuredClone(seedTools[0]!);

describe("ToolDefinition V1 boundary", () => {
  it("accepts all seeds and serializable JSON round trips", () => {
    for (const definition of seedTools) {
      expect(validateDefinition(JSON.parse(JSON.stringify(definition))).ok).toBe(true);
    }
  });

  it.each([
    { schemaVersion: "2.0" }, { version: 0 }, { slug: "../private" },
    { unexpectedCode: "alert(1)" }, { inputs: [] }, { outputs: [] },
    { status: "anything" }, { category: "Bad Category" },
  ])("rejects unsupported top-level data %j", (change) => {
    expect(validateDefinition({ ...fixture(), ...change }).ok).toBe(false);
  });

  it("rejects unknown nested fields and duplicate IDs", () => {
    const definition = fixture();
    expect(validateDefinition({ ...definition, seo: { ...definition.seo, script: "bad" } }).ok).toBe(false);
    definition.inputs[1]!.id = definition.inputs[0]!.id;
    expect(validateDefinition(definition).ok).toBe(false);
    const duplicatedOutput = fixture();
    duplicatedOutput.outputs[1]!.id = duplicatedOutput.outputs[0]!.id;
    expect(validateDefinition(duplicatedOutput).ok).toBe(false);
  });

  it("rejects invalid formulas, unbound variables and cross-output dependencies", () => {
    for (const formula of ["amount.constructor", "unknown + 1", "result + 1", "pow(1)"]) {
      const definition = fixture();
      definition.outputs[0]!.formula = formula;
      expect(validateDefinition(definition).ok).toBe(false);
    }
  });

  it("rejects conflicting bounds, nonfinite defaults and invalid select defaults", () => {
    const definition = fixture();
    definition.inputs[0] = { id: "percentage", type: "number", label: "Porcentaje", required: true, min: 10, max: 1 };
    expect(validateDefinition(definition).ok).toBe(false);
    definition.inputs[0] = { id: "percentage", type: "number", label: "Porcentaje", required: true, defaultValue: "Infinity" };
    expect(validateDefinition(definition).ok).toBe(false);
    definition.inputs[0] = { id: "percentage", type: "select", label: "Porcentaje", required: true, defaultValue: "other", options: [{ label: "Uno", value: "one", numericValue: 1 }] };
    expect(validateDefinition(definition).ok).toBe(false);
  });

  it("rejects invalid dates, duplicate options and unsafe source URLs", () => {
    const definition = structuredClone(seedTools[1]!);
    definition.inputs[0]!.defaultValue = "2025-02-29";
    expect(validateDefinition(definition).ok).toBe(false);
    const length = structuredClone(seedTools[2]!);
    const select = length.inputs[1]!;
    if (select.type === "select") select.options.push(select.options[0]!);
    expect(validateDefinition(length).ok).toBe(false);
    const maliciousSource = fixture();
    maliciousSource.content.sources[0]!.url = "javascript:alert(1)";
    expect(validateDefinition(maliciousSource).ok).toBe(false);
  });

  it("treats optional values predictably and enforces integer and range constraints", () => {
    const definition = fixture();
    definition.inputs[0] = { id: "percentage", type: "integer", label: "Porcentaje", min: 1, max: 100, required: false, defaultValue: "10" };
    const result = calculateTool(definition, { amount: "200" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.result).toBe(20);
      expect(result.values.increased).toBeCloseTo(220);
      expect(result.values.decreased).toBe(180);
    }
    for (const percentage of ["1.5", "0", "101"]) expect(calculateTool(definition, { amount: "200", percentage }).ok).toBe(false);
    delete definition.inputs[0].defaultValue;
    expect(validateDefinition(definition).ok).toBe(false);
  });

  it("returns a safe failure when the persisted definition is malformed", () => {
    expect(calculateTool({ ...fixture(), outputs: [{ formula: "eval(1)" }] } as ToolDefinition, {})).toEqual({ ok: false, errors: { _form: "La definición de esta herramienta no es válida." } });
  });
});
