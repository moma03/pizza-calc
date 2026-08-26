export interface Range {
  readonly min: number;
  readonly max: number;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const clampToRange = (value: number, range: Range): number =>
  clamp(value, range.min, range.max);

/** Linear interpolation; `t` is expected in [0, 1]. */
export const lerp = (from: number, to: number, t: number): number =>
  from + (to - from) * t;

export const round = (value: number, decimals = 0): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/**
 * Nearest-key lookup in a numeric-keyed table, so a value that falls between or
 * outside the tabulated points still resolves to the closest sensible entry
 * instead of `undefined`.
 */
export const lookupNearest = <T>(table: Record<number, T>, key: number): T => {
  const keys = Object.keys(table).map(Number);
  const nearest = keys.reduce((best, current) =>
    Math.abs(current - key) < Math.abs(best - key) ? current : best
  );
  return table[nearest];
};
