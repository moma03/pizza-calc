import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, FlaskConical, Thermometer } from 'lucide-react';
import { NumberField } from './NumberField';
import { SelectField } from './SelectField';
import { RoomTimeSplitField } from './RoomTimeSplitField';
import {
  BALLING_POINTS,
  LIMITS,
  REHYDRATION_TEMP_C,
  PIZZA_STYLES,
  STYLE_PRESETS,
  calculateRecipe,
  defaultInputFor,
  prefermentDefaults,
  prefermentShareLimits,
  resolveYeastPercent,
  roomTimeLimits,
  scheduleFor,
  yeastPercentLimits,
  type BallingPoint,
  type PizzaStyle,
  type Recipe,
  type RecipeInput,
} from '../lib/recipe';
import {
  METHODS,
  PREFERMENTS,
  YEAST_TYPES,
  isPrefermentMethod,
  roomMinimumsFor,
  type Method,
  type YeastType,
} from '../lib/fermentation';
import { round } from '../lib/math';
import { formatQuantity, type UnitSystem } from '../lib/units';

interface CalculatorProps {
  /** The method of the page the calculator sits on; it opens with that one. */
  initialMethod: Method;
  onRecipeChange: (recipe: Recipe) => void;
  onMethodChange: (method: Method) => void;
  unitSystem: UnitSystem;
}

