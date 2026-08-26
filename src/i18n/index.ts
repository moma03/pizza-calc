import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import de from './locales/de.json';

export type Language = 'en' | 'de';

export const SUPPORTED_LANGUAGES: readonly { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

/**
 * English is the reference key set. `satisfies` makes an incomplete or misspelt
 * translation a compile error rather than a string that silently falls back.
 */
const resources = {
  en: { translation: en },
  de: { translation: de satisfies typeof en },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map(({ code }) => code),
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      // `?lng=de` makes a specific language shareable by link.
      order: ['querystring', 'localStorage', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lng',
      caches: ['localStorage'],
    },
  });

export default i18n;
