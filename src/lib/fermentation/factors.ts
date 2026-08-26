import { lookupNearest } from '../math';

/**
 * Room-temperature yeast coefficient `A(T)` in
 *   `roomActivity = A(T) * t^ROOM_TIME_EXPONENT`.
 *
 * Keyed by room temperature in °C. Warmer dough needs dramatically less yeast,
 * which is why the values fall by two orders of magnitude across the range.
 */
const ROOM_TEMPERATURE_COEFFICIENTS: Record<number, number> = {
  14: 0.33,
  15: 0.3,
  16: 0.245,
  17: 0.205,
  18: 0.17,
  19: 0.14,
  20: 0.113,
  21: 0.1,
  22: 0.08,
  23: 0.0683,
  24: 0.0538,
  25: 0.0472,
  26: 0.0389,
  27: 0.0309,
  28: 0.0264,
  29: 0.0218,
  30: 0.019,
  31: 0.0147,
  32: 0.012,
  33: 0.0098,
  34: 0.008,
  35: 0.007,
  36: 0.0061,
  37: 0.005,
  38: 0.004,
  39: 0.00315,
  40: 0.00265,
};

/** Exponent on room-temperature fermentation time. */
export const ROOM_TIME_EXPONENT = -1.45;

export interface ColdCoefficients {
  /** Scale `R(T)` of the saturating cold-fermentation curve. */
  readonly result: number;
  /** Hill exponent `k(T)`; negative, so activity decays with time. */
  readonly time: number;
}

/** Half-saturation time of the cold-fermentation curve, in hours. */
export const COLD_HALF_SATURATION_HOURS = 9.8233;

/** Cold-fermentation coefficients keyed by fridge temperature in °C. */
const COLD_TEMPERATURE_COEFFICIENTS: Record<number, ColdCoefficients> = {
  4: { result: 0.044, time: -1.19 },
  5: { result: 0.043, time: -1.21 },
  6: { result: 0.042, time: -1.22 },
  7: { result: 0.041, time: -1.23 },
  8: { result: 0.04, time: -1.24 },
  9: { result: 0.039, time: -1.25 },
  10: { result: 0.038, time: -1.26 },
  11: { result: 0.037, time: -1.27 },
  12: { result: 0.036, time: -1.28 },
  13: { result: 0.035, time: -1.29 },
};

export const roomCoefficient = (temperatureC: number): number =>
  lookupNearest(ROOM_TEMPERATURE_COEFFICIENTS, temperatureC);

export const coldCoefficients = (temperatureC: number): ColdCoefficients =>
  lookupNearest(COLD_TEMPERATURE_COEFFICIENTS, temperatureC);
