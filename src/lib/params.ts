export function readNumber(
  params: Record<string, string>,
  key: string,
  fallback: number,
  range: { min: number; max: number },
): number {
  const raw = params[key];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(range.max, Math.max(range.min, value));
}
