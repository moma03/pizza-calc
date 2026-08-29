import { useTranslation } from 'react-i18next';
import { ChefHat, Clock, Droplets, Flame, Scale, Snowflake, type LucideIcon } from 'lucide-react';
import { splitRoomFermentation } from '../lib/fermentation';
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
  amount: string;
  icon: LucideIcon;
  color: string;
}

export function RecipeDisplay({ recipe, unitSystem }: RecipeDisplayProps) {
  const { t } = useTranslation();

  const weight = (grams: number, decimals = 0) =>
    formatQuantity(grams, 'weight', unitSystem, decimals);
  const temperature = (celsius: number) => formatQuantity(celsius, 'temperature', unitSystem);

  const ingredients: IngredientRow[] = [
    { key: 'flour', amount: weight(recipe.flour), icon: ChefHat, color: 'text-amber-600 dark:text-amber-400' },
    { key: 'water', amount: weight(recipe.water), icon: Droplets, color: 'text-blue-600 dark:text-blue-400' },
    { key: 'salt', amount: weight(recipe.salt, 1), icon: Scale, color: 'text-gray-600 dark:text-gray-300' },
    { key: 'yeast', amount: weight(recipe.yeast, 2), icon: Flame, color: 'text-orange-600 dark:text-orange-400' },
  ];

  if (recipe.icePercent > 0) {
    ingredients.splice(2, 0, {
      key: 'ice',
      amount: weight(recipe.ice),
      icon: Snowflake,
      color: 'text-cyan-600 dark:text-cyan-400',
    });
  }
  if (recipe.oil !== undefined) {
    ingredients.push({
      key: 'oil',
      amount: weight(recipe.oil, 1),
      icon: Droplets,
      color: 'text-yellow-600 dark:text-yellow-400',
    });
  }
  if (recipe.sugar !== undefined) {
    ingredients.push({
      key: 'sugar',
      amount: weight(recipe.sugar, 1),
      icon: Scale,
      color: 'text-pink-600 dark:text-pink-400',
    });
  }

  const totalFermentTime = recipe.coldFermentTime + recipe.roomFermentTime;
  // With a cold phase the split is chosen on the slider and accounts for the
  // whole room time; without one both phases sit at their minimum and the
  // surplus is offered at either end, since it can be spent on either.
  const { bulkHours, ballProofHours, extraHours } = splitRoomFermentation(
    recipe.roomFermentTime,
    recipe.bulkFermentHours
  );

  // Shown in the order the dough actually goes through them.
  const timeline: { key: string; hours: number; tone: 'room' | 'cold' }[] =
    recipe.coldFermentTime > 0
      ? [
          { key: 'bulk', hours: bulkHours, tone: 'room' },
          { key: 'cold', hours: recipe.coldFermentTime, tone: 'cold' },
          { key: 'proof', hours: ballProofHours, tone: 'room' },
        ]
      : [{ key: 'room', hours: recipe.roomFermentTime, tone: 'room' }];
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
    t('results.steps.knead'),
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

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-xl transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t('results.title')}</h2>

      <div className="mb-8 space-y-4">
        {ingredients.map(({ key, amount, icon: Icon, color }) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4 transition hover:border-orange-200 dark:border-gray-600 dark:from-gray-700 dark:to-gray-600 dark:hover:border-orange-400"
          >
            <div className="flex items-center gap-4">
              <div className={`rounded-lg bg-gray-50 p-3 dark:bg-gray-600 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {t(`results.ingredients.${key}`)}
              </span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{amount}</span>
          </div>
        ))}
      </div>

      {recipe.icePercent > 0 && (
      <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
        {t('results.iceNote', {
          percent: round(recipe.icePercent, 1),
          total: weight(recipe.totalWater),
        })}
      </p>
      )}

      <p className="mb-6 text-xs text-gray-500 dark:text-gray-400">
        {t('results.yeastNote', {
          percent: round(recipe.yeastPercent, 3),
          yeast: t(`calculator.yeastTypes.${recipe.yeastType}.label`),
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

        {totalFermentTime > 0 && (
          <div className="rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 dark:border-purple-800 dark:from-purple-900/20 dark:to-indigo-900/20">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {t('results.totalFermentationTime')}
                </span>
              </div>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatHours(totalFermentTime)} h
              </span>
            </div>

            <div className="flex h-8 overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
              {timeline.map(({ key, hours, tone }) => {
                const share = (hours / timelineTotal) * 100;
                return (
                  <div
                    key={key}
                    title={`${t(`results.phases.${key}`)}: ${formatHours(hours)} h`}
                    className={`flex items-center justify-center overflow-hidden text-xs font-semibold text-white transition-all ${
                      tone === 'cold'
                        ? 'bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600'
                        : 'bg-gradient-to-r from-orange-400 to-orange-500 dark:from-orange-500 dark:to-orange-600'
                    }`}
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
              {timeline.map(({ key, hours, tone }) => (
                <div key={key} className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 shrink-0 rounded ${
                      tone === 'cold'
                        ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                        : 'bg-gradient-to-r from-orange-400 to-orange-500'
                    }`}
                  />
                  <span className="text-gray-600 dark:text-gray-300">
                    {t(`results.phases.${key}`)} · {formatHours(hours)} h ·{' '}
                    {temperature(tone === 'cold' ? recipe.coldFermentTemp : recipe.roomFermentTemp)}
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
