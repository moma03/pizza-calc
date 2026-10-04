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
import { ExportBar } from './ExportBar';
import { useSiteOrigin } from '../useSiteOrigin';
import { SOURDOUGH } from '../lib/fermentation';
import { formatHours, formatQuantity, type UnitSystem } from '../lib/units';
import { round } from '../lib/math';
import type { Recipe } from '../lib/recipe';
import { buildPlan, stepStart, type IngredientLine, type Tone } from '../plan';

interface RecipeDisplayProps {
  recipe: Recipe;
  unitSystem: UnitSystem;
  /** Planner bake time, `YYYY-MM-DDTHH:mm` local; empty when unset. */
  bakeAt: string;
  onBakeAtChange: (bakeAt: string) => void;
  /** Path and fragment of the link to this exact recipe. */
  sharePath: string;
}

const TONE_CLASSES: Record<Tone, string> = {
  preferment:
    'bg-gradient-to-r from-amber-300 to-amber-400 dark:from-amber-500 dark:to-amber-600',
  prefermentCold:
    'bg-gradient-to-r from-sky-300 to-sky-400 dark:from-sky-500 dark:to-sky-600',
  room: 'bg-gradient-to-r from-orange-400 to-orange-500 dark:from-orange-500 dark:to-orange-600',
  cold: 'bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600',
};

/** Icon and colour per ingredient line. */
const INGREDIENT_STYLE: Record<string, { icon: LucideIcon; color: string }> = {
  preferment: { icon: FlaskConical, color: 'text-amber-600 dark:text-amber-400' },
  seed: { icon: FlaskConical, color: 'text-amber-600 dark:text-amber-400' },
  flour: { icon: ChefHat, color: 'text-amber-600 dark:text-amber-400' },
  water: { icon: Droplets, color: 'text-blue-600 dark:text-blue-400' },
  ice: { icon: Snowflake, color: 'text-cyan-600 dark:text-cyan-400' },
  salt: { icon: Scale, color: 'text-gray-600 dark:text-gray-300' },
  yeast: { icon: Flame, color: 'text-orange-600 dark:text-orange-400' },
  oil: { icon: Droplets, color: 'text-yellow-600 dark:text-yellow-400' },
  sugar: { icon: Scale, color: 'text-pink-600 dark:text-pink-400' },
};

