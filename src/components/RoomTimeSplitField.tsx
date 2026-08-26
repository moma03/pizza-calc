import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip } from './Tooltip';
import { bulkHoursRange, splitRoomFermentation, MIN_ROOM_HOURS } from '../lib/fermentation';
import { formatHours } from '../lib/units';

interface RoomTimeSplitFieldProps {
  totalRoomHours: number;
  bulkHours: number;
  onChange: (bulkHours: number) => void;
}

/**
 * Distributes the room-temperature time across the two phases the fridge sits
 * between: the bulk rise before it, and the final proof after it.
 */
export function RoomTimeSplitField({
  totalRoomHours,
  bulkHours,
  onChange,
}: RoomTimeSplitFieldProps) {
  const { t } = useTranslation();
  const id = useId();

  const range = bulkHoursRange(totalRoomHours);
  const hasSlack = range.max > range.min;
  const split = splitRoomFermentation(totalRoomHours, bulkHours);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
      >
        {t('calculator.fermentation.split.label')}
        <Tooltip text={t('calculator.fermentation.split.tooltip')} />
      </label>

      <input
        id={id}
        type="range"
        min={range.min}
        max={range.max}
        step={0.5}
        value={split.bulkHours}
        disabled={!hasSlack}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gradient-to-r from-orange-400 to-amber-400 accent-orange-600 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 dark:disabled:from-gray-600 dark:disabled:to-gray-600"
      />

      <div className="mt-2 flex justify-between gap-4 text-xs">
        <span className="text-gray-600 dark:text-gray-400">
          {t('calculator.fermentation.split.bulk')}
          <span className="ml-1 font-semibold text-gray-900 dark:text-white">
            {formatHours(split.bulkHours)} h
          </span>
        </span>
        <span className="text-right text-gray-600 dark:text-gray-400">
          {t('calculator.fermentation.split.proof')}
          <span className="ml-1 font-semibold text-gray-900 dark:text-white">
            {formatHours(split.ballProofHours)} h
          </span>
        </span>
      </div>

      {!hasSlack && (
        <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          {t('calculator.fermentation.split.noSlack', { minimum: MIN_ROOM_HOURS })}
        </p>
      )}
    </div>
  );
}
