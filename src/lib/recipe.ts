import {
  DEFAULT_YEAST_PERCENT,
  MIN_BULK_HOURS,
  MIN_ROOM_HOURS,
  bulkHoursRange,
  effectiveColdTime,
  yeastPercentFor,
  type FermentationSchedule,
  type YeastType,
} from './fermentation';
import { clampToRange, type Range } from './math';

export type PizzaStyle = 'neapolitan' | 'newyork' | 'roman' | 'custom';

/** Whether the dough is divided into balls before or after the cold phase. */
export type BallingPoint = 'beforeCold' | 'afterCold';

export const BALLING_POINTS: readonly BallingPoint[] = ['afterCold', 'beforeCold'];

export const PIZZA_STYLES: readonly PizzaStyle[] = ['neapolitan', 'newyork', 'roman', 'custom'];

/**
 * Accepted input ranges, in metric base units. They double as the `min`/`max`
 * of the form fields and as the clamp applied before anything is calculated,
 * so a half-typed value can never reach the model.
 */
export const LIMITS = {
  numberOfPizzas: { min: 1, max: 50 },
  doughBallWeight: { min: 100, max: 500 },
  waterPercent: { min: 50, max: 90 },
  /** Percent of the water, not of the flour. */
  icePercent: { min: 0, max: 50 },
  saltPercent: { min: 1, max: 4 },
  yeastPercent: { min: 0.05, max: 3 },
  oilPercent: { min: 0, max: 10 },
  sugarPercent: { min: 0, max: 5 },
  coldFermentTemp: { min: 4, max: 13 },
  coldFermentTime: { min: 0, max: 96 },
  roomFermentTemp: { min: 15, max: 30 },
  roomFermentTime: { min: MIN_ROOM_HOURS, max: 24 },
} as const satisfies Record<string, Range>;

/** Oven temperature guidance for the bake step, in °C. */
export const BAKE_TEMPS = {
  pizzaOven: { min: 430, max: 480 },
  homeOven: { min: 250, max: 300 },
} as const satisfies Record<string, Range>;

/**
 * Default share of the hydration weighed out as ice rather than water. The ice
 * is not extra water — it melts into the dough — so it only splits how the same
 * total is weighed. It absorbs heat as it melts, which keeps the dough from
 * warming up during a long knead.
 */
export const DEFAULT_ICE_PERCENT = 10;

/** Water temperature for waking up active dry yeast, in °C. */
export const REHYDRATION_TEMP_C = 35;

export interface RecipeInput {
  numberOfPizzas: number;
  doughBallWeight: number;
  waterPercent: number;
  /** Share of the water weighed as ice, in percent of the water. */
  icePercent: number;
  saltPercent: number;
  oilPercent: number;
  sugarPercent: number;
  yeastType: YeastType;
  /** When false, `yeastPercent` is used verbatim instead of being derived. */
  autoCalculateYeast: boolean;
  yeastPercent: number;
  coldFermentTemp: number;
  coldFermentTime: number;
  roomFermentTemp: number;
  roomFermentTime: number;
  /**
   * Of `roomFermentTime`, how many hours run before the fridge. The rest is the
   * final proof. Only meaningful when there is a cold phase to split around.
   */
  bulkFermentHours: number;
  ballingPoint: BallingPoint;
  /** See `Recipe.useThermalModel`. */
  useThermalModel: boolean;
}