function IngredientList({ rows, compact = false }: { rows: IngredientLine[]; compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-2' : 'space-y-4 print:space-y-1'}>
      {rows.map(({ key, label, amount }) => {
        const { icon: Icon, color } = INGREDIENT_STYLE[key] ?? INGREDIENT_STYLE.flour;
        return (
          <div
            key={key}
            className={`flex items-center justify-between rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white transition hover:border-orange-200 dark:border-gray-600 dark:from-gray-700 dark:to-gray-600 dark:hover:border-orange-400 print:rounded-none print:border-x-0 print:border-t-0 print:py-1 ${
              compact ? 'p-3' : 'p-4'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`rounded-lg bg-gray-50 dark:bg-gray-600 print:hidden ${compact ? 'p-2' : 'p-3'} ${color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-200">{label}</span>
            </div>
            <span
              className={`font-bold text-gray-900 dark:text-white print:text-base ${compact ? 'text-xl' : 'text-2xl'}`}
            >
              {amount}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function RecipeDisplay({
  recipe,
  unitSystem,
  bakeAt,
  onBakeAtChange,
  sharePath,
}: RecipeDisplayProps) {
  const { t, i18n } = useTranslation();
  const { preferment, starter } = recipe;
  const plan = buildPlan(recipe, t, unitSystem);
  const hasStage = preferment !== undefined || starter !== undefined;
  const origin = useSiteOrigin();

  const weight = (grams: number, decimals = 0) =>
    formatQuantity(grams, 'weight', unitSystem, decimals);
  const temperature = (celsius: number) => formatQuantity(celsius, 'temperature', unitSystem);
  const methodText = (key: string, options?: Record<string, unknown>) =>
    t(`methods.${recipe.method}.${key}`, options ?? {});

  const timelineTotal = plan.timeline.reduce((sum, phase) => sum + phase.hours, 0);

  // Only worth surfacing when the correction actually moves the number.
  const showEffectiveCold =
    recipe.useThermalModel &&
    recipe.coldFermentTime > 0 &&
    Math.abs(recipe.effectiveColdTime / recipe.coldFermentTime - 1) >= 0.02;

  // Optional planner: with a bake time set, every step gets its clock time.
  const clockFormat = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  const clockAt = (at: number) => {
    const start = stepStart(bakeAt, plan, at);
    return start && clockFormat.format(start);
  };

  const surplus = recipe.prefermentSurplus;
  const yeastLabel = t(`calculator.yeastTypes.${recipe.yeastType}.label`);

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-xl transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800 print:border-0 print:p-0 print:shadow-none">
      {/* Only on paper: what this is, and the way back to it. */}
      <div className="mb-4 hidden border-b border-gray-300 pb-3 text-sm print:block">
        <p className="text-xl font-bold">{t(`pages.${recipe.method}.heading`)}</p>
        {clockAt(plan.totalHours) && (
          <p>{t('results.export.printBake', { time: clockAt(plan.totalHours) })}</p>
        )}
        <p className="break-all">
          {t('results.export.recipeLink')} {origin}
          {sharePath}
        </p>
      </div>

      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white print:mb-3">
        {t('results.title')}
      </h2>

      {preferment && (
        <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20 print:mb-4 print:break-inside-avoid">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            <FlaskConical className="h-5 w-5 text-amber-600 dark:text-amber-400 print:hidden" />
            {t('results.prefermentHeading', { name: methodText('label') })}
          </h3>
          <p className="mb-4 mt-1 text-sm text-gray-600 dark:text-gray-300">
            {t('results.prefermentTiming', {
              hours: formatHours(preferment.timeHours),
              schedule: plan.prefermentSchedule,
            })}
            {preferment.schedule.coldHours > 0 &&
              ` ${t('results.prefermentEquivalent', {
                hours: formatHours(preferment.equivalentRoomHours),
                temp: temperature(preferment.schedule.roomTempC),
              })}`}
          </p>
          <IngredientList rows={plan.stageIngredients} compact />
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {methodText('yeastNote', {
              percent: round(preferment.yeastPercent, 3),
              yeast: yeastLabel,
            })}
          </p>
        </section>
      )}

      {starter && (
        <section className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20 print:mb-4 print:break-inside-avoid">
          <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            <FlaskConical className="h-5 w-5 text-amber-600 dark:text-amber-400 print:hidden" />
            {t('results.starter.heading')}
          </h3>
          <p className="mb-4 mt-1 text-sm text-gray-600 dark:text-gray-300">
            {t('results.starter.timing', {
              hours: formatHours(starter.feedHours),
              temp: temperature(starter.feedTempC),
              ratio: starter.feed.ratio,
            })}
          </p>
          <IngredientList rows={plan.stageIngredients} compact />
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

      <div className="mb-8 print:mb-4 print:break-inside-avoid">
        <IngredientList rows={plan.ingredients} />
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

      <div className="space-y-4 border-t border-gray-200 pt-6 dark:border-gray-600 print:break-inside-avoid">
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
              {plan.timeline.map(({ key, label, hours, tone }) => {
                const share = (hours / timelineTotal) * 100;
                return (
                  <div
                    key={key}
                    data-print-keep
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
              {plan.timeline.map(({ key, label, hours, tone, tempC }) => (
                <div key={key} className="flex items-center gap-2">
                  <span data-print-keep className={`h-3 w-3 shrink-0 rounded ${TONE_CLASSES[tone]}`} />
                  <span className="text-gray-600 dark:text-gray-300">
                    {label} · {formatHours(hours)} h · {temperature(tempC)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-6 dark:border-orange-800 dark:from-orange-900/20 dark:to-amber-900/20 print:mt-4 print:p-0">
        <h3 className="mb-3 font-bold text-gray-900 dark:text-white">{t('results.instructions')}</h3>
        <label className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-700 dark:text-gray-300 print:hidden">
          <CalendarClock className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden="true" />
          <span className="font-medium">{t('results.planner.label')}</span>
          <input
            type="datetime-local"
            value={bakeAt}
            onChange={(event) => onBakeAtChange(event.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </label>
        {clockAt(0) && (
          <p className="mb-4 text-sm font-semibold text-orange-700 dark:text-orange-300">
            {t('results.planner.start', { time: clockAt(0) })}
          </p>
        )}
        <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300 print:space-y-2">
          {plan.steps.map(({ key, text, at }, index) => (
            <li key={key} className="flex gap-2 print:break-inside-avoid">
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

        <ExportBar plan={plan} method={recipe.method} bakeAt={bakeAt} sharePath={sharePath} />
      </div>
    </div>
  );
}
