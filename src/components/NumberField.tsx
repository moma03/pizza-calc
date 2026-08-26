import { useId, useState } from 'react';
import { Tooltip } from './Tooltip';
import { clampToRange, round, type Range } from '../lib/math';
import {
  fromDisplayUnit,
  rangeToDisplayUnit,
  toDisplayUnit,
  unitSymbol,
  type Quantity,
  type UnitSystem,
} from '../lib/units';

interface NumberFieldProps {
  label: string;
  /** Always the metric base value (grams, °C, hours, percent). */
  value: number;
  onChange: (value: number) => void;
  /** Accepted range, also in metric base units. */
  limits: Range;
  step?: number;
  quantity?: Quantity;
  unitSystem?: UnitSystem;
  tooltip?: string;
  /** Smaller padding, for the fermentation grid. */
  compact?: boolean;
}

const inputPrecision = (quantity: Quantity, system: UnitSystem): number => {
  if (quantity === 'weight') return system === 'imperial' ? 2 : 0;
  if (quantity === 'temperature') return 0;
  return 2;
};

/**
 * A labelled numeric input that edits a metric value while displaying it in the
 * user's unit system.
 *
 * While the field has focus it keeps the raw text the user typed, so partial
 * entries like `"1."` or `""` survive; the value is clamped into range on blur
 * rather than mid-keystroke.
 */
export function NumberField({
  label,
  value,
  onChange,
  limits,
  step,
  quantity = 'count',
  unitSystem = 'metric',
  tooltip,
  compact = false,
}: NumberFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);

  const displayLimits = rangeToDisplayUnit(limits, quantity, unitSystem);
  const precision = inputPrecision(quantity, unitSystem);
  const symbol = unitSymbol(quantity, unitSystem);

  const displayValue =
    draft ?? String(round(toDisplayUnit(value, quantity, unitSystem), precision));

  const handleChange = (raw: string) => {
    setDraft(raw);
    const parsed = Number.parseFloat(raw);
    if (!Number.isNaN(parsed)) onChange(fromDisplayUnit(parsed, quantity, unitSystem));
  };

  const handleBlur = () => {
    if (draft === null) return; // Nothing was typed, so nothing to commit.
    setDraft(null);

    const parsed = Number.parseFloat(draft);
    const next = Number.isNaN(parsed) ? value : fromDisplayUnit(parsed, quantity, unitSystem);
    const clamped = clampToRange(next, limits);
    if (clamped !== value) onChange(clamped);
  };

  return (
    <div>
      <label
        htmlFor={id}
        className={`mb-2 flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300 ${
          compact ? 'text-xs font-medium text-gray-600 dark:text-gray-400' : 'text-sm'
        }`}
      >
        <span>
          {label}
          {symbol && ` (${symbol})`}
        </span>
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={round(displayLimits.min, precision)}
        max={round(displayLimits.max, precision)}
        step={step}
        value={displayValue}
        onChange={(event) => handleChange(event.target.value)}
        onBlur={handleBlur}
        className={`w-full rounded-lg border border-gray-300 bg-white text-gray-900 transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
          compact ? 'px-3 py-2' : 'px-4 py-3'
        }`}
      />
    </div>
  );
}