export function Calculator({
  initialMethod,
  onRecipeChange,
  onMethodChange,
  unitSystem,
}: CalculatorProps) {
  const { t } = useTranslation();
  const [pizzaStyle, setPizzaStyle] = useState<PizzaStyle>('neapolitan');
  const [input, setInput] = useState<RecipeInput>(() => defaultInputFor(initialMethod));
  const { method } = input;
  const roomMinimums = roomMinimumsFor(method);
  const preferment = isPrefermentMethod(method) ? PREFERMENTS[method] : undefined;

  /** Update one field; `numberOfPizzas` is deliberately kept across presets. */
  const update = useCallback(
    <K extends keyof RecipeInput>(key: K, value: RecipeInput[K]) =>
      setInput((current) => ({ ...current, [key]: value })),
    []
  );

  const selectStyle = (style: PizzaStyle) => {
    setPizzaStyle(style);
    setInput((current) => ({
      ...current,
      ...STYLE_PRESETS[style],
      ...scheduleFor(current.method, style),
      numberOfPizzas: current.numberOfPizzas,
    }));
  };

  /** A new method starts from its own preferment defaults. */
  const selectMethod = (next: Method) => {
    setInput((current) => ({
      ...current,
      method: next,
      ...prefermentDefaults(next),
      ...scheduleFor(next, pizzaStyle),
    }));
    onMethodChange(next);
  };

  useEffect(() => {
    onRecipeChange(calculateRecipe(input));
  }, [input, onRecipeChange]);

  const methodOptions = METHODS.map((value) => ({
    value,
    label: t(`methods.${value}.label`),
  }));

  const styleOptions = PIZZA_STYLES.map((style) => ({
    value: style,
    label: t(`calculator.pizzaStyles.${style}`),
  }));

  const yeastOptions = YEAST_TYPES.map((type) => ({
    value: type,
    label: t(`calculator.yeastTypes.${type}.label`),
  }));

  const ballingOptions = BALLING_POINTS.map((point) => ({
    value: point,
    label: t(`calculator.ballingPoints.${point}.label`),
  }));

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-8 shadow-xl transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
        {t('calculator.recipeSettings')}
      </h2>

      <div className="space-y-6">
        <SelectField
          label={t('calculator.pizzaStyle')}
          value={pizzaStyle}
          options={styleOptions}
          onChange={selectStyle}
          hint={t(`calculator.pizzaStyleHints.${pizzaStyle}`)}
        />

        <SelectField
          label={t('calculator.method')}
          value={method}
          options={methodOptions}
          onChange={selectMethod}
          hint={t(`methods.${method}.hint`)}
        />

        <NumberField
          label={t('calculator.numberOfPizzas')}
          value={input.numberOfPizzas}
          onChange={(value) => update('numberOfPizzas', value)}
          limits={LIMITS.numberOfPizzas}
          step={1}
        />

        <NumberField
          label={t('calculator.doughBallWeight')}
          tooltip={t('calculator.doughBallWeightTooltip')}
          value={input.doughBallWeight}
          onChange={(value) => update('doughBallWeight', value)}
          limits={LIMITS.doughBallWeight}
          quantity="weight"
          unitSystem={unitSystem}
          step={unitSystem === 'metric' ? 5 : 0.25}
        />

        {/* The full dough composition, in baker's percentages. Oil and sugar
            are optional and simply sit at 0 when unused. */}
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label={t('calculator.waterPercent')}
            tooltip={t('calculator.waterPercentTooltip')}
            value={input.waterPercent}
            onChange={(value) => update('waterPercent', value)}
            limits={LIMITS.waterPercent}
            quantity="percent"
            step={0.5}
          />
          {/* Percent of the *water*, unlike every other field here, so the
              denominator is spelled out in the label rather than shown as a
              bare % that would read as a baker's percentage. */}
          <NumberField
            label={t('calculator.icePercent')}
            tooltip={t('calculator.icePercentTooltip')}
            value={input.icePercent}
            onChange={(value) => update('icePercent', value)}
            limits={LIMITS.icePercent}
            step={5}
          />
          <NumberField
            label={t('calculator.saltPercent')}
            tooltip={t('calculator.saltPercentTooltip')}
            value={input.saltPercent}
            onChange={(value) => update('saltPercent', value)}
            limits={LIMITS.saltPercent}
            quantity="percent"
            step={0.1}
          />
          <NumberField
            label={t('calculator.oilPercent')}
            tooltip={t('calculator.oilPercentTooltip')}
            value={input.oilPercent}
            onChange={(value) => update('oilPercent', value)}
            limits={LIMITS.oilPercent}
            quantity="percent"
            step={0.5}
          />
          <NumberField
            label={t('calculator.sugarPercent')}
            tooltip={t('calculator.sugarPercentTooltip')}
            value={input.sugarPercent}
            onChange={(value) => update('sugarPercent', value)}
            limits={LIMITS.sugarPercent}
            quantity="percent"
            step={0.5}
          />
        </div>

        <section className="space-y-4 border-t border-gray-200 pt-6 dark:border-gray-600">
          <h3 className="flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
            <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            {t('calculator.fermentationSettings')}
          </h3>

          <SelectField
            label={t('calculator.yeastType')}
            value={input.yeastType}
            options={yeastOptions}
            onChange={(value: YeastType) => update('yeastType', value)}
            hint={t(`calculator.yeastTypes.${input.yeastType}.hint`, {
              temp: formatQuantity(REHYDRATION_TEMP_C, 'temperature', unitSystem),
            })}
          />

          <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
            <input
              type="checkbox"
              id="autoCalculateYeast"
              checked={input.autoCalculateYeast}
              onChange={(event) => {
                const enabled = event.target.checked;
                setInput((current) => ({
                  ...current,
                  autoCalculateYeast: enabled,
                  // Seed the manual field with the derived value, so switching
                  // to manual starts from what was on screen.
                  yeastPercent: enabled
                    ? current.yeastPercent
                    : round(resolveYeastPercent({ ...current, autoCalculateYeast: true }), 3),
                }));
              }}
              className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="autoCalculateYeast"
              className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('calculator.autoCalculateYeast')}
            </label>
          </div>

          {preferment && isPrefermentMethod(method) && (
            <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                {t(`methods.${method}.label`)}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  compact
                  label={t('calculator.preferment.share')}
                  tooltip={t(`methods.${method}.shareTooltip`)}
                  value={input.prefermentShare}
                  onChange={(value) => update('prefermentShare', value)}
                  limits={prefermentShareLimits(method, input.waterPercent, input.prefermentHydration)}
                  quantity="percent"
                  step={5}
                />
                {preferment.hydration.range.min < preferment.hydration.range.max && (
                  <NumberField
                    compact
                    label={t('calculator.preferment.hydration')}
                    tooltip={t(`methods.${method}.hydrationTooltip`)}
                    value={input.prefermentHydration}
                    onChange={(value) => update('prefermentHydration', value)}
                    limits={preferment.hydration.range}
                    quantity="percent"
                    step={1}
                  />
                )}
                <NumberField
                  compact
                  label={t('calculator.fermentation.temperature')}
                  value={input.prefermentTemp}
                  onChange={(value) => update('prefermentTemp', value)}
                  limits={preferment.temperature.range}
                  quantity="temperature"
                  unitSystem={unitSystem}
                  step={1}
                />
                <NumberField
                  compact
                  label={t('calculator.fermentation.time')}
                  tooltip={t(`methods.${method}.timeTooltip`)}
                  value={input.prefermentTime}
                  onChange={(value) => update('prefermentTime', value)}
                  limits={preferment.time.range}
                  quantity="hours"
                  step={1}
                />
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <Thermometer className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              {t(preferment ? 'calculator.fermentation.roomFinal' : 'calculator.fermentation.room')}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <NumberField
                compact
                label={t('calculator.fermentation.temperature')}
                value={input.roomFermentTemp}
                onChange={(value) => update('roomFermentTemp', value)}
                limits={LIMITS.roomFermentTemp}
                quantity="temperature"
                unitSystem={unitSystem}
                step={1}
              />
              <NumberField
                compact
                label={t('calculator.fermentation.time')}
                tooltip={t('calculator.fermentation.roomTimeTooltip', {
                  minimum: roomTimeLimits(method).min,
                })}
                value={input.roomFermentTime}
                onChange={(value) => update('roomFermentTime', value)}
                limits={roomTimeLimits(method)}
                quantity="hours"
                step={0.5}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <Thermometer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              {t('calculator.fermentation.cold')}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <NumberField
                compact
                label={t('calculator.fermentation.temperature')}
                value={input.coldFermentTemp}
                onChange={(value) => update('coldFermentTemp', value)}
                limits={LIMITS.coldFermentTemp}
                quantity="temperature"
                unitSystem={unitSystem}
                step={1}
              />
              <NumberField
                compact
                label={t('calculator.fermentation.time')}
                tooltip={t('calculator.fermentation.coldTimeTooltip')}
                value={input.coldFermentTime}
                onChange={(value) => update('coldFermentTime', value)}
                limits={LIMITS.coldFermentTime}
                quantity="hours"
                step={1}
              />
            </div>
          </div>

          {/* All three only mean anything with a fridge phase to sit around: the
              cooling correction is inert without one. */}
          {input.coldFermentTime > 0 && (
            <>
              <RoomTimeSplitField
                totalRoomHours={input.roomFermentTime}
                bulkHours={input.bulkFermentHours}
                minimums={roomMinimums}
                onChange={(hours) => update('bulkFermentHours', hours)}
              />

              <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
                <input
                  type="checkbox"
                  id="useThermalModel"
                  checked={input.useThermalModel}
                  onChange={(event) => update('useThermalModel', event.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="useThermalModel" className="flex-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('calculator.thermalModel.label')}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {t(
                      input.useThermalModel
                        ? 'calculator.thermalModel.onHint'
                        : 'calculator.thermalModel.offHint'
                    )}
                  </span>
                </label>
              </div>

              <SelectField
                label={t('calculator.ballingPoint')}
                value={input.ballingPoint}
                options={ballingOptions}
                onChange={(value: BallingPoint) => update('ballingPoint', value)}
                hint={t(`calculator.ballingPoints.${input.ballingPoint}.hint`)}
              />
            </>
          )}

          {!input.autoCalculateYeast && (
            <NumberField
              label={t('calculator.yeastPercent')}
              tooltip={t(
                preferment ? 'calculator.yeastPercentFinalTooltip' : 'calculator.yeastPercentTooltip'
              )}
              value={input.yeastPercent}
              onChange={(value) => update('yeastPercent', value)}
              limits={yeastPercentLimits(method)}
              quantity="percent"
              step={0.01}
            />
          )}
        </section>
      </div>
    </div>
  );
}
