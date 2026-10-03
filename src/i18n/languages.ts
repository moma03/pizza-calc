export type Language = 'en' | 'de';

export const SUPPORTED_LANGUAGES: readonly { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export const isLanguage = (value: unknown): value is Language =>
  SUPPORTED_LANGUAGES.some(({ code }) => code === value);