export interface Recipe {
  /** Ingredient weights in grams. */
  flour: number;
  /** Liquid water to weigh out — the hydration minus the ice. */
  water: number;
  /** Part of the hydration weighed as ice. */
  ice: number;
  /** water + ice, i.e. the full hydration. */
  totalWater: number;
  /** Share of the water weighed as ice, in percent of the water. */
  icePercent: number;
  salt: number;
  yeast: number;
  oil?: number;
  sugar?: number;
  totalDough: number;
  doughBallWeight: number;
  numberOfPizzas: number;
  yeastType: YeastType;
  /** Baker's percentage of the selected yeast type, relative to flour. */
  yeastPercent: number;
  coldFermentTime: number;
  coldFermentTemp: number;
  roomFermentTime: number;
  roomFermentTemp: number;
  /** Undefined when there is no cold phase for the split to sit around. */
  bulkFermentHours?: number;
  ballingPoint: BallingPoint;
  /**
   * Whether the cold phase is corrected for the dough's cooling-down time.
   * Off reproduces the original estimate, which keys only on wall-clock hours.
   */
  useThermalModel: boolean;
  /** Hours the fridge phase is worth once cooling time is accounted for. */
  effectiveColdTime: number;
}

type StylePreset = Omit<
  RecipeInput,
  'yeastType' | 'autoCalculateYeast' | 'yeastPercent' | 'ballingPoint' | 'useThermalModel'
>;

export const STYLE_PRESETS: Record<PizzaStyle, StylePreset> = {
  neapolitan: {
    numberOfPizzas: 4,
    doughBallWeight: 230,
    waterPercent: 65,
    icePercent: DEFAULT_ICE_PERCENT,
    saltPercent: 2.5,
    oilPercent: 0,
    sugarPercent: 0,
    coldFermentTime: 24,
    coldFermentTemp: 4,
    roomFermentTime: 5,
    roomFermentTemp: 20,
    bulkFermentHours: MIN_BULK_HOURS,
  },
  newyork: {
    numberOfPizzas: 4,
    doughBallWeight: 240,
    waterPercent: 62,
    icePercent: DEFAULT_ICE_PERCENT,
    saltPercent: 2,
    oilPercent: 2,
    sugarPercent: 1,
    coldFermentTime: 72,
    coldFermentTemp: 4,
    roomFermentTime: 5,
    roomFermentTemp: 20,
    bulkFermentHours: MIN_BULK_HOURS,
  },
  roman: {
    numberOfPizzas: 4,
    doughBallWeight: 150,
    waterPercent: 75,
    icePercent: DEFAULT_ICE_PERCENT,
    saltPercent: 2.5,
    oilPercent: 1.5,
    sugarPercent: 0,
    coldFermentTime: 48,
    coldFermentTemp: 4,
    roomFermentTime: 6,
    roomFermentTemp: 22,
    bulkFermentHours: MIN_BULK_HOURS,
  },
  custom: {
    numberOfPizzas: 4,
    doughBallWeight: 250,
    waterPercent: 65,
    icePercent: DEFAULT_ICE_PERCENT,
    saltPercent: 2.5,
    oilPercent: 0,
    sugarPercent: 0,
    coldFermentTime: 24,
    coldFermentTemp: 4,
    roomFermentTime: 5,
    roomFermentTemp: 20,
    bulkFermentHours: MIN_BULK_HOURS,
  },
};

/** Clamp every numeric input into its accepted range. */
const sanitize = (input: RecipeInput): RecipeInput => ({
  ...input,
  numberOfPizzas: Math.round(clampToRange(input.numberOfPizzas, LIMITS.numberOfPizzas)),
  doughBallWeight: clampToRange(input.doughBallWeight, LIMITS.doughBallWeight),
  waterPercent: clampToRange(input.waterPercent, LIMITS.waterPercent),
  icePercent: clampToRange(input.icePercent, LIMITS.icePercent),
  saltPercent: clampToRange(input.saltPercent, LIMITS.saltPercent),
  oilPercent: clampToRange(input.oilPercent, LIMITS.oilPercent),
  sugarPercent: clampToRange(input.sugarPercent, LIMITS.sugarPercent),
  yeastPercent: clampToRange(input.yeastPercent, LIMITS.yeastPercent),
  coldFermentTemp: clampToRange(input.coldFermentTemp, LIMITS.coldFermentTemp),
  coldFermentTime: clampToRange(input.coldFermentTime, LIMITS.coldFermentTime),
  roomFermentTemp: clampToRange(input.roomFermentTemp, LIMITS.roomFermentTemp),
  roomFermentTime: clampToRange(input.roomFermentTime, LIMITS.roomFermentTime),
  bulkFermentHours: clampToRange(
    input.bulkFermentHours,
    bulkHoursRange(clampToRange(input.roomFermentTime, LIMITS.roomFermentTime))
  ),
});

