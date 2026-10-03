// Turns the client build in dist/ into one static page per route, plus the
// sitemap. Run after both `vite build` passes; see the `build` script.
//
//   SITE_URL   public URL of the site root. Enables canonical and hreflang
//              tags, og:url/og:image and sitemap.xml. Without it the pages
//              are still prerendered, just without anything that needs an
//              absolute URL.

import { mkdir, readFile, rm, writeFile, appendFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DIST = resolve('dist');
const SSR_DIST = resolve('dist-ssr');

const { ROUTES, renderPage, renderSitemap, routePath } = await import(
  pathToFileURL(join(SSR_DIST, 'entry-server.js')).href
);

const siteUrl = process.env.SITE_URL?.trim().replace(/\/+$/, '') || undefined;
const template = await readFile(join(DIST, 'index.html'), 'utf8');

const replaceOnce = (html, pattern, replacement, what) => {
  if (!pattern.test(html)) throw new Error(`prerender: ${what} not found in dist/index.html`);
  return html.replace(pattern, () => replacement);
};

for (const route of ROUTES) {
  const page = renderPage(route, siteUrl);

  let html = template;
  html = replaceOnce(html, /<html lang="[^"]*">/, `<html lang="${page.lang}">`, '<html lang>');
  html = replaceOnce(html, /<!--seo-->[\s\S]*?<!--\/seo-->/, page.head, 'the <!--seo--> block');
  html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${page.html}</div>`, 'an empty #root');
  html = replaceOnce(html, /<noscript>[\s\S]*?<\/noscript>/, `<noscript>${page.noscript}</noscript>`, '<noscript>');

  const file = join(DIST, routePath(route), 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
  console.log(`prerendered /${routePath(route)}`);
}

if (siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  await writeFile(join(DIST, 'sitemap.xml'), renderSitemap(siteUrl, today));
  await appendFile(join(DIST, 'robots.txt'), `\nSitemap: ${siteUrl}/sitemap.xml\n`);
  console.log(`wrote sitemap.xml for ${siteUrl}`);
} else {
  console.log('SITE_URL not set: no canonical/hreflang tags or sitemap');
}

await rm(SSR_DIST, { recursive: true, force: true });
