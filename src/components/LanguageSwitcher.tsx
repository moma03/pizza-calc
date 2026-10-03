import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Dropdown, type DropdownOption } from './Dropdown';
import { SUPPORTED_LANGUAGES, type Language } from '../i18n';
import { pageHref, storeLanguage } from '../navigation';
import type { Route } from '../routes';

const OPTIONS: readonly DropdownOption<Language>[] = SUPPORTED_LANGUAGES.map(
  ({ code, name, flag }) => ({ value: code, label: name, badge: flag })
);

interface LanguageSwitcherProps {
  route: Route;
}

/**
 * Each language is its own page, so switching navigates to the same page in
 * the other language rather than re-rendering this one in place.
 */
export function LanguageSwitcher({ route }: LanguageSwitcherProps) {
  const { t } = useTranslation();

  return (
    <Dropdown
      icon={Globe}
      label={t('controls.language')}
      value={route.lang}
      options={OPTIONS}
      onChange={(lang) => {
        if (lang === route.lang) return;
        storeLanguage(lang);
        window.location.assign(pageHref({ ...route, lang }));
      }}
    />
  );
}
