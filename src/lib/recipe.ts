import {
  DEFAULT_YEAST_PERCENT,
  MIN_BULK_HOURS,
  MIN_ROOM_HOURS,
  PREFERMENTS,
  YEAST_CONVERSION,
  bulkHoursRange,
  effectiveColdTime,
  isPrefermentMethod,
  minRoomHours,
  prefermentYeastPercent,
  roomMinimumsFor,
  yeastPercentFor,
  type FermentationSchedule,
  type Method,
  type PrefermentMethod,
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

/** Room-temperature time range, whose minimum depends on the method. */
export const roomTimeLimits = (method: Method): Range => ({
  min: minRoomHours(roomMinimumsFor(method)),
  max: LIMITS.roomFermentTime.max,
});

/**
 * Hand-entered yeast range. A preferment can leaven the final dough on its
 * own, so there the yeast added to the final dough may be zero.
 */
export const yeastPercentLimits = (method: Method): Range =>
  isPrefermentMethod(method) ? { min: 0, max: LIMITS.yeastPercent.max } : LIMITS.yeastPercent;

/**
 * Largest preferment share the total hydration allows: the preferment's water
 * cannot exceed the water of the whole recipe.
 */
export const prefermentShareLimits = (
  method: PrefermentMethod,
  waterPercent: number,
  prefermentHydration: number
): Range => {
  const { range } = PREFERMENTS[method].share;
  return { min: range.min, max: Math.min(range.max, (waterPercent / prefermentHydration) * 100) };
};

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
  method: Method;
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
  /** Preferment settings; ignored by the direct method. See `PrefermentProfile`. */
  prefermentShare: number;
  prefermentHydration: number;
  prefermentTime: number;
  prefermentTemp: number;
}

/** The preferment, weighed and mixed before the final dough. */
export interface Preferment {
  method: PrefermentMethod;
  flour: number;
  water: number;
  yeast: number;
  /** Baker's percentage of the selected yeast type, relative to the preferment's flour. */
  yeastPercent: number;
  /** Preferment flour in percent of the total flour. */
  share: number;
  hydration: number;
  timeHours: number;
  tempC: number;
}

