/* eslint-disable react-refresh/only-export-components -- build-time entry, never hot-reloaded */
/**
 * Build-time renderer. `scripts/prerender.mjs` loads the SSR build of this file
 * and writes one static HTML page per route, so search engines get the full
 * text, headings and a worked recipe without having to run any JavaScript.
 */
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App';
import i18n from './i18n';
import { guideContent } from './guideContent';
import { checkLinkDefaults } from './lib/share';
import { checkModelFingerprint } from './lib/modelVersion';
import { DEFAULT_LANGUAGE, ROUTES, routePath, type Route } from './routes';

export { ROUTES, routePath };

/**
 * Build-time guards for recipe links: the defaults and the model's results
 * must match what the current link and model versions recorded.
 */
export const verifyVersions = () => {
  checkLinkDefaults();
  checkModelFingerprint();
};

const OG_LOCALES: Record<Route['lang'], string> = { en: 'en_US', de: 'de_DE' };

/** Social preview image, copied from `public/` into the site root. */
const OG_IMAGE = 'og-image.jpg';

const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** JSON for a `<script>` block; `<` is escaped so no string can close the tag. */
const jsonLd = (data: unknown): string =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

/** The same page in every language, as `[hreflang, route]`, plus x-default. */
const alternates = (route: Route): [string, Route][] => [
  ...ROUTES.filter(({ method }) => method === route.method).map(
    (alternate): [string, Route] => [alternate.lang, alternate]
  ),
  ['x-default', { ...route, lang: DEFAULT_LANGUAGE }],
];

export interface RenderedPage {
  lang: string;
  /** Everything that goes between the `<!--seo-->` markers in `<head>`. */
  head: string;
  /** Markup for `#root`. */
  html: string;
  noscript: string;
}

/**
 * Render one page. `siteUrl` is the public URL of the site root, without a
 * trailing slash; canonical, hreflang and og:url all need absolute URLs, so
 * they are only emitted when it is known.
 */
export const renderPage = (route: Route, siteUrl?: string): RenderedPage => {
  i18n.changeLanguage(route.lang);
  const t = i18n.getFixedT(route.lang);
  const page = (key: string) => t(`pages.${route.method}.${key}`);
  const absolute = (target: Route) => (siteUrl ? `${siteUrl}/${routePath(target)}` : undefined);

  const url = absolute(route);
  const title = page('title');
  const description = page('description');
  const { faq } = guideContent(t, route.method);

  const meta = (attribute: 'name' | 'property', key: string, content: string) =>
    `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;

  const head = [
    `<title>${escapeHtml(title)}</title>`,
    meta('name', 'description', description),
    ...(url
      ? [
          `<link rel="canonical" href="${url}" />`,
          ...alternates(route).map(
            ([hreflang, target]) =>
              `<link rel="alternate" hreflang="${hreflang}" href="${absolute(target)}" />`
          ),
        ]
      : []),
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', page('appName')),
    meta('property', 'og:title', title),
    meta('property', 'og:description', description),
    meta('property', 'og:locale', OG_LOCALES[route.lang]),
    ...ROUTES.filter(({ method, lang }) => method === route.method && lang !== route.lang).map(
      ({ lang }) => meta('property', 'og:locale:alternate', OG_LOCALES[lang])
    ),
    ...(url && siteUrl
      ? [
          meta('property', 'og:url', url),
          meta('property', 'og:image', `${siteUrl}/${OG_IMAGE}`),
          meta('name', 'twitter:card', 'summary_large_image'),
        ]
      : [meta('name', 'twitter:card', 'summary')]),
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: page('appName'),
      description,
      ...(url && { url }),
      inLanguage: route.lang,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      author: { '@type': 'Person', name: 'Moritz Manegold', url: 'https://moritz-manegold.de' },
    }),
    // Mirrors the FAQ rendered on the page, which structured data must match.
    jsonLd({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: route.lang,
      mainEntity: faq.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    }),
  ].join('\n    ');

  const html = renderToString(
    <StrictMode>
      <App route={route} />
    </StrictMode>
  );

  return { lang: route.lang, head, html, noscript: escapeHtml(t('noscript')) };
};

/** `sitemap.xml` listing every page, each with its language alternates. */
export const renderSitemap = (siteUrl: string, lastModified: string): string => {
  const absolute = (route: Route) => `${siteUrl}/${routePath(route)}`;
  const entries = ROUTES.map((route) =>
    [
      '  <url>',
      `    <loc>${absolute(route)}</loc>`,
      `    <lastmod>${lastModified}</lastmod>`,
      ...alternates(route).map(
        ([hreflang, target]) =>
          `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${absolute(target)}"/>`
      ),
      '  </url>',
    ].join('\n')
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
};
