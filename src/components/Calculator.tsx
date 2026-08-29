import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Thermometer } from 'lucide-react';
import { NumberField } from './NumberField';
import { SelectField } from './SelectField';
import { RoomTimeSplitField } from './RoomTimeSplitField';
import {
  BALLING_POINTS,
  DEFAULT_ICE_PERCENT,
  LIMITS,
  REHYDRATION_TEMP_C,
  PIZZA_STYLES,
  STYLE_PRESETS,
  calculateRecipe,
  resolveYeastPercent,
  type BallingPoint,
  type PizzaStyle,
  type Recipe,
  type RecipeInput,
} from '../lib/recipe';
import { MIN_BULK_HOURS, MIN_ROOM_HOURS, YEAST_TYPES, type YeastType } from '../lib/fermentation';
import { round } from '../lib/math';
import { formatQuantity, type UnitSystem } from '../lib/units';

interface CalculatorProps {
  onRecipeChange: (recipe: Recipe) => void;
  unitSystem: UnitSystem;
}

const INITIAL_INPUT: RecipeInput = {
  ...STYLE_PRESETS.neapolitan,
  yeastType: 'fresh',
  autoCalculateYeast: true,
  yeastPercent: 0.5,
  bulkFermentHours: MIN_BULK_HOURS,
  icePercent: DEFAULT_ICE_PERCENT,
  ballingPoint: 'afterCold',
  useThermalModel: true,
};

export function Calculator({ onRecipeChange, unitSystem }: CalculatorProps) {
  const { t } = useTranslation();
  const [pizzaStyle, setPizzaStyle] = useState<PizzaStyle>('neapolitan');
  const [input, setInput] = useState<RecipeInput>(INITIAL_INPUT);

  /** Update one field; `numberOfPizzas` is deliberately kept across presets. */
  const update = useCallback(
    <K extends keyof RecipeInput>(key: K, value: RecipeInput[K]) =>
      setInput((current) => ({ ...current, [key]: value })),
    []
  );

  const selectStyle = (style: PizzaStyle) => {
    setPizzaStyle(style);
    setInput((current) => ({ ...current, ...STYLE_PRESETS[style], numberOfPizzas: current.numberOfPizzas }));
  };

  useEffect(() => {
    onRecipeChange(calculateRecipe(input));
  }, [input, onRecipeChange]);

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

          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              <Thermometer className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              {t('calculator.fermentation.room')}
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
                tooltip={t('calculator.fermentation.roomTimeTooltip', { minimum: MIN_ROOM_HOURS })}
                value={input.roomFermentTime}
                onChange={(value) => update('roomFermentTime', value)}
                limits={LIMITS.roomFermentTime}
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
                bulkHours={input.bulkFermentHours ?? MIN_BULK_HOURS}
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
              tooltip={t('calculator.yeastPercentTooltip')}
              value={input.yeastPercent}
              onChange={(value) => update('yeastPercent', value)}
              limits={LIMITS.yeastPercent}
              quantity="percent"
              step={0.01}
            />
          )}
        </section>
      </div>
    </div>
  );
}
