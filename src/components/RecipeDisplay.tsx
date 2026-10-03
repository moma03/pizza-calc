import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  CalendarClock,
  ChefHat,
  Clock,
  Droplets,
  Flame,
  FlaskConical,
  Scale,
  Snowflake,
  type LucideIcon,
} from 'lucide-react';
import { SOURDOUGH, roomMinimumsFor, splitRoomFermentation, startsCold } from '../lib/fermentation';
import {
  formatHours,
  formatQuantity,
  formatTemperatureRange,
  type UnitSystem,
} from '../lib/units';
import { round } from '../lib/math';
import { BAKE_TEMPS, type Recipe } from '../lib/recipe';

interface RecipeDisplayProps {
  recipe: Recipe;
  unitSystem: UnitSystem;
}

interface Phase {
  key: string;
  label: string;
  hours: number;
  tone: Tone;
  tempC: number;
}

interface IngredientRow {
  key: string;
  label: string;
  amount: string;
  icon: LucideIcon;
  color: string;
}

type Tone = 'preferment' | 'prefermentCold' | 'room' | 'cold';

const TONE_CLASSES: Record<Tone, string> = {
  preferment:
    'bg-gradient-to-r from-amber-300 to-amber-400 dark:from-amber-500 dark:to-amber-600',
  prefermentCold:
    'bg-gradient-to-r from-sky-300 to-sky-400 dark:from-sky-500 dark:to-sky-600',
  room: 'bg-gradient-to-r from-orange-400 to-orange-500 dark:from-orange-500 dark:to-orange-600',
  cold: 'bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600',
};

