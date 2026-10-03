import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import de from './locales/de.json';
import { SUPPORTED_LANGUAGES } from './languages';

export { SUPPORTED_LANGUAGES, isLanguage, type Language } from './languages';

/**
 * English is the reference key set. `satisfies` makes an incomplete or misspelt
 * translation a compile error rather than a string that silently falls back.
 */
const resources = {
  en: { translation: en },
  de: { translation: de satisfies typeof en },
} as const;

/**
 * The language is not detected here: every page has its own URL (`/`, `/de/`),
 * and whoever renders a page — the browser entry or the prerender — sets the
 * language from that. `initAsync: false` makes the setup synchronous, which the
 * prerender needs and costs nothing with the translations bundled in.
 */
i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  supportedLngs: SUPPORTED_LANGUAGES.map(({ code }) => code),
  interpolation: { escapeValue: false },
  initAsync: false,
});

export default i18n;
