import type { Range } from '../math';

/**
 * Sourdough: the starter itself leavens the dough, so instead of a yeast weight
 * the schedule sets how much starter goes in, plus when and how to feed it so
 * it peaks at mixing time. See docs/preferments.md §4 and §5.6.
 */
export const SOURDOUGH = {
  /** Starter weight in percent of the recipe's total flour (inoculation). */
  starterPercent: { default: 20, range: { min: 2, max: 50 } as Range },
  /** Water in the starter, in percent of its flour: 100 liquid, 50 stiff. */
  hydration: { default: 100, range: { min: 50, max: 100 } as Range },
  /** Hours between feeding the starter and mixing the dough. */
  feedHours: { default: 8, range: { min: 3, max: 16 } as Range },
  /** Temperature the fed starter stands at, in °C. */
  feedTemp: { default: 22, range: { min: 15, max: 30 } as Range },
  /** Feeding ratios offered, as `n` in starter : flour : water = 1 : n : n. */
  feedRatio: { min: 1, max: 10 } as Range,
  /** Starter kept back after building, so some is left for next time, in grams. */
  keepGrams: 20,
} as const;

/**
 * Starter percent per percent of fresh yeast the same schedule would need.
 *
 * Bread bulk-fermentation tables come out at 15–26 against the direct-dough
 * model, pizza practice (e.g. 3 % starter for 24 h at 23 °C) at about 35: a
 * pizza dough is taken further than a bread's bulk rise. Over the 5–30 % range
 * people actually use, this linear mapping stays within the scatter of the
 * published tables, and it lets sourdough reuse the whole schedule model —
 * cold phase, thermal lag and all.
 */
export const STARTER_PER_FRESH_YEAST = 35;

/** Starter percent for a schedule whose direct-dough fresh-yeast demand is given. */
export const starterPercentFor = (freshYeastPercent: number): number =>
  freshYeastPercent * STARTER_PER_FRESH_YEAST;

/**
 * Relative fermentation rate of a starter against 24 °C: doubles every 6 K,
 * which matches the published peak-time and bulk tables between 18 and 27 °C.
 */
const starterRate = (temperatureC: number): number => 2 ** ((temperatureC - 24) / 6);

/**
 * Hours to peak at 24 °C as a function of how far the feed dilutes the seed:
 * `PEAK_OFFSET + PEAK_PER_DOUBLING · log2(dilution)`. Fitted to 1:1:1 ≈ 4.75 h,
 * 1:2:2 ≈ 5.25–7 h and 1:5:5 ≈ 10 h.
 */
const PEAK_OFFSET_HOURS = 0.3;
const PEAK_PER_DOUBLING_HOURS = 2.8;

/** Total weight ÷ seed weight for a 1 : n : n feed at the given hydration. */
const dilution = (ratio: number, hydration: number): number => 1 + ratio * (1 + hydration / 100);

/** Hours until a starter fed 1 : n : n peaks at the given temperature. */
export const peakHours = (ratio: number, hydration: number, temperatureC: number): number =>
  (PEAK_OFFSET_HOURS + PEAK_PER_DOUBLING_HOURS * Math.log2(dilution(ratio, hydration))) /
  starterRate(temperatureC);

export interface FeedingPlan {
  /**
   * `n` in seed : flour : water = 1 : n : n. For a stiff starter the water is
   * `n` scaled by the starter's hydration.
   */
  ratio: number;
  /** Ripe starter to start the feed from, in grams. */
  seed: number;
  flour: number;
  water: number;
  /** When the starter fed this way will actually peak, in hours. */
  peakHours: number;
  /**
   * Set when no offered ratio peaks at the requested time: `tooShort` means
   * even 1:1:1 needs longer than the lead time, `tooLong` means even the
   * largest ratio peaks before it.
   */
  mismatch?: 'tooShort' | 'tooLong';
}

/**
 * How to feed the starter so it peaks `hours` after feeding, building the
 * `starterGrams` the dough needs plus a little to keep.
 */
export const feedingPlan = (
  starterGrams: number,
  hydration: number,
  hours: number,
  temperatureC: number
): FeedingPlan => {
  const { min, max } = SOURDOUGH.feedRatio;
  // Invert `peakHours` for n, then settle on a whole ratio.
  const target = (hours * starterRate(temperatureC) - PEAK_OFFSET_HOURS) / PEAK_PER_DOUBLING_HOURS;
  const exact = (2 ** target - 1) / (1 + hydration / 100);
  const ratio = Math.min(max, Math.max(min, Math.round(exact)));
  const peak = peakHours(ratio, hydration, temperatureC);

  // A starter stays at its peak for a while, so only a clear miss is flagged.
  const tolerance = Math.max(1, hours * 0.15);
  const mismatch =
    peak > hours + tolerance ? 'tooShort' : peak < hours - tolerance ? 'tooLong' : undefined;

  const total = starterGrams + SOURDOUGH.keepGrams;
  const seed = total / dilution(ratio, hydration);
  return {
    ratio,
    seed,
    flour: seed * ratio,
    water: seed * ratio * (hydration / 100),
    peakHours: peak,
    mismatch,
  };
};
