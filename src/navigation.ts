import { DEFAULT_LANGUAGE, routePath, type Route } from './routes';
import { isLanguage, type Language } from './i18n/languages';

/**
 * The key the old browser language detector cached under, kept so a language
 * chosen before pages had their own URLs still counts.
 */
const LANGUAGE_KEY = 'i18nextLng';

/** Remember an explicit language choice, so the default pages stop redirecting. */
export const storeLanguage = (language: Language) => {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Private browsing or blocked storage: the choice just will not persist.
  }
};

const storedLanguage = (): Language | undefined => {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY)?.split('-')[0];
    return isLanguage(stored) ? stored : undefined;
  } catch {
    return undefined;
  }
};

const browserLanguage = (): Language | undefined =>
  (navigator.languages ?? [navigator.language])
    .map((tag) => tag.split('-')[0])
    .find(isLanguage);

/** Absolute path of a page on this site, including any deploy base path. */
export const pageHref = (route: Route): string => `${import.meta.env.BASE_URL}${routePath(route)}`;

/**
 * The page to send the visitor to instead of `route`, if any.
 *
 * - `?lng=de` links from before each language had its own URL. Apache answers
 *   these with a 301 already; the dev server and the Docker image do not.
 * - A first visit to a default-language page from a browser that asks for
 *   another supported language. Only the default pages redirect, as the
 *   x-default they are meant to route visitors onward — `/de/` never bounces
 *   anyone, and a language picked with the switcher overrides the browser.
 *   Arriving from another page of this site never redirects either, so the
 *   switcher still works when storage is blocked and the choice cannot be kept.
 */
export const redirectTarget = (
  route: Route,
  search: string,
  cameFromThisSite: boolean
): Route | undefined => {
  const requested = new URLSearchParams(search).get('lng')?.split('-')[0];
  if (isLanguage(requested)) {
    storeLanguage(requested);
    return { ...route, lang: requested };
  }

  if (route.lang !== DEFAULT_LANGUAGE || cameFromThisSite) return undefined;

  const preferred = storedLanguage() ?? browserLanguage();
  return preferred && preferred !== route.lang ? { ...route, lang: preferred } : undefined;
};

/** Whether this page was opened from another page of the same site. */
export const cameFromThisSite = (): boolean => {
  try {
    return new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
};
