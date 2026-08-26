/**
 * Thermal lag of the cold phase.
 *
 * Dough does not jump to fridge temperature when it goes in — it coasts down
 * over hours, fermenting the whole way. How long that takes depends on the size
 * of the piece, so a batch retarded as one mass banks noticeably more
 * fermentation than the same dough retarded as individual balls.
 *
 * See `docs/fermentation-model.md` §6 for the derivation and its limits.
 */

/** Temperature coefficient used to weight the cooling curve. */
const Q10 = 2;

/**
 * Newton-cooling time constant fitted to published retarder measurements:
 * 1.5 kg of dough in two pieces (~750 g each) fell from 24 °C to 10 °C in 4 h
 * in a 4 °C retarder, so `tau = 4 / ln(20/6)`.
 */
const TAU_REF_HOURS = 3.32;
const TAU_REF_MASS_G = 750;

/**
 * How the time constant scales with the mass of one piece.
 *
 * A lumped body (Biot << 1) scales as m^(1/3); a conduction-limited one
 * (Biot >> 1) as m^(2/3). Dough in a domestic fridge sits near Biot ~ 1, so
 * this uses the geometric mean of the two limits.
 */
const MASS_EXPONENT = 0.5;

/**
 * Batch mass the empirical factor tables in `combinedFactors.ts` were fitted
 * around. The lag is already implicit in those numbers, so only the deviation
 * from this reference is applied on top.
 */
const REFERENCE_BATCH_G = 1000;

/** Dough temperature going into the fridge, after kneading and the bulk rise. */
const DOUGH_ENTRY_TEMP_C = 21;

export const coolingTimeConstant = (massG: number): number =>
  TAU_REF_HOURS * (Math.max(massG, 1) / TAU_REF_MASS_G) ** MASS_EXPONENT;

/**
 * Hours at the fridge temperature that `hours` of real time are worth, given
 * the dough is still coasting down for part of it. Always >= `hours`.
 *
 * Integrates `Q10^((T(t) - T_fridge) / 10)` over the cooling curve
 * `T(t) = T_fridge + (T_entry - T_fridge) * exp(-t / tau)` by Simpson's rule.
 */
export const effectiveColdHours = (
  hours: number,
  massG: number,
  fridgeTempC: number,
  entryTempC: number = DOUGH_ENTRY_TEMP_C
): number => {
  if (hours <= 0) return 0;

  const excess = entryTempC - fridgeTempC;
  if (excess <= 0) return hours;

  const tau = coolingTimeConstant(massG);
  const steps = 256; // even, for Simpson's rule
  const dt = hours / steps;
  const weight = (t: number) => Q10 ** ((excess * Math.exp(-t / tau)) / 10);

  let total = weight(0) + weight(hours);
  for (let i = 1; i < steps; i += 1) {
    total += weight(i * dt) * (i % 2 === 0 ? 2 : 4);
  }

  return (total * dt) / 3;
};

/**
 * Multiplier on the nominal cold time, relative to the reference batch the
 * factor tables were fitted around. Above 1 for a big mass that cools slowly,
 * below 1 for small balls that chill quickly.
 */
export const thermalLagFactor = (
  hours: number,
  massG: number,
  fridgeTempC: number
): number => {
  if (hours <= 0) return 1;

  const reference = effectiveColdHours(hours, REFERENCE_BATCH_G, fridgeTempC);
  if (reference <= 0) return 1;

  return effectiveColdHours(hours, massG, fridgeTempC) / reference;
};
