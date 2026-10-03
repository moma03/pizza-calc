import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import i18n from './i18n';
import { cameFromThisSite, pageHref, redirectTarget } from './navigation';
import { routeFromPath } from './routes';
import './index.css';

const route = routeFromPath(window.location.pathname, import.meta.env.BASE_URL);
const target = redirectTarget(route, window.location.search, cameFromThisSite());

if (target) {
  window.location.replace(`${pageHref(target)}${window.location.hash}`);
} else {
  i18n.changeLanguage(route.lang);
  document.documentElement.lang = route.lang;

  const container = document.getElementById('root')!;
  const app = (
    <StrictMode>
      <App route={route} />
    </StrictMode>
  );

  // Built pages arrive prerendered and only need hydrating; the dev server
  // serves an empty shell.
  if (container.hasChildNodes()) {
    hydrateRoot(container, app);
  } else {
    createRoot(container).render(app);
  }
}
