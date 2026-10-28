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

/** The param's value when it is one of `choices`, `fallback` when it is not, and undefined when the key is absent. */
export function readChoice<T extends string>(
  params: Record<string, string>,
  key: string,
  choices: readonly T[],
  fallback: T,
): T | undefined {
  const raw = params[key];
  if (raw === undefined) return undefined;
  return (choices as readonly string[]).includes(raw) ? (raw as T) : fallback;
}
