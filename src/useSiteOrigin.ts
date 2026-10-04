import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * `window.location.origin`, or an empty string while prerendering. Read through
 * `useSyncExternalStore` so hydration starts from the server's empty value and
 * fills in the origin straight after, rather than mismatching.
 */
export const useSiteOrigin = (): string =>
  useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => ''
  );