/**
 * The schedule as the fermentation model sees it.
 *
 * `coldMassG` is what makes the balling point matter: retarded in bulk the
 * whole batch cools as one piece, while shaped balls chill far faster and so
 * bank less fermentation on the way down. Left out entirely when the thermal
 * model is switched off, which falls back to the original wall-clock estimate.
 */
export const toSchedule = (input: RecipeInput): FermentationSchedule => ({
  coldTempC: input.coldFermentTemp,
  coldTimeHours: input.coldFermentTime,
  roomTempC: input.roomFermentTemp,
  roomTimeHours: input.roomFermentTime,
  coldMassG: input.useThermalModel
    ? input.ballingPoint === 'beforeCold'
      ? input.doughBallWeight
      : input.numberOfPizzas * input.doughBallWeight
    : undefined,
});

/** The yeast percentage the recipe will actually use. */
export const resolveYeastPercent = (input: RecipeInput): number => {
  const { autoCalculateYeast, yeastType, coldFermentTime, roomFermentTime } = input;

  if (!autoCalculateYeast) return input.yeastPercent;
  if (coldFermentTime <= 0 && roomFermentTime <= 0) return DEFAULT_YEAST_PERCENT[yeastType];

  return yeastPercentFor(yeastType, toSchedule(input));
};

/**
 * Turn baker's percentages into absolute weights.
 *
 * Flour is 100 % by definition, so the sum of all percentages maps the target
 * dough weight onto one "percentage point" of flour:
 *   `flour = totalDough / (100 + water% + salt% + yeast% + oil% + sugar%) * 100`
 */
export const calculateRecipe = (rawInput: RecipeInput): Recipe => {
  const input = sanitize(rawInput);
  const totalDough = input.numberOfPizzas * input.doughBallWeight;
  const yeastPercent = resolveYeastPercent(input);

  const percentTotal =
    100 + input.waterPercent + input.saltPercent + yeastPercent + input.oilPercent + input.sugarPercent;
  const perPercentPoint = totalDough / percentTotal;

  const totalWater = perPercentPoint * input.waterPercent;

  return {
    flour: perPercentPoint * 100,
    water: totalWater * (1 - input.icePercent / 100),
    ice: totalWater * (input.icePercent / 100),
    totalWater,
    salt: perPercentPoint * input.saltPercent,
    yeast: perPercentPoint * yeastPercent,
    oil: input.oilPercent > 0 ? perPercentPoint * input.oilPercent : undefined,
    sugar: input.sugarPercent > 0 ? perPercentPoint * input.sugarPercent : undefined,
    totalDough,
    doughBallWeight: input.doughBallWeight,
    numberOfPizzas: input.numberOfPizzas,
    yeastType: input.yeastType,
    yeastPercent,
    icePercent: input.icePercent,
    coldFermentTime: input.coldFermentTime,
    coldFermentTemp: input.coldFermentTemp,
    roomFermentTime: input.roomFermentTime,
    roomFermentTemp: input.roomFermentTemp,
    // Without a cold phase there is nothing to split around, so the schedule
    // falls back to the minimums and the instructions offer the surplus.
    bulkFermentHours: input.coldFermentTime > 0 ? input.bulkFermentHours : undefined,
    ballingPoint: input.ballingPoint,
    useThermalModel: input.useThermalModel,
    effectiveColdTime: effectiveColdTime(toSchedule(input)),
  };
};
