import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  /** Optional leading glyph, e.g. a flag emoji. */
  badge?: ReactNode;
}

interface DropdownProps<T extends string> {
  icon: LucideIcon;
  value: T;
  options: readonly DropdownOption<T>[];
  onChange: (value: T) => void;
  label: string;
}

/**
 * The single dropdown used by every top-bar control, so they all render at
 * exactly the same height and width regardless of their content.
 */
export function Dropdown<T extends string>({
  icon: Icon,
  value,
  options,
  onChange,
  label,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onEscape);
    };
  }, [isOpen]);

  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-10 w-40 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <Icon className="h-4 w-4 shrink-0" />
        {selected.badge && <span className="shrink-0 text-base leading-none">{selected.badge}</span>}
        <span className="truncate">{selected.label}</span>
        <ChevronDown
          className={`ml-auto h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-gray-300 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
        >
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  option.value === value
                    ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {option.badge && <span className="text-base leading-none">{option.badge}</span>}
                <span>{option.label}</span>
                {option.value === value && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-orange-500" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
