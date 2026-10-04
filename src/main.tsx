import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import i18n from './i18n';
import { cameFromThisSite, pageHref, redirectTarget } from './navigation';
import { routeFromPath } from './routes';
import { decodeShare } from './lib/share';
import './index.css';

const route = routeFromPath(window.location.pathname, import.meta.env.BASE_URL);
const target = redirectTarget(route, window.location.search, cameFromThisSite());

if (target) {
  window.location.replace(`${pageHref(target)}${window.location.hash}`);
} else {
  i18n.changeLanguage(route.lang);
  document.documentElement.lang = route.lang;

  // A recipe link carries its settings after the `#` (src/lib/share.ts).
  const shared = decodeShare(window.location.hash, route.method);

  // Opening another recipe link on this same page only changes the fragment,
  // which does not reload anything. The app's own updates use replaceState,
  // which fires no event, so this only catches a link from outside.
  window.addEventListener('hashchange', () => window.location.reload());

  const container = document.getElementById('root')!;
  const app = (
    <StrictMode>
      <App route={route} initialState={shared} />
    </StrictMode>
  );

  // Built pages arrive prerendered and only need hydrating; the dev server
  // serves an empty shell. A link with its own settings no longer matches the
  // prerendered defaults, so that page is rendered afresh instead.
  if (container.hasChildNodes() && !shared) {
    hydrateRoot(container, app);
  } else {
    createRoot(container).render(app);
  }
}
