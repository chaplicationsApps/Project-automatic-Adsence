/** Dates represent whole UTC days, never local-midnight milliseconds. */
export function parseUtcDay(raw: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const [year, month, day] = raw.split("-").map(Number);
  if (!year || !month || !day || year > 9999 || month > 12 || day > 31) return null;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.getTime() / 86_400_000;
}

/** Decimal point or comma, with no implicit coercion or thousands separators. */
export function parseInputNumber(raw: string): number | null {
  if (raw.length > 64 || !/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$/.test(raw)) return null;
  const value = Number(raw.replace(",", "."));
  return Number.isFinite(value) && Math.abs(value) <= 1e15 ? value : null;
}
