import type { Range } from '../math';
import { DIRECT_ROOM_MINIMUMS, type RoomMinimums } from './schedule';
import { YEAST_CONVERSION, freshYeastFraction, type YeastType } from './yeast';

/**
 * How the dough is leavened. `direct` puts all the yeast into one dough; the
 * others ferment part of the flour first, as a preferment the final dough is
 * then built on. See `docs/preferments.md` for the sources behind every number
 * below.
 */
export type Method = 'direct' | 'poolish';

export const METHODS: readonly Method[] = ['direct', 'poolish'];

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
    // add a direct dough's worth; see docs/preferments.md §5.4.
    ripeYeastEquivalent: 1.5,
    roomMinimums: { bulk: 1, ballProof: 3 },
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
