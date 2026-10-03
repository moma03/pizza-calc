import { useTranslation } from 'react-i18next';
import { FlaskConical, Snowflake, Thermometer } from 'lucide-react';
import { NumberField } from './NumberField';
import { SelectField } from './SelectField';
import {
  PREFERMENTS,
  matchVariant,
  type PrefermentMethod,
} from '../lib/fermentation';
import {
  prefermentSchedule,
  prefermentShareLimits,
  variantFields,
  type RecipeInput,
} from '../lib/recipe';
import { formatHours, type UnitSystem } from '../lib/units';

interface PrefermentFieldsProps {
  method: PrefermentMethod;
  input: RecipeInput;
  /** Merge several fields at once, e.g. everything a variant sets. */
  onChange: (fields: Partial<RecipeInput>) => void;
  unitSystem: UnitSystem;
}

const CUSTOM = 'custom';

/**
 * Everything about a yeasted preferment: which variant (room, fridge, long),
 * how much of the flour goes in, and its own room and fridge phases. Picking a
 * variant fills the fields; editing them afterwards turns it into a custom
 * schedule (docs/preferments.md §7).
 */
export function PrefermentFields({ method, input, onChange, unitSystem }: PrefermentFieldsProps) {
  const { t } = useTranslation();
  const profile = PREFERMENTS[method];
  const schedule = prefermentSchedule(input);
  const variant = matchVariant(method, schedule, input.prefermentHydration)?.id ?? CUSTOM;
  const hasBothPhases = schedule.roomHours > 0 && schedule.coldHours > 0;

  const variantOptions = [
    ...profile.variants.map(({ id }) => ({ value: id, label: t(`methods.${method}.variants.${id}.label`) })),
    // Only offered while it is true, so it reads as a status, not a choice.
    ...(variant === CUSTOM ? [{ value: CUSTOM, label: t('calculator.preferment.custom') }] : []),
  ];

  const selectVariant = (id: string) => {
    const chosen = profile.variants.find((candidate) => candidate.id === id);
    if (chosen) onChange(variantFields(method, chosen));
  };

  const shareLimits = prefermentShareLimits(method, input.waterPercent, input.prefermentHydration);
  const total = schedule.roomHours + schedule.coldHours;

  return (
    <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        {t(`methods.${method}.label`)}
      </h4>

      <SelectField
        label={t('calculator.preferment.variant')}
        value={variant}
        options={variantOptions}
        onChange={selectVariant}
        hint={
          variant === CUSTOM
            ? t('calculator.preferment.customHint')
            : t(`methods.${method}.variants.${variant}.hint`)
        }
      />

      <div>
        <NumberField
          compact
          label={t('calculator.preferment.share')}
          tooltip={t(`methods.${method}.shareTooltip`)}
          value={input.prefermentShare}
          onChange={(value) => onChange({ prefermentShare: value })}
          limits={shareLimits}
          quantity="percent"
          step={5}
        />
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t('calculator.preferment.share')}>
          {profile.sharePresets
            .filter((share) => share <= shareLimits.max)
            .map((share) => (
              <button
                key={share}
                type="button"
                aria-pressed={input.prefermentShare === share}
                onClick={() => onChange({ prefermentShare: share })}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  input.prefermentShare === share
                    ? 'border-amber-600 bg-amber-600 text-white'
                    : 'border-amber-300 bg-white text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-gray-800 dark:text-amber-200 dark:hover:bg-gray-700'
                }`}
              >
                {share} %
              </button>
            ))}
        </div>
      </div>

      {profile.hydration.range.min < profile.hydration.range.max && (
        <NumberField
          compact
          label={t('calculator.preferment.hydration')}
          tooltip={t(`methods.${method}.hydrationTooltip`)}
          value={input.prefermentHydration}
          onChange={(value) => onChange({ prefermentHydration: value })}
          limits={profile.hydration.range}
          quantity="percent"
          step={1}
        />
      )}

      <div className="space-y-2">
        <h5 className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <Thermometer className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          {t('calculator.fermentation.room')}
        </h5>
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            compact
            slider
            label={t('calculator.fermentation.time')}
            tooltip={t(`methods.${method}.timeTooltip`)}
            value={input.prefermentTime}
            onChange={(value) => onChange({ prefermentTime: value })}
            limits={profile.roomHours}
            quantity="hours"
            step={1}
          />
          {schedule.roomHours > 0 && (
            <NumberField
              compact
              label={t('calculator.fermentation.temperature')}
              value={input.prefermentTemp}
              onChange={(value) => onChange({ prefermentTemp: value })}
              limits={profile.roomTemp}
              quantity="temperature"
              unitSystem={unitSystem}
              step={1}
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <Snowflake className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          {t('calculator.fermentation.cold')}
        </h5>
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            compact
            slider
            label={t('calculator.fermentation.time')}
            tooltip={t('calculator.preferment.coldTooltip')}
            value={input.prefermentColdTime}
            onChange={(value) => onChange({ prefermentColdTime: value })}
            limits={profile.coldHours}
            quantity="hours"
            step={1}
          />
          {schedule.coldHours > 0 && (
            <NumberField
              compact
              label={t('calculator.fermentation.temperature')}
              value={input.prefermentColdTemp}
              onChange={(value) => onChange({ prefermentColdTemp: value })}
              limits={profile.coldTemp}
              quantity="temperature"
              unitSystem={unitSystem}
              step={1}
            />
          )}
        </div>
      </div>

      {hasBothPhases && (
        <SelectField
          label={t('calculator.preferment.order')}
          value={input.prefermentColdFirst ? 'coldFirst' : 'roomFirst'}
          options={[
            { value: 'roomFirst', label: t('calculator.preferment.roomFirst') },
            { value: 'coldFirst', label: t('calculator.preferment.coldFirst') },
          ]}
          onChange={(order) => onChange({ prefermentColdFirst: order === 'coldFirst' })}
        />
      )}

      <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
        {t('calculator.preferment.total', { total: formatHours(total) })}
      </p>
    </div>
  );
}
