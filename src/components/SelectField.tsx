import { useId } from 'react';
import { Tooltip } from './Tooltip';

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  tooltip?: string;
  /** Explanatory line shown under the field for the current selection. */
  hint?: string;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  tooltip,
  hint,
}: SelectFieldProps<T>) {
  const id = useId();

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300"
      >
        {label}
        {tooltip && <Tooltip text={tooltip} />}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}
