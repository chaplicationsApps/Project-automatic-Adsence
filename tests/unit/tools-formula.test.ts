import { describe, expect, it } from "vitest";
import { evaluateFormula, FORMULA_LIMITS, validateFormula } from "../../src/lib/tools/formula";

describe("restricted arithmetic language", () => {
  it.each([
    ["2 + 3 * 4", 14], ["(2 + 3) * 4", 20], ["10 - 4 - 1", 5],
    ["8 / 2 / 2", 2], ["2 ^ 3 ^ 2", 512], ["-2 ^ 2", -4],
    ["(-2) ^ 2", 4], ["2 ^ -2", 0.25], ["+5 % 3", 2],
    ["round(12.3456, 2)", 12.35], ["floor(2.9) + ceil(2.1)", 5],
    ["abs(-8)", 8], ["min(4, 2, 3) + max(4, 2, 3)", 6],
    ["pow(2, 10)", 1024], ["sqrt(81)", 9], ["log(1) + exp(0)", 1],
    ["1.5e2 + .5", 150.5], ["2 >= 2", 1], ["3 != 3", 0],
    ["if(2 > 1, 7, 9)", 7], ["if(0, 1 / 0, 42)", 42],
    ["if(1, 42, sqrt(-1))", 42],
  ])("evaluates %s", (formula, expected) => {
    expect(evaluateFormula(formula, {})).toBeCloseTo(expected, 10);
  });

  it("resolves only explicitly supplied numeric variables", () => {
    expect(evaluateFormula("amount * percentage / 100", { amount: 200, percentage: 15 })).toBe(30);
    expect(() => evaluateFormula("missing + 1", {})).toThrow("Variable desconocida");
    expect(() => evaluateFormula("value", { value: Infinity })).toThrow("finito");
    expect(() => evaluateFormula("toString", {})).toThrow();
  });

  it.each([
    "globalThis", "window.alert(1)", "process.exit(0)", "require('fs')", "import('fs')",
    "constructor", "__proto__", "value.constructor", "value[0]", "Math.pow(2, 3)",
    "eval(1)", "Function(1)", "fetch(1)", "new Date()", "while(1)",
    "1; 2", "x = 2", "1 || 2", "`1`", "'1'", "[1,2]", "{x:1}",
    "1 // 2", "1 /* 2 */", "2(3)", "abs()", "pow(2)", "if(1,2)",
    "1 +", "(1 + 2", "1 2", "", "1e999",
  ])("rejects unsupported or malicious syntax: %s", (formula) => {
    expect(() => evaluateFormula(formula, { value: 1, x: 1 })).toThrow();
  });

  it.each(["1 / 0", "1 % 0", "0 ^ -1", "sqrt(-1)", "log(0)", "log(-1)", "1e308 * 2", "pow(10, 101)", "2 ^ -101", "exp(101)", "round(1, 13)", "round(1, 1.5)"])("rejects undefined or unsafe arithmetic: %s", (formula) => {
    expect(() => evaluateFormula(formula, {})).toThrow();
  });

  it("checks variables in both branches, even when one is not evaluated", () => {
    expect(() => validateFormula("if(1, 42, hidden)", [])).toThrow("Variable desconocida");
  });

  it("bounds formula size, token count and both kinds of AST depth", () => {
    expect(() => evaluateFormula(" ".repeat(FORMULA_LIMITS.characters + 1), {})).toThrow("longitud");
    expect(() => evaluateFormula("1+".repeat(130) + "1", {})).toThrow("elementos");
    expect(() => evaluateFormula("(".repeat(34) + "1" + ")".repeat(34), {})).toThrow("profundidad");
    expect(() => evaluateFormula("1+".repeat(34) + "1", {})).toThrow("profundidad");
    expect(() => evaluateFormula("-".repeat(34) + "1", {})).toThrow("profundidad");
  });
});