function IngredientList({ rows, compact = false }: { rows: IngredientRow[]; compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      {rows.map(({ key, label, amount, icon: Icon, color }) => (
        <div
          key={key}
          className={`flex items-center justify-between rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white transition hover:border-orange-200 dark:border-gray-600 dark:from-gray-700 dark:to-gray-600 dark:hover:border-orange-400 ${
            compact ? 'p-3' : 'p-4'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`rounded-lg bg-gray-50 dark:bg-gray-600 ${compact ? 'p-2' : 'p-3'} ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="font-semibold text-gray-700 dark:text-gray-200">{label}</span>
          </div>
          <span className={`font-bold text-gray-900 dark:text-white ${compact ? 'text-xl' : 'text-2xl'}`}>
            {amount}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RecipeDisplay({ recipe, unitSystem }: RecipeDisplayProps) {
  const { t, i18n } = useTranslation();
  const { preferment, starter } = recipe;
  /** Whatever is built ahead of the final dough: a preferment or the fed starter. */
  const hasStage = preferment !== undefined || starter !== undefined;

  const weight = (grams: number, decimals = 0) =>
    formatQuantity(grams, 'weight', unitSystem, decimals);
  const temperature = (celsius: number) => formatQuantity(celsius, 'temperature', unitSystem);
  const ingredient = (key: string) => t(`results.ingredients.${key}`);
  const methodText = (key: string, options?: Record<string, unknown>) =>
    t(`methods.${recipe.method}.${key}`, options ?? {});

  const stageRows: IngredientRow[] = starter
    ? [
        { key: 'seed', label: t('results.starter.seed'), amount: weight(starter.feed.seed), icon: FlaskConical, color: 'text-amber-600 dark:text-amber-400' },
        { key: 'flour', label: ingredient('flour'), amount: weight(starter.feed.flour), icon: ChefHat, color: 'text-amber-600 dark:text-amber-400' },
        { key: 'water', label: ingredient('water'), amount: weight(starter.feed.water), icon: Droplets, color: 'text-blue-600 dark:text-blue-400' },
      ]
    : preferment
    ? [
        { key: 'flour', label: ingredient('flour'), amount: weight(preferment.flour), icon: ChefHat, color: 'text-amber-600 dark:text-amber-400' },
        { key: 'water', label: ingredient('water'), amount: weight(preferment.water), icon: Droplets, color: 'text-blue-600 dark:text-blue-400' },
        { key: 'yeast', label: ingredient('yeast'), amount: weight(preferment.yeast, 2), icon: Flame, color: 'text-orange-600 dark:text-orange-400' },
      ]
    : [];

  const ingredients: IngredientRow[] = [
    { key: 'flour', label: ingredient('flour'), amount: weight(recipe.flour), icon: ChefHat, color: 'text-amber-600 dark:text-amber-400' },
    { key: 'water', label: ingredient('water'), amount: weight(recipe.water), icon: Droplets, color: 'text-blue-600 dark:text-blue-400' },
    { key: 'salt', label: ingredient('salt'), amount: weight(recipe.salt, 1), icon: Scale, color: 'text-gray-600 dark:text-gray-300' },
  ];

  // With a preferment the final mix may need no yeast at all; sourdough has none.
  if (!starter && (!preferment || recipe.yeast > 0)) {
    ingredients.push({ key: 'yeast', label: ingredient('yeast'), amount: weight(recipe.yeast, 2), icon: Flame, color: 'text-orange-600 dark:text-orange-400' });
  }
  const stageWeight = starter
    ? starter.weight
    : preferment && preferment.flour + preferment.water + preferment.yeast;
  if (stageWeight !== undefined) {
    ingredients.unshift({
      key: 'preferment',
      label: methodText('ingredient'),
      amount: weight(stageWeight),
      icon: FlaskConical,
      color: 'text-amber-600 dark:text-amber-400',
    });
  }
  if (recipe.icePercent > 0) {
    ingredients.splice(ingredients.findIndex(({ key }) => key === 'water') + 1, 0, {
      key: 'ice',
      label: ingredient('ice'),
      amount: weight(recipe.ice),
      icon: Snowflake,
      color: 'text-cyan-600 dark:text-cyan-400',
    });
  }
  if (recipe.oil !== undefined) {
    ingredients.push({ key: 'oil', label: ingredient('oil'), amount: weight(recipe.oil, 1), icon: Droplets, color: 'text-yellow-600 dark:text-yellow-400' });
  }
  if (recipe.sugar !== undefined) {
    ingredients.push({ key: 'sugar', label: ingredient('sugar'), amount: weight(recipe.sugar, 1), icon: Scale, color: 'text-pink-600 dark:text-pink-400' });
  }

  // With a cold phase the split is chosen on the slider and accounts for the
  // whole room time; without one both phases sit at their minimum and the
  // surplus is offered at either end, since it can be spent on either.
  const { bulkHours, ballProofHours, extraHours } = splitRoomFermentation(
    recipe.roomFermentTime,
    recipe.bulkFermentHours,
    roomMinimumsFor(recipe.method)
  );

  // A preferment's own room and fridge phases, in the order it goes through them.
  const stageName = methodText('ingredient');
  let prefermentPhases: Phase[] = [];
  if (preferment) {
    const { schedule } = preferment;
    const room: Phase = { key: 'prefermentRoom', label: stageName, hours: schedule.roomHours, tone: 'preferment', tempC: schedule.roomTempC };
    const cold: Phase = { key: 'prefermentCold', label: t('results.phases.stageCold', { name: stageName }), hours: schedule.coldHours, tone: 'prefermentCold', tempC: schedule.coldTempC };
    prefermentPhases = (startsCold(schedule) ? [cold, room] : [room, cold]).filter(({ hours }) => hours > 0);
  }

  /** "17 h at 18 °C" or "24 h in the fridge at 4 °C, then 24 h at 18 °C". */
  const scheduleText = prefermentPhases
    .map(({ tone, hours, tempC }) =>
      t(tone === 'prefermentCold' ? 'results.schedule.cold' : 'results.schedule.room', {
        hours: formatHours(hours),
        temp: temperature(tempC),
      })
    )
    .join(t('results.schedule.then'));

  // Shown in the order the dough actually goes through them.
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
  const timelineTotal = timeline.reduce((sum, phase) => sum + phase.hours, 0);

  // Only worth surfacing when the correction actually moves the number.
  const showEffectiveCold =
    recipe.useThermalModel &&
    recipe.coldFermentTime > 0 &&
    Math.abs(recipe.effectiveColdTime / recipe.coldFermentTime - 1) >= 0.02;

  const extraNote =
    extraHours > 0
      ? ` ${t('results.steps.extraNote', {
          extra: formatHours(extraHours),
          total: formatHours(recipe.roomFermentTime),
        })}`
      : '';

  const coldStep =
    recipe.coldFermentTime > 0 &&
    t('results.steps.cold', {
      temp: temperature(recipe.coldFermentTemp),
      hours: formatHours(recipe.coldFermentTime),
      what: t(`results.steps.coldSubject.${recipe.ballingPoint}`),
    });

  const ballStep = t('results.steps.ball', {
    portions: recipe.numberOfPizzas,
    weight: weight(recipe.doughBallWeight),
  });

  // Balling either side of the fridge is a real choice, so the steps follow it.
  const middle =
    recipe.ballingPoint === 'beforeCold' ? [ballStep, coldStep] : [coldStep, ballStep];

  // Hours from the first step at which each later one starts, for the planner.
  const stageHours = preferment?.timeHours ?? starter?.feedHours ?? 0;
  const coldStart = stageHours + bulkHours;
  const proofStart = coldStart + recipe.coldFermentTime;
  const middleOffsets =
    recipe.ballingPoint === 'beforeCold' ? [coldStart, coldStart] : [coldStart, proofStart];

  const stepTexts = [
    starter &&
      methodText('step', {
        hours: formatHours(starter.feedHours),
        temp: temperature(starter.feedTempC),
        seed: weight(starter.feed.seed),
        flour: weight(starter.feed.flour),
        water: weight(starter.feed.water),
      }),
    preferment &&
      [
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
        t('results.steps.ripen', { schedule: scheduleText }),
        methodText('ripe'),
      ].join(' '),
    hasStage
      ? methodText('knead', { yeast: recipe.yeast > 0 ? t('results.steps.andYeast') : '' })
      : t('results.steps.knead'),
    t('results.steps.bulk', {
      temp: temperature(recipe.roomFermentTemp),
      hours: formatHours(bulkHours),
      extra: extraNote,
    }),
    ...middle,
    t('results.steps.proof', {
      temp: temperature(recipe.roomFermentTemp),
      hours: formatHours(ballProofHours),
      extra: extraNote,
    }),
    t('results.steps.bake', {
      pizzaOven: formatTemperatureRange(BAKE_TEMPS.pizzaOven.min, BAKE_TEMPS.pizzaOven.max, unitSystem),
      homeOven: formatTemperatureRange(BAKE_TEMPS.homeOven.min, BAKE_TEMPS.homeOven.max, unitSystem),
    }),
  ];
  const stepOffsets = [
    starter ? 0 : undefined,
    preferment ? 0 : undefined,
    stageHours, // mix the final dough
    stageHours, // bulk
    ...middleOffsets,
    proofStart,
    proofStart + ballProofHours + extraHours, // bake
  ];
  const steps = stepTexts.flatMap((text, index) =>
    typeof text === 'string' ? [{ text, at: stepOffsets[index] ?? 0 }] : []
  );

  // Optional planner: with a bake time set, every step gets its clock time.
  const [bakeAt, setBakeAt] = useState('');
  const bakeTime = bakeAt ? new Date(bakeAt) : undefined;
  const planTotal = proofStart + ballProofHours + extraHours;
  const clockFormat = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const clockAt = (offsetHours: number) =>
    bakeTime && !Number.isNaN(bakeTime.getTime())
      ? clockFormat.format(new Date(bakeTime.getTime() - (planTotal - offsetHours) * 3_600_000))
      : undefined;

  const surplus = recipe.prefermentSurplus;
  const yeastLabel = t(`calculator.yeastTypes.${recipe.yeastType}.label`);

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-xl transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t('results.title')}</h2>

      {preferment && (
        <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            <FlaskConical className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            {t('results.prefermentHeading', { name: methodText('label') })}
          </h3>
          <p className="mb-4 mt-1 text-sm text-gray-600 dark:text-gray-300">
            {t('results.prefermentTiming', {
              hours: formatHours(preferment.timeHours),
              schedule: scheduleText,
            })}
            {preferment.schedule.coldHours > 0 &&
              ` ${t('results.prefermentEquivalent', {
                hours: formatHours(preferment.equivalentRoomHours),
                temp: temperature(preferment.schedule.roomTempC),
              })}`}
          </p>
          <IngredientList rows={stageRows} compact />
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {methodText('yeastNote', {
              percent: round(preferment.yeastPercent, 3),
              yeast: yeastLabel,
            })}
          </p>
        </section>
      )}

      {starter && (
        <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            <FlaskConical className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            {t('results.starter.heading')}
          </h3>
          <p className="mb-4 mt-1 text-sm text-gray-600 dark:text-gray-300">
            {t('results.starter.timing', {
              hours: formatHours(starter.feedHours),
              temp: temperature(starter.feedTempC),
              ratio: starter.feed.ratio,
            })}
          </p>
          <IngredientList rows={stageRows} compact />
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {t('results.starter.keepNote', { keep: weight(SOURDOUGH.keepGrams) })}
          </p>
          {starter.feed.mismatch && (
            <p className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-200">
              {t(`results.starter.${starter.feed.mismatch}`, {
                hours: formatHours(starter.feedHours),
                peak: formatHours(starter.feed.peakHours),
              })}
            </p>
          )}
        </section>
      )}

      {hasStage && (
        <h3 className="mb-4 font-bold text-gray-900 dark:text-white">{t('results.finalDough')}</h3>
      )}

      <div className="mb-8">
        <IngredientList rows={ingredients} />
      </div>

      {starter?.limited && (
        <div className="mb-6 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="leading-relaxed">
            {t(`results.starter.limited.${starter.limited}`, { percent: round(starter.percent, 1) })}
          </p>
        </div>
      )}

      {surplus && (
        <div className="mb-6 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="leading-relaxed">
            {surplus.suggestedRoomHours !== undefined
              ? methodText('surplus', {
                  hours: formatHours(surplus.suggestedRoomHours),
                  planned: formatHours(recipe.roomFermentTime),
                })
              : methodText('surplusTooShort')}
          </p>
        </div>
      )}

      {recipe.icePercent > 0 && (
        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          {t(hasStage ? 'results.iceNoteFinal' : 'results.iceNote', {
            percent: round(recipe.icePercent, 1),
            total: weight(recipe.totalWater),
          })}
        </p>
      )}

      <p className="mb-6 text-xs text-gray-500 dark:text-gray-400">
        {starter
          ? t('results.starter.note', {
              percent: round(starter.percent, 1),
              hydration: round(starter.hydration, 0),
            })
          : preferment && recipe.yeast <= 0
          ? methodText('noExtraYeast')
          : t(preferment ? 'results.yeastNoteFinal' : 'results.yeastNote', {
              percent: round(recipe.yeastPercent, 3),
              yeast: yeastLabel,
            })}
      </p>

      <div className="space-y-4 border-t border-gray-200 pt-6 dark:border-gray-600">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col rounded-xl bg-orange-50 p-4 dark:bg-orange-900/20">
            <span className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
              {t('results.totalDough')}
            </span>
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {weight(recipe.totalDough)}
            </span>
          </div>
          <div className="flex flex-col rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
            <span className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-300">
              {t('results.perPizza')}
            </span>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {weight(recipe.doughBallWeight)}
            </span>
          </div>
        </div>

        {timelineTotal > 0 && (
          <div className="rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 dark:border-purple-800 dark:from-purple-900/20 dark:to-indigo-900/20">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {t('results.totalFermentationTime')}
                </span>
              </div>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatHours(timelineTotal)} h
              </span>
            </div>

            <div className="flex h-8 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
              {timeline.map(({ key, label, hours, tone }) => {
                const share = (hours / timelineTotal) * 100;
                return (
                  <div
                    key={key}
                    title={`${label}: ${formatHours(hours)} h`}
                    className={`flex items-center justify-center overflow-hidden text-xs font-semibold text-white transition-all ${TONE_CLASSES[tone]}`}
                    style={{ width: `${share}%` }}
                  >
                    {share >= 9 && <span className="px-2">{formatHours(hours)} h</span>}
                  </div>
                );
              })}
            </div>

            {showEffectiveCold && (
              <p className="mt-3 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                {t('results.effectiveCold', {
                  nominal: formatHours(recipe.coldFermentTime),
                  hours: formatHours(recipe.effectiveColdTime),
                  percent: Math.abs(Math.round((recipe.effectiveColdTime / recipe.coldFermentTime - 1) * 100)),
                  direction: t(
                    recipe.effectiveColdTime > recipe.coldFermentTime
                      ? 'results.effectiveColdMore'
                      : 'results.effectiveColdLess'
                  ),
                })}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {timeline.map(({ key, label, hours, tone, tempC }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`h-3 w-3 shrink-0 rounded ${TONE_CLASSES[tone]}`} />
                  <span className="text-gray-600 dark:text-gray-300">
                    {label} · {formatHours(hours)} h · {temperature(tempC)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-6 dark:border-orange-800 dark:from-orange-900/20 dark:to-amber-900/20">
        <h3 className="mb-3 font-bold text-gray-900 dark:text-white">{t('results.instructions')}</h3>
        <label className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <CalendarClock className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden="true" />
          <span className="font-medium">{t('results.planner.label')}</span>
          <input
            type="datetime-local"
            value={bakeAt}
            onChange={(event) => setBakeAt(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </label>
        {clockAt(0) && (
          <p className="mb-4 text-sm font-semibold text-orange-700 dark:text-orange-300">
            {t('results.planner.start', { time: clockAt(0) })}
          </p>
        )}
        <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          {steps.map(({ text, at }, index) => (
            <li key={index} className="flex gap-2">
              <span className="font-semibold text-orange-600 dark:text-orange-400">{index + 1}.</span>
              <span>
                {clockAt(at) && (
                  <span className="mr-1 font-semibold text-gray-900 dark:text-white">{clockAt(at)} ·</span>
                )}
                {text}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
