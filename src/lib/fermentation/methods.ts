import type { Range } from '../math';
import { DIRECT_ROOM_MINIMUMS, type RoomMinimums } from './schedule';
import { YEAST_CONVERSION, freshYeastFraction, type YeastType } from './yeast';

/**
 * How the dough is leavened. `direct` puts all the yeast into one dough; the
 * others ferment part of the flour first, as a preferment the final dough is
 * then built on. See `docs/preferments.md` for the sources behind every number
 * below.
 */
export type Method = 'direct' | 'poolish' | 'biga';

export const METHODS: readonly Method[] = ['direct', 'poolish', 'biga'];

export type PrefermentMethod = Exclude<Method, 'direct'>;

export const isPrefermentMethod = (method: Method): method is PrefermentMethod =>
  method !== 'direct';

interface Setting {
  readonly default: number;
  readonly range: Range;
}

export interface PrefermentProfile {
  /** Flour in the preferment, in percent of the recipe's total flour. */
  readonly share: Setting;
  /** Water in the preferment, in percent of the preferment's own flour. */
  readonly hydration: Setting;
  /** Hours until the preferment is ripe. */
  readonly time: Setting;
  /** Temperature it ripens at, in °C. */
  readonly temperature: Setting;
  /**
   * Multiplier on the direct-dough room-temperature curve that gives the
   * yeast for ripening the preferment in the same time. Fitted to published
   * yeast-vs-time tables.
   */
  readonly yeastFactor: number;
  /**
   * The leavening a ripe preferment brings into the final dough, as fresh
   * yeast in percent of the preferment's flour. The final dough only gets the
   * yeast its own schedule needs beyond this.
   */
  readonly ripeYeastEquivalent: number;
  /** Shortest bulk rise and ball proof of the final dough. */
  readonly roomMinimums: RoomMinimums;
  /**
   * The final dough's schedule this method opens with, when the style
   * presets' would not suit it. All hours.
   */
  readonly schedule?: { readonly room: number; readonly bulk: number; readonly cold: number };
  /** Ripening times for the yeast table on the method's page. */
  readonly tableHours: readonly number[];
}

export const PREFERMENTS: Record<PrefermentMethod, PrefermentProfile> = {
  /**
   * Equal flour and water. Against the Italian poolish table and the
   * instant-yeast figures, the direct-dough curve sits at a median ratio of
   * 0.8 between 4 and 16 h (docs/preferments.md §5.1).
   */
  poolish: {
    share: { default: 30, range: { min: 10, max: 50 } },
    hydration: { default: 100, range: { min: 100, max: 100 } },
    time: { default: 12, range: { min: 3, max: 18 } },
    temperature: { default: 20, range: { min: 15, max: 28 } },
    yeastFactor: 0.8,
    // Between recipes that add no yeast to a 30 % poolish dough and ones that
    // add a direct dough's worth; see docs/preferments.md §5.5.
    ripeYeastEquivalent: 1.5,
    roomMinimums: { bulk: 1, ballProof: 3 },
    tableHours: [4, 6, 8, 10, 12, 16],
  },
  /**
   * Stiff and crumbly. The room curve has to be scaled ×2.8 to reproduce the
   * classic Giorilli biga — 1 % fresh yeast for 16–18 h at 18 °C — which fits
   * yeast being water-limited at 45 % hydration (docs/preferments.md §5.2).
   */
  biga: {
    share: { default: 50, range: { min: 20, max: 100 } },
    hydration: { default: 45, range: { min: 40, max: 60 } },
    time: { default: 17, range: { min: 8, max: 24 } },
    temperature: { default: 18, range: { min: 15, max: 25 } },
    yeastFactor: 2.8,
    // A 100 % biga dough needs no added yeast for a ~3 h final rise at 20 °C,
    // which the direct model puts at 2.9 % fresh yeast.
    ripeYeastEquivalent: 3,
    // Puntata of 15–60 min, then an appretto of 1–2 h for a full biga.
    roomMinimums: { bulk: 0.5, ballProof: 1.5 },
    schedule: { room: 3, bulk: 0.5, cold: 24 },
    tableHours: [8, 12, 16, 18, 24],
  },
};

export const roomMinimumsFor = (method: Method): RoomMinimums =>
  isPrefermentMethod(method) ? PREFERMENTS[method].roomMinimums : DIRECT_ROOM_MINIMUMS;

/**
 * Yeast for the preferment itself, in percent of the preferment's flour, for
 * the given yeast type: the direct-dough room curve at the preferment's time
 * and temperature, scaled by the method's fitted factor.
 */
export const prefermentYeastPercent = (
  method: PrefermentMethod,
  yeastType: YeastType,
  temperatureC: number,
  timeHours: number
): number =>
  freshYeastFraction({
    roomTempC: temperatureC,
    roomTimeHours: timeHours,
    coldTempC: temperatureC,
    coldTimeHours: 0,
  }) *
  100 *
  PREFERMENTS[method].yeastFactor *
  YEAST_CONVERSION[yeastType];
