import { SUPPORTED_LANGUAGES, type Language } from './i18n/languages';
import { METHODS, type Method } from './lib/fermentation';

/**
 * Every leavening method gets its own page per language, so each can rank for
 * its own searches ("poolish pizza dough", "Biga Rechner"); see
 * docs/preferments.md §10.
 */
export type { Method };

/** The language every page falls back to, served without a path prefix. */
export const DEFAULT_LANGUAGE: Language = 'en';

/** Path segment per method and language; empty for the method at the root. */
const SLUGS: Record<Method, Record<Language, string>> = {
  direct: { en: '', de: '' },
  poolish: { en: 'poolish', de: 'poolish' },
  biga: { en: 'biga', de: 'biga' },
  sourdough: { en: 'sourdough', de: 'sauerteig' },
};

export interface Route {
  readonly lang: Language;
  readonly method: Method;
}

/** Every page the site serves, in sitemap order. */
export const ROUTES: readonly Route[] = METHODS.flatMap((method) =>
  SUPPORTED_LANGUAGES.map(({ code }) => ({ lang: code, method }))
);

/**
 * Path of a page relative to the site root, with a trailing slash so it maps
 * onto a directory index on a static host: `''`, `'de/'`, later `'de/biga/'`.
 */
export const routePath = ({ lang, method }: Route): string =>
  [lang === DEFAULT_LANGUAGE ? '' : lang, SLUGS[method][lang]]
    .filter(Boolean)
    .map((segment) => `${segment}/`)
    .join('');

/** The page a path belongs to; anything unrecognised is the default page. */
export const routeFromPath = (pathname: string, base: string): Route => {
  const relative = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const normalised = relative.replace(/index\.html$/, '').replace(/^\/+/, '');
  const withSlash = normalised === '' || normalised.endsWith('/') ? normalised : `${normalised}/`;

  return ROUTES.find((route) => routePath(route) === withSlash) ?? {
    lang: DEFAULT_LANGUAGE,
    method: METHODS[0],
  };
};
