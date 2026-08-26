import {
  COLD_HALF_SATURATION_HOURS,
  ROOM_TIME_EXPONENT,
  coldCoefficients,
  roomCoefficient,
} from './factors';
import { combinedFactor } from './combinedFactors';
import { thermalLagFactor } from './thermal';

export type YeastType = 'fresh' | 'instant' | 'active';

export const YEAST_TYPES: readonly YeastType[] = ['fresh', 'instant', 'active'];

/**
 * Dry-matter conversion relative to fresh (cake) yeast, which is the model's
 * reference. Fresh yeast is roughly 70 % water, so the dried forms are used in
 * much smaller amounts for the same leavening power.
 */
export const YEAST_CONVERSION: Record<YeastType, number> = {
  fresh: 1,
  instant: 1 / 2.5, // 40 % of fresh
  active: 1 / 2, // 50 % of fresh — coarser granules, less viable cell mass
};

/** Fallback percentages when yeast is entered by hand rather than derived. */
export const DEFAULT_YEAST_PERCENT: Record<YeastType, number> = {
  fresh: 0.5,
  instant: 0.2,
  active: 0.25,
};

/**
 * Yeast demand of the room-temperature phase alone: a power law in time,
 * scaled by a temperature coefficient.
 */
export const roomActivity = (temperatureC: number, timeHours: number): number => {
  if (timeHours <= 0) return 0;
  return roomCoefficient(temperatureC) * timeHours ** ROOM_TIME_EXPONENT;
};

/**
 * Yeast demand of the cold phase alone: a saturating (Hill-type) curve, so
 * doubling an already-long fridge rest buys progressively less.
 */
export const coldActivity = (temperatureC: number, timeHours: number): number => {
  if (timeHours <= 0) return 0;
  const { result, time: exponent } = coldCoefficients(temperatureC);
  const timeTerm = timeHours ** exponent;
  return result * (timeTerm / (COLD_HALF_SATURATION_HOURS ** exponent + timeTerm));
};

/**
 * Empirical correction applied when both phases run. The multiplier rises as
 * the fridge rest lengthens, then flattens off once the dough is fully cold.
 */
const combinedCorrection = (coldTimeHours: number): number => {
  if (coldTimeHours < 5) return 1.2;
  if (coldTimeHours < 13) return 1.3;
  if (coldTimeHours < 20) return 1.5;
  if (coldTimeHours < 35) return 1.48;
  if (coldTimeHours < 50) return 1.51;
  if (coldTimeHours < 60) return 1.49;
  if (coldTimeHours < 80) return 1.467;
  return 1.457;
};

/** Correction for a dough that never sees the fridge. */
const ROOM_ONLY_CORRECTION = 1.26;

export interface FermentationSchedule {
  coldTempC: number;
  coldTimeHours: number;
  roomTempC: number;
  roomTimeHours: number;
  /**
   * Mass of a single piece of dough while it is in the fridge — the whole batch
   * if it is retarded in bulk, one ball if it is shaped first. Omitting it
   * skips the thermal-lag correction.
   */
  coldMassG?: number;
}

/**
 * Hours the cold phase is actually worth once the dough's cooling-down time is
 * taken into account. A large mass coasts down slowly and banks extra
 * fermentation; small balls chill fast and bank less.
 */
export const effectiveColdTime = (schedule: FermentationSchedule): number => {
  const { coldTimeHours, coldTempC, coldMassG } = schedule;
  if (coldMassG === undefined || coldTimeHours <= 0) return coldTimeHours;

  return coldTimeHours * thermalLagFactor(coldTimeHours, coldMassG, coldTempC);
};

/**
 * Fresh-yeast fraction of the flour weight (0-1) for the given schedule.
 * See `docs/fermentation-model.md` for the derivation of each term.
 */
export const freshYeastFraction = (schedule: FermentationSchedule): number => {
  const { coldTempC, roomTempC, roomTimeHours, coldTimeHours } = schedule;

  // The empirical curves are keyed on how long the dough behaves as if it were
  // cold, not on wall-clock time in the fridge.
  const effectiveCold = effectiveColdTime(schedule);

  const room = roomActivity(roomTempC, roomTimeHours);
  const cold = coldActivity(coldTempC, effectiveCold);

  if (coldTimeHours <= 0) return room * ROOM_ONLY_CORRECTION;
  if (roomTimeHours <= 0) return cold;

  return room * combinedFactor(effectiveCold, coldTempC) * combinedCorrection(effectiveCold);
};

/** Baker's percentage of the selected yeast type for the given schedule. */
export const yeastPercentFor = (
  yeastType: YeastType,
  schedule: FermentationSchedule
): number => freshYeastFraction(schedule) * 100 * YEAST_CONVERSION[yeastType];
