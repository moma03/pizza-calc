import { round, type Range } from './math';

export type UnitSystem = 'metric' | 'imperial';

/**
 * What a number means, so it can be converted and labelled for the selected
 * unit system. Everything in the app's model is stored in the metric base unit
 * (grams, degrees Celsius, hours); conversion happens only at the edges.
 */
export type Quantity = 'weight' | 'temperature' | 'hours' | 'percent' | 'count';

const GRAMS_PER_OUNCE = 28.34952;

export const gramsToOunces = (grams: number): number => grams / GRAMS_PER_OUNCE;
export const ouncesToGrams = (ounces: number): number => ounces * GRAMS_PER_OUNCE;

export const celsiusToFahrenheit = (celsius: number): number => celsius * (9 / 5) + 32;
export const fahrenheitToCelsius = (fahrenheit: number): number => (fahrenheit - 32) * (5 / 9);

/** Convert a metric base value into the unit the user is looking at. */
export const toDisplayUnit = (
  value: number,
  quantity: Quantity,
  system: UnitSystem
): number => {
  if (system === 'metric') return value;
  if (quantity === 'weight') return gramsToOunces(value);
  if (quantity === 'temperature') return celsiusToFahrenheit(value);
  return value;
};

/** Convert a value the user typed back into the metric base unit. */
export const fromDisplayUnit = (
  value: number,
  quantity: Quantity,
  system: UnitSystem
): number => {
  if (system === 'metric') return value;
  if (quantity === 'weight') return ouncesToGrams(value);
  if (quantity === 'temperature') return fahrenheitToCelsius(value);
  return value;
};

export const unitSymbol = (quantity: Quantity, system: UnitSystem): string => {
  switch (quantity) {
    case 'weight':
      return system === 'metric' ? 'g' : 'oz';
    case 'temperature':
      return system === 'metric' ? '°C' : '°F';
    case 'hours':
      return 'h';
    case 'percent':
      return '%';
    default:
      return '';
  }
};

/** A metric range expressed in display units, e.g. for an input's min/max. */
export const rangeToDisplayUnit = (
  range: Range,
  quantity: Quantity,
  system: UnitSystem
): Range => ({
  min: toDisplayUnit(range.min, quantity, system),
  max: toDisplayUnit(range.max, quantity, system),
});

/**
 * Format a metric value for display, picking a precision that stays useful for
 * small amounts (a few grams of yeast becomes a fraction of an ounce).
 */
export const formatQuantity = (
  value: number,
  quantity: Quantity,
  system: UnitSystem,
  decimals = 0
): string => {
  const converted = toDisplayUnit(value, quantity, system);

  if (quantity === 'temperature') return `${round(converted)}${unitSymbol(quantity, system)}`;

  const precision =
    system === 'imperial' && quantity === 'weight'
      ? Math.max(decimals, converted < 1 ? 2 : 1)
      : decimals;

  return `${round(converted, precision)} ${unitSymbol(quantity, system)}`.trim();
};

/**
 * A temperature span, e.g. `430-480°C` / `810-900°F`. Rounded to `step` so a
 * converted range stays a round number rather than reading `806-896°F`.
 */
export const formatTemperatureRange = (
  fromCelsius: number,
  toCelsius: number,
  system: UnitSystem,
  step = 10
): string => {
  const convert = (value: number) =>
    Math.round(toDisplayUnit(value, 'temperature', system) / step) * step;

  return `${convert(fromCelsius)}\u2013${convert(toCelsius)}${unitSymbol('temperature', system)}`;
};

/** Hours, without trailing `.0` on whole numbers. */
export const formatHours = (hours: number): string => `${round(hours, 1)}`;
