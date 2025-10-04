import { Scale } from 'lucide-react';
import { useState, useEffect } from 'react';

export type UnitSystem = 'metric' | 'imperial';

interface UnitSystemToggleProps {
  onChange: (system: UnitSystem) => void;
}

export function UnitSystemToggle({ onChange }: UnitSystemToggleProps) {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(() => {
    const saved = localStorage.getItem('unitSystem');
    return (saved as UnitSystem) || 'metric';
  });

  useEffect(() => {
    onChange(unitSystem);
  }, [unitSystem, onChange]);

  const handleToggle = () => {
    const newSystem: UnitSystem = unitSystem === 'metric' ? 'imperial' : 'metric';
    setUnitSystem(newSystem);
    localStorage.setItem('unitSystem', newSystem);
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
      title={`Switch to ${unitSystem === 'metric' ? 'Imperial' : 'Metric'}`}
    >
      <Scale className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
        {unitSystem === 'metric' ? 'g / °C' : 'oz / °F'}
      </span>
    </button>
  );
}
