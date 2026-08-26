import { Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dropdown, type DropdownOption } from './Dropdown';
import type { UnitSystem } from '../lib/units';

interface UnitSystemToggleProps {
  value: UnitSystem;
  onChange: (system: UnitSystem) => void;
}

export function UnitSystemToggle({ value, onChange }: UnitSystemToggleProps) {
  const { t } = useTranslation();

  const options: readonly DropdownOption<UnitSystem>[] = [
    { value: 'metric', label: t('controls.metric') },
    { value: 'imperial', label: t('controls.imperial') },
  ];

  return (
    <Dropdown
      icon={Scale}
      label={t('controls.unitSystem')}
      value={value}
      options={options}
      onChange={onChange}
    />
  );
}
