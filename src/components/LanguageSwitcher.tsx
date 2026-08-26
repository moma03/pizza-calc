import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dropdown, type DropdownOption } from './Dropdown';
import { SUPPORTED_LANGUAGES, type Language } from '../i18n';

const OPTIONS: readonly DropdownOption<Language>[] = SUPPORTED_LANGUAGES.map(
  ({ code, name, flag }) => ({ value: code, label: name, badge: flag })
);

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const current = (SUPPORTED_LANGUAGES.find((language) =>
    i18n.language?.startsWith(language.code)
  ) ?? SUPPORTED_LANGUAGES[0]).code;

  return (
    <Dropdown
      icon={Globe}
      label={t('controls.language')}
      value={current}
      options={OPTIONS}
      onChange={(code) => i18n.changeLanguage(code)}
    />
  );
}