export interface Recipe {
  method: Method;
  /**
   * Ingredient weights in grams, for the final mix. With a preferment the
   * flour and water are what is left after it; salt, oil and sugar all go in
   * here regardless.
   */
  flour: number;
  /** Liquid water to weigh out for the final mix — its share of the hydration minus the ice. */
  water: number;
  /** Part of the final mix's water weighed as ice. */
  ice: number;
  /** water + ice, i.e. the water added in the final mix. */
  totalWater: number;
  /** All the flour in the recipe, preferment included. */
  totalFlour: number;
  preferment?: Preferment;
  /**
   * Set when the ripe preferment alone brings more leavening than the final
   * dough's schedule needs, so no yeast is added and the dough will still be
   * ready early. `suggestedRoomHours` is the room time that would match it,
   * undefined when even the shortest schedule is too long.
   */
  prefermentSurplus?: { suggestedRoomHours?: number };
  /** Share of the water weighed as ice, in percent of the water. */
  icePercent: number;
  salt: number;
  /** Yeast added in the final mix. */
  yeast: number;
  oil?: number;
  sugar?: number;
  totalDough: number;
  doughBallWeight: number;
  numberOfPizzas: number;
  yeastType: YeastType;
  /** Baker's percentage of the final mix's yeast, relative to the total flour. */
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
  | 'method'
  | 'yeastType'
  | 'autoCalculateYeast'
  | 'yeastPercent'
  | 'ballingPoint'
  | 'useThermalModel'
  | 'prefermentShare'
  | 'prefermentHydration'
  | 'prefermentTime'
  | 'prefermentTemp'
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

/** A method's preferment settings at their defaults; the poolish's for `direct`, which ignores them. */
export const prefermentDefaults = (
  method: Method
): Pick<RecipeInput, 'prefermentShare' | 'prefermentHydration' | 'prefermentTime' | 'prefermentTemp'> => {
  const profile = PREFERMENTS[isPrefermentMethod(method) ? method : 'poolish'];
  return {
    prefermentShare: profile.share.default,
    prefermentHydration: profile.hydration.default,
    prefermentTime: profile.time.default,
    prefermentTemp: profile.temperature.default,
  };
};

/** What the calculator opens with on a method's page, and what that page is prerendered with. */
export const defaultInputFor = (method: Method): RecipeInput => ({
  ...STYLE_PRESETS.neapolitan,
  method,
  yeastType: 'fresh',
  autoCalculateYeast: true,
  yeastPercent: 0.5,
  ballingPoint: 'afterCold',
  useThermalModel: true,
  ...prefermentDefaults(method),
});

export const DEFAULT_INPUT: RecipeInput = defaultInputFor('direct');

/** Clamp every numeric input into its accepted range. */
const sanitize = (input: RecipeInput): RecipeInput => {
  const { method } = input;
  const roomFermentTime = clampToRange(input.roomFermentTime, roomTimeLimits(method));
  const waterPercent = clampToRange(input.waterPercent, LIMITS.waterPercent);

  const clamped: RecipeInput = {
    ...input,
    numberOfPizzas: Math.round(clampToRange(input.numberOfPizzas, LIMITS.numberOfPizzas)),
    doughBallWeight: clampToRange(input.doughBallWeight, LIMITS.doughBallWeight),
    waterPercent,
    icePercent: clampToRange(input.icePercent, LIMITS.icePercent),
    saltPercent: clampToRange(input.saltPercent, LIMITS.saltPercent),
    oilPercent: clampToRange(input.oilPercent, LIMITS.oilPercent),
    sugarPercent: clampToRange(input.sugarPercent, LIMITS.sugarPercent),
    yeastPercent: clampToRange(input.yeastPercent, yeastPercentLimits(method)),
    coldFermentTemp: clampToRange(input.coldFermentTemp, LIMITS.coldFermentTemp),
    coldFermentTime: clampToRange(input.coldFermentTime, LIMITS.coldFermentTime),
    roomFermentTemp: clampToRange(input.roomFermentTemp, LIMITS.roomFermentTemp),
    roomFermentTime,
    bulkFermentHours: clampToRange(
      input.bulkFermentHours,
      bulkHoursRange(roomFermentTime, roomMinimumsFor(method))
    ),
  };

  if (!isPrefermentMethod(method)) return clamped;

  const profile = PREFERMENTS[method];
  const prefermentHydration = clampToRange(input.prefermentHydration, profile.hydration.range);
  return {
    ...clamped,
    prefermentHydration,
    prefermentShare: clampToRange(
      input.prefermentShare,
      prefermentShareLimits(method, waterPercent, prefermentHydration)
    ),
    prefermentTime: clampToRange(input.prefermentTime, profile.time.range),
    prefermentTemp: clampToRange(input.prefermentTemp, profile.temperature.range),
  };
};

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

/**
 * Fresh yeast, in percent of the total flour, that the ripe preferment brings
 * into the final dough. Zero for the direct method.
 */
const prefermentLeavening = (input: RecipeInput): number =>
  isPrefermentMethod(input.method)
    ? (input.prefermentShare / 100) * PREFERMENTS[input.method].ripeYeastEquivalent
    : 0;

/** Fresh yeast, in percent of the total flour, the final dough's schedule asks for in all. */
const scheduleDemand = (input: RecipeInput): number =>
  yeastPercentFor('fresh', toSchedule(input));

/**
 * The yeast percentage the final mix will actually use, of the selected type
 * and relative to the total flour: whatever the schedule asks for beyond what
 * a preferment already brings.
 */
export const resolveYeastPercent = (input: RecipeInput): number => {
  const { autoCalculateYeast, yeastType, coldFermentTime, roomFermentTime } = input;

  if (!autoCalculateYeast) return input.yeastPercent;
  if (coldFermentTime <= 0 && roomFermentTime <= 0) return DEFAULT_YEAST_PERCENT[yeastType];

  const freshPercent = Math.max(0, scheduleDemand(input) - prefermentLeavening(input));
  return freshPercent * YEAST_CONVERSION[yeastType];
};

/** How far past the schedule's demand a preferment may go before it is flagged. */
const SURPLUS_TOLERANCE = 1.15;

/**
 * When the preferment alone outpaces the schedule, the room-temperature time
 * that would match it, found by bisection — demand falls monotonically as the
 * room time grows. Undefined result means even the shortest schedule is too long.
 */
const prefermentSurplus = (input: RecipeInput): Recipe['prefermentSurplus'] => {
  if (!input.autoCalculateYeast) return undefined;

  const supply = prefermentLeavening(input);
  if (supply <= scheduleDemand(input) * SURPLUS_TOLERANCE) return undefined;

  const demandAt = (roomFermentTime: number) => scheduleDemand({ ...input, roomFermentTime });
  let { min: low } = roomTimeLimits(input.method);
  let high = input.roomFermentTime;
  if (demandAt(low) <= supply) return { suggestedRoomHours: undefined };

  for (let step = 0; step < 30; step++) {
    const middle = (low + high) / 2;
    if (demandAt(middle) > supply) low = middle;
    else high = middle;
  }
  return { suggestedRoomHours: Math.round(high * 2) / 2 };
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

  const prefermentMethod = isPrefermentMethod(input.method) ? input.method : undefined;
  const prefermentYeast = prefermentMethod
    ? prefermentYeastPercent(prefermentMethod, input.yeastType, input.prefermentTemp, input.prefermentTime)
    : 0;
  // The preferment's yeast, as a share of the total flour.
  const prefermentYeastOfTotal = prefermentMethod ? (input.prefermentShare / 100) * prefermentYeast : 0;

  const percentTotal =
    100 +
    input.waterPercent +
    input.saltPercent +
    yeastPercent +
    prefermentYeastOfTotal +
    input.oilPercent +
    input.sugarPercent;
  const perPercentPoint = totalDough / percentTotal;

  const totalFlour = perPercentPoint * 100;
  const preferment: Preferment | undefined = prefermentMethod && {
    method: prefermentMethod,
    flour: totalFlour * (input.prefermentShare / 100),
    water: totalFlour * (input.prefermentShare / 100) * (input.prefermentHydration / 100),
    yeast: perPercentPoint * prefermentYeastOfTotal,
    yeastPercent: prefermentYeast,
    share: input.prefermentShare,
    hydration: input.prefermentHydration,
    timeHours: input.prefermentTime,
    tempC: input.prefermentTemp,
  };

  // Water still to add in the final mix; the ice is a share of that.
  const totalWater = perPercentPoint * input.waterPercent - (preferment?.water ?? 0);

  return {
    method: input.method,
    flour: totalFlour - (preferment?.flour ?? 0),
    water: totalWater * (1 - input.icePercent / 100),
    ice: totalWater * (input.icePercent / 100),
    totalWater,
    totalFlour,
    preferment,
    prefermentSurplus: prefermentMethod ? prefermentSurplus(input) : undefined,
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
