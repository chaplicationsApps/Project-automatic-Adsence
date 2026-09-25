import { describe, expect, it } from "vitest";
import { calculateTool } from "../../src/lib/tools/evaluate";
import { parseInputNumber, parseUtcDay } from "../../src/lib/tools/inputs";
import { seedTools } from "../../src/lib/tools/seeds";

const percentages = seedTools.find((tool) => tool.slug === "calculadora-porcentajes")!;
const dates = seedTools.find((tool) => tool.slug === "diferencia-entre-fechas")!;
const length = seedTools.find((tool) => tool.slug === "conversor-longitud")!;

describe("percentage calculator", () => {
  it("calculates 15% of 200 and both totals", () => {
    const result = calculateTool(percentages, { percentage: "15", amount: "200" });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected calculation to succeed");
    expect(result.values.result).toBe(30);
    expect(result.values.increased).toBeCloseTo(230);
    expect(result.values.decreased).toBe(170);
  });

  it("handles zero, decimal commas and values above 100%", () => {
    for (const [percentage, amount, expected] of [["0", "100", 0], ["12,5", "80", 10], ["125", "80", 100]] as const) {
      const result = calculateTool(percentages, { percentage, amount });
      expect(result.ok && result.values.result).toBe(expected);
    }
  });

  it.each(["", " ", "NaN", "Infinity", "0x10", "1e999", "1.000,5", "12abc", "-1", "1000000000001"])("rejects invalid or out-of-range amount %s", (amount) => {
    const result = calculateTool(percentages, { percentage: "15", amount });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.amount).toBeTruthy();
  });

  it("does not silently replace required blank values with defaults", () => {
    const result = calculateTool(percentages, {});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(["percentage", "amount"]);
  });
});

describe("absolute UTC date difference", () => {
  it.each([
    ["2026-09-01", "2026-09-24", 23],
    ["2026-09-24", "2026-09-01", 23],
    ["2026-09-24", "2026-09-24", 0],
    ["2024-02-28", "2024-03-01", 2],
    ["2025-02-28", "2025-03-01", 1],
    ["2026-03-28", "2026-03-30", 2],
    ["2026-10-24", "2026-10-26", 2],
    ["0001-01-01", "0001-01-02", 1],
    ["0099-12-31", "0100-01-01", 1],
    ["1999-12-31", "2000-01-01", 1],
  ])("counts %s to %s as %i days", (startDate, endDate, expected) => {
    const result = calculateTool(dates, { startDate, endDate });
    expect(result.ok && result.values.days).toBe(expected);
  });

  it.each(["2025-02-29", "1900-02-29", "2026-04-31", "2026-13-01", "2026-00-01", "2026-01-00", "0000-01-01", "2026-1-1", "09/24/2026", "2026-01-01T00:00:00Z"])("rejects invalid calendar input %s", (startDate) => {
    expect(parseUtcDay(startDate)).toBeNull();
    expect(calculateTool(dates, { startDate, endDate: "2026-09-24" }).ok).toBe(false);
  });

  it("handles century leap-year rules", () => {
    expect(parseUtcDay("2000-02-29")).not.toBeNull();
    expect(parseUtcDay("2100-02-29")).toBeNull();
  });
});

describe("metric length conversion", () => {
  it.each([
    ["2.5", "km", "m", 2500], ["12", "cm", "mm", 120],
    ["750", "mm", "m", 0.75], ["500", "m", "km", 0.5],
    ["1", "km", "mm", 1_000_000], ["42", "cm", "cm", 42],
    ["0", "km", "m", 0], ["1", "mm", "km", 0.000001],
  ])("converts %s %s to %s", (amount, fromUnit, toUnit, expected) => {
    const result = calculateTool(length, { amount, fromUnit, toUnit });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.values.result).toBeCloseTo(expected, 10);
  });

  it("rejects unsupported units and uses only registered numeric factors", () => {
    for (const toUnit of ["miles", "0", "__proto__", "constructor", ""]) {
      expect(calculateTool(length, { amount: "1", fromUnit: "m", toUnit }).ok).toBe(false);
    }
  });

  it("rejects non-numeric, nonfinite, oversized and ambiguous numeric strings", () => {
    for (const raw of ["", "Infinity", "NaN", "0x10", "1_000", "1,000.50", "1e16", "1".repeat(65)]) expect(parseInputNumber(raw)).toBeNull();
    expect(parseInputNumber("1,5")).toBe(1.5);
    expect(parseInputNumber("1.5")).toBe(1.5);
  });
});
