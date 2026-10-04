import type { TFunction } from 'i18next';
import { roomMinimumsFor, splitRoomFermentation, startsCold } from './lib/fermentation';
import { BAKE_TEMPS, type Recipe } from './lib/recipe';
import { formatHours, formatQuantity, formatTemperatureRange, type UnitSystem } from './lib/units';

export type Tone = 'preferment' | 'prefermentCold' | 'room' | 'cold';

export interface Phase {
  key: string;
  label: string;
  hours: number;
  tone: Tone;
  tempC: number;
}

export type StepKey = 'feed' | 'preferment' | 'knead' | 'bulk' | 'cold' | 'ball' | 'proof' | 'bake';

export interface Step {
  key: StepKey;
  /** Short name, for a calendar entry. */
  title: string;
  /** The full instruction. */
  text: string;
  /** Hours after the first step at which this one starts. */
  at: number;
}

export interface IngredientLine {
  key: string;
  label: string;
  amount: string;
}

export interface Plan {
  /** "Biga", "Poolish", "Starter"; empty for a direct dough. */
  stageName: string;
  /** What is weighed out ahead of the final dough: the preferment, or the starter feed. */
  stageIngredients: IngredientLine[];
  /** What goes into the final mix, in the order it is listed. */
  ingredients: IngredientLine[];
  /** "17 h at 18 °C" or "24 h in the fridge at 4 °C, then 24 h at 18 °C". */
  prefermentSchedule: string;
  /** Every phase end to end, in the order the dough goes through them. */
  timeline: Phase[];
  /** Hours from the first step to baking. */
  totalHours: number;
  steps: Step[];
}

/**
 * The recipe as something to follow: ingredient lines, the timeline, and the
 * steps with the hour each starts at. The page, the calendar export and the
 * printout all read from this, so they always say the same thing
 * (docs/calculation-pipeline.md §5).
 */
