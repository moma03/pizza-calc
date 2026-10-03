import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ChefHat,
  Clock,
  Droplets,
  Flame,
  FlaskConical,
  Scale,
  Snowflake,
  type LucideIcon,
} from 'lucide-react';
import { SOURDOUGH, roomMinimumsFor, splitRoomFermentation } from '../lib/fermentation';
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

interface IngredientRow {
  key: string;
  label: string;
  amount: string;
  icon: LucideIcon;
  color: string;
}

type Tone = 'preferment' | 'room' | 'cold';

const TONE_CLASSES: Record<Tone, string> = {
  preferment:
    'bg-gradient-to-r from-amber-300 to-amber-400 dark:from-amber-500 dark:to-amber-600',
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
  const { t } = useTranslation();
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

  // Shown in the order the dough actually goes through them.
  const timeline: { key: string; label: string; hours: number; tone: Tone; tempC: number }[] = [
    ...(preferment
      ? [{ key: 'preferment', label: methodText('ingredient'), hours: preferment.timeHours, tone: 'preferment' as const, tempC: preferment.tempC }]
      : []),
    ...(starter
      ? [{ key: 'preferment', label: methodText('ingredient'), hours: starter.feedHours, tone: 'preferment' as const, tempC: starter.feedTempC }]
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

  const steps = [
    starter &&
      methodText('step', {
        hours: formatHours(starter.feedHours),
        temp: temperature(starter.feedTempC),
        seed: weight(starter.feed.seed),
        flour: weight(starter.feed.flour),
        water: weight(starter.feed.water),
      }),
    preferment &&
      methodText('step', {
        hours: formatHours(preferment.timeHours),
        temp: temperature(preferment.tempC),
        flour: weight(preferment.flour),
        water: weight(preferment.water),
        yeast: weight(preferment.yeast, 2),
      }),
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
  ].filter((step): step is string => typeof step === 'string');

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
              temp: temperature(preferment.tempC),
            })}
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
        <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          {steps.map((step, index) => (
            <li key={index} className="flex gap-2">
              <span className="font-semibold text-orange-600 dark:text-orange-400">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