export const buildPlan = (recipe: Recipe, t: TFunction, unitSystem: UnitSystem): Plan => {
  const { preferment, starter } = recipe;
  const hasStage = preferment !== undefined || starter !== undefined;

  const weight = (grams: number, decimals = 0) => formatQuantity(grams, 'weight', unitSystem, decimals);
  const temperature = (celsius: number) => formatQuantity(celsius, 'temperature', unitSystem);
  const ingredient = (key: string) => t(`results.ingredients.${key}`);
  const methodText = (key: string, options?: Record<string, unknown>) =>
    t(`methods.${recipe.method}.${key}`, options ?? {});
  const stageName = hasStage ? methodText('ingredient') : '';

  const stageIngredients: IngredientLine[] = starter
    ? [
        { key: 'seed', label: t('results.starter.seed'), amount: weight(starter.feed.seed) },
        { key: 'flour', label: ingredient('flour'), amount: weight(starter.feed.flour) },
        { key: 'water', label: ingredient('water'), amount: weight(starter.feed.water) },
      ]
    : preferment
    ? [
        { key: 'flour', label: ingredient('flour'), amount: weight(preferment.flour) },
        { key: 'water', label: ingredient('water'), amount: weight(preferment.water) },
        { key: 'yeast', label: ingredient('yeast'), amount: weight(preferment.yeast, 2) },
      ]
    : [];

  const stageWeight = starter
    ? starter.weight
    : preferment && preferment.flour + preferment.water + preferment.yeast;
  const ingredients: IngredientLine[] = [
    ...(stageWeight !== undefined
      ? [{ key: 'preferment', label: stageName, amount: weight(stageWeight) }]
      : []),
    { key: 'flour', label: ingredient('flour'), amount: weight(recipe.flour) },
    { key: 'water', label: ingredient('water'), amount: weight(recipe.water) },
    ...(recipe.icePercent > 0 ? [{ key: 'ice', label: ingredient('ice'), amount: weight(recipe.ice) }] : []),
    { key: 'salt', label: ingredient('salt'), amount: weight(recipe.salt, 1) },
    // With a preferment the final mix may need no yeast at all; sourdough has none.
    ...(!starter && (!preferment || recipe.yeast > 0)
      ? [{ key: 'yeast', label: ingredient('yeast'), amount: weight(recipe.yeast, 2) }]
      : []),
    ...(recipe.oil !== undefined ? [{ key: 'oil', label: ingredient('oil'), amount: weight(recipe.oil, 1) }] : []),
    ...(recipe.sugar !== undefined
      ? [{ key: 'sugar', label: ingredient('sugar'), amount: weight(recipe.sugar, 1) }]
      : []),
  ];

  // With a cold phase the split is chosen on the slider and accounts for the
  // whole room time; without one both phases sit at their minimum and the
  // surplus is offered at either end, since it can be spent on either.
  const { bulkHours, ballProofHours, extraHours } = splitRoomFermentation(
    recipe.roomFermentTime,
    recipe.bulkFermentHours,
    roomMinimumsFor(recipe.method)
  );

  // A preferment's own room and fridge phases, in the order it goes through them.
  let prefermentPhases: Phase[] = [];
  if (preferment) {
    const { schedule } = preferment;
    const room: Phase = { key: 'prefermentRoom', label: stageName, hours: schedule.roomHours, tone: 'preferment', tempC: schedule.roomTempC };
    const cold: Phase = { key: 'prefermentCold', label: t('results.phases.stageCold', { name: stageName }), hours: schedule.coldHours, tone: 'prefermentCold', tempC: schedule.coldTempC };
    prefermentPhases = (startsCold(schedule) ? [cold, room] : [room, cold]).filter(({ hours }) => hours > 0);
  }

  const prefermentSchedule = prefermentPhases
    .map(({ tone, hours, tempC }) =>
      t(tone === 'prefermentCold' ? 'results.schedule.cold' : 'results.schedule.room', {
        hours: formatHours(hours),
        temp: temperature(tempC),
      })
    )
    .join(t('results.schedule.then'));

  const timeline: Phase[] = [
    ...prefermentPhases,
    ...(starter
      ? [{ key: 'starter', label: stageName, hours: starter.feedHours, tone: 'preferment' as const, tempC: starter.feedTempC }]
      : []),
    ...(recipe.coldFermentTime > 0
      ? [
          { key: 'bulk', label: t('results.phases.bulk'), hours: bulkHours, tone: 'room' as const, tempC: recipe.roomFermentTemp },
          { key: 'cold', label: t('results.phases.cold'), hours: recipe.coldFermentTime, tone: 'cold' as const, tempC: recipe.coldFermentTemp },
          { key: 'proof', label: t('results.phases.proof'), hours: ballProofHours, tone: 'room' as const, tempC: recipe.roomFermentTemp },
        ]
      : [{ key: 'room', label: t('results.phases.room'), hours: recipe.roomFermentTime, tone: 'room' as const, tempC: recipe.roomFermentTemp }]),
  ];

  const extraNote =
    extraHours > 0
      ? ` ${t('results.steps.extraNote', {
          extra: formatHours(extraHours),
          total: formatHours(recipe.roomFermentTime),
        })}`
      : '';

  // When each step starts, counted from the first.
  const stageHours = preferment?.timeHours ?? starter?.feedHours ?? 0;
  const coldStart = stageHours + bulkHours;
  const proofStart = coldStart + recipe.coldFermentTime;
  const totalHours = proofStart + ballProofHours + extraHours;

  const candidates: (Omit<Step, 'title'> | false | undefined)[] = [
    starter && {
      key: 'feed',
      at: 0,
      text: methodText('step', {
        hours: formatHours(starter.feedHours),
        temp: temperature(starter.feedTempC),
        seed: weight(starter.feed.seed),
        flour: weight(starter.feed.flour),
        water: weight(starter.feed.water),
      }),
    },
    preferment && {
      key: 'preferment',
      at: 0,
      text: [
        methodText('stepIntro', { hours: formatHours(preferment.timeHours) }),
        methodText('mix', {
          flour: weight(preferment.flour),
          water: weight(preferment.water),
          yeast: weight(preferment.yeast, 2),
          waterTemp:
            preferment.waterTempC === undefined
              ? ''
              : t('results.steps.waterAt', { temp: temperature(preferment.waterTempC) }),
        }),
        t('results.steps.ripen', { schedule: prefermentSchedule }),
        methodText('ripe'),
      ].join(' '),
    },
    {
      key: 'knead',
      at: stageHours,
      text: hasStage
        ? methodText('knead', { yeast: recipe.yeast > 0 ? t('results.steps.andYeast') : '' })
        : t('results.steps.knead'),
    },
    {
      key: 'bulk',
      at: stageHours,
      text: t('results.steps.bulk', {
        temp: temperature(recipe.roomFermentTemp),
        hours: formatHours(bulkHours),
        extra: extraNote,
      }),
    },
  ];

  const coldStep: Omit<Step, 'title'> | undefined =
    recipe.coldFermentTime > 0
      ? {
          key: 'cold',
          at: coldStart,
          text: t('results.steps.cold', {
            temp: temperature(recipe.coldFermentTemp),
            hours: formatHours(recipe.coldFermentTime),
            what: t(`results.steps.coldSubject.${recipe.ballingPoint}`),
          }),
        }
      : undefined;
  // Balling either side of the fridge is a real choice, so the steps follow it.
  const beforeCold = recipe.ballingPoint === 'beforeCold';
  const ballStep: Omit<Step, 'title'> = {
    key: 'ball',
    at: beforeCold ? coldStart : proofStart,
    text: t('results.steps.ball', {
      portions: recipe.numberOfPizzas,
      weight: weight(recipe.doughBallWeight),
    }),
  };
  candidates.push(...(beforeCold ? [ballStep, coldStep] : [coldStep, ballStep]));

  candidates.push(
    {
      key: 'proof',
      at: proofStart,
      text: t('results.steps.proof', {
        temp: temperature(recipe.roomFermentTemp),
        hours: formatHours(ballProofHours),
        extra: extraNote,
      }),
    },
    {
      key: 'bake',
      at: totalHours,
      text: t('results.steps.bake', {
        pizzaOven: formatTemperatureRange(BAKE_TEMPS.pizzaOven.min, BAKE_TEMPS.pizzaOven.max, unitSystem),
        homeOven: formatTemperatureRange(BAKE_TEMPS.homeOven.min, BAKE_TEMPS.homeOven.max, unitSystem),
      }),
    }
  );

  const steps = candidates
    .filter((step): step is Omit<Step, 'title'> => Boolean(step))
    .map((step) => ({
      ...step,
      title: t(`results.stepTitles.${step.key}`, {
        name: stageName,
        nameLower: stageName.toLowerCase(),
      }),
    }));

  return { stageName, stageIngredients, ingredients, prefermentSchedule, timeline, totalHours, steps };
};

/** When a step starts, given the bake time; undefined without a valid bake time. */
export const stepStart = (bakeAt: string, plan: Plan, at: number): Date | undefined => {
  if (!bakeAt) return undefined;
  const bake = new Date(bakeAt);
  if (Number.isNaN(bake.getTime())) return undefined;
  return new Date(bake.getTime() - (plan.totalHours - at) * 3_600_000);
};
