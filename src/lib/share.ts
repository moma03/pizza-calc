import { YEAST_TYPES, type Method } from './fermentation';
import { MODEL_VERSION } from './modelVersion';
import {
  BALLING_POINTS,
  PIZZA_STYLES,
  defaultInputFor,
  type PizzaStyle,
  type RecipeInput,
} from './recipe';

/**
 * Everything needed to bring a recipe back: the inputs, the style preset the
 * form shows, and the planner's bake time. The method is not in here — it is
 * the page itself (`/biga/`, `/de/sauerteig/`, …).
 */
export interface SharedState {
  input: RecipeInput;
  style: PizzaStyle;
  /** `YYYY-MM-DDTHH:mm` in local time, as a `datetime-local` input gives it; empty when unset. */
  bakeAt: string;
}

type Field =
  | { kind: 'number' }
  | { kind: 'boolean' }
  | { kind: 'enum'; values: readonly string[] };

const number: Field = { kind: 'number' };
const boolean: Field = { kind: 'boolean' };

/**
 * Short key and type per input. Keyed by every field but the method, so a new
 * input fails to compile until it has a key here.
 */
const FIELDS: Record<Exclude<keyof RecipeInput, 'method'>, { key: string; field: Field }> = {
  numberOfPizzas: { key: 'n', field: number },
  doughBallWeight: { key: 'w', field: number },
  waterPercent: { key: 'h', field: number },
  icePercent: { key: 'i', field: number },
  saltPercent: { key: 'sa', field: number },
  oilPercent: { key: 'o', field: number },
  sugarPercent: { key: 'su', field: number },
  yeastType: { key: 'yt', field: { kind: 'enum', values: YEAST_TYPES } },
  autoCalculateYeast: { key: 'a', field: boolean },
  yeastPercent: { key: 'y', field: number },
  coldFermentTemp: { key: 'ct', field: number },
  coldFermentTime: { key: 'ch', field: number },
  roomFermentTemp: { key: 'rt', field: number },
  roomFermentTime: { key: 'rh', field: number },
  bulkFermentHours: { key: 'b', field: number },
  ballingPoint: { key: 'bp', field: { kind: 'enum', values: BALLING_POINTS } },
  useThermalModel: { key: 'tm', field: boolean },
  prefermentShare: { key: 'ps', field: number },
  prefermentHydration: { key: 'ph', field: number },
  prefermentTime: { key: 'prh', field: number },
  prefermentTemp: { key: 'prt', field: number },
  prefermentColdTime: { key: 'pch', field: number },
  prefermentColdTemp: { key: 'pct', field: number },
  prefermentColdFirst: { key: 'pcf', field: boolean },
  starterPercent: { key: 'st', field: number },
};

const STYLE_KEY = 's';
const BAKE_AT_KEY = 'at';
const VERSION_KEY = 'v';
const MODEL_KEY = 'm';
const DEFAULT_STYLE: PizzaStyle = 'neapolitan';
const BAKE_AT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * Version of the link format: the keys above and the defaults below.
 *
 * Bump it whenever a key, a value's meaning, or any default changes — a
 * default in `defaultInputFor()`, a style preset, a preferment's variant or
 * the sourdough settings. Then:
 *   1. add the new defaults to `LINK_DEFAULTS` (the build prints them), and
 *   2. if keys or meanings changed, add a migration from the old version.
 * The build refuses to run while the live defaults differ from the current
 * snapshot, so this cannot be forgotten (`checkLinkDefaults()`).
 * See docs/calculation-pipeline.md §6.
 */
export const LINK_VERSION = 1;

/**
 * Every input's value per method, as each link version wrote them. A link only
 * carries what differed from the defaults of its own version, so it is read on
 * top of that version's snapshot — a later change of default cannot change
 * what an old link means.
 */
const LINK_DEFAULTS: Record<number, Record<Method, string>> = {
  1: {
    direct:
      's=neapolitan&n=4&w=230&h=65&i=10&sa=2.5&o=0&su=0&yt=fresh&a=1&y=0.5&ct=4&ch=24&rt=20&rh=5&b=2&bp=afterCold&tm=1&ps=30&ph=100&prh=12&prt=20&pch=0&pct=4&pcf=0&st=20',
    poolish:
      's=neapolitan&n=4&w=230&h=65&i=10&sa=2.5&o=0&su=0&yt=fresh&a=1&y=0.5&ct=4&ch=24&rt=20&rh=5&b=2&bp=afterCold&tm=1&ps=30&ph=100&prh=12&prt=20&pch=0&pct=4&pcf=0&st=20',
    biga:
      's=neapolitan&n=4&w=230&h=65&i=10&sa=2.5&o=0&su=0&yt=fresh&a=1&y=0.5&ct=4&ch=24&rt=20&rh=3&b=0.5&bp=afterCold&tm=1&ps=50&ph=45&prh=17&prt=18&pch=0&pct=4&pcf=0&st=20',
    sourdough:
      's=neapolitan&n=4&w=230&h=65&i=10&sa=2.5&o=0&su=0&yt=fresh&a=1&y=0.5&ct=4&ch=24&rt=20&rh=5&b=2&bp=afterCold&tm=1&ps=30&ph=100&prh=8&prt=22&pch=0&pct=4&pcf=0&st=20',
  },
};

/**
 * Rewrites a complete parameter set from one link version to the next,
 * keyed by the version it upgrades *from*: `MIGRATIONS[1]` turns a v1 set into
 * a v2 one. Only needed when keys or meanings change; changed defaults are
 * already handled by `LINK_DEFAULTS`. For example, renaming `ps` to `share`:
 *   1: (params) => { params.set('share', params.get('ps') ?? ''); params.delete('ps'); },
 */
const MIGRATIONS: Partial<Record<number, (params: URLSearchParams) => void>> = {};

const entries = Object.entries(FIELDS) as [
  Exclude<keyof RecipeInput, 'method'>,
  { key: string; field: Field },
][];

const encodeValue = (value: unknown): string =>
  typeof value === 'boolean' ? (value ? '1' : '0') : String(value);

const decodeValue = (raw: string, field: Field): unknown => {
  switch (field.kind) {
    case 'number': {
      const value = Number(raw);
      return raw !== '' && Number.isFinite(value) ? value : undefined;
    }
    case 'boolean':
      return raw === '1' ? true : raw === '0' ? false : undefined;
    case 'enum':
      return field.values.includes(raw) ? raw : undefined;
  }
};

/** Every input of a method's defaults, with the current keys. */
const snapshotFor = (method: Method): string => {
  const defaults = defaultInputFor(method);
  const params = new URLSearchParams();
  params.set(STYLE_KEY, DEFAULT_STYLE);
  for (const [name, { key }] of entries) params.set(key, encodeValue(defaults[name]));
  return params.toString();
};

/**
 * Throws at build time when the live defaults no longer match the snapshot of
 * the current link version, with the snapshot to add for the next one.
 */
export const checkLinkDefaults = () => {
  const methods = Object.keys(LINK_DEFAULTS[LINK_VERSION]) as Method[];
  const current = Object.fromEntries(methods.map((method) => [method, snapshotFor(method)]));
  const changed = methods.filter((method) => current[method] !== LINK_DEFAULTS[LINK_VERSION][method]);
  if (changed.length === 0) return;

  throw new Error(
    `Recipe-link defaults changed (${changed.join(', ')}). Old links would silently ` +
      `change meaning. Bump LINK_VERSION in src/lib/share.ts to ${LINK_VERSION + 1}, ` +
      `add a migration if keys changed, and add this snapshot to LINK_DEFAULTS:\n` +
      `  ${LINK_VERSION + 1}: ${JSON.stringify(current, null, 2).replace(/\n/g, '\n  ')},`
  );
};

/**
 * The URL fragment for a state, without the `#`: only what differs from the
 * page's defaults, so a fresh page has no fragment and a tweaked one stays
 * short. It lives after the `#` on purpose — browsers never send that part to
 * the server, so a recipe link reveals nothing beyond the page it is on.
 * Any non-empty fragment starts with the link and model versions it was
 * written with.
 */
export const encodeShare = (state: SharedState): string => {
  const defaults = defaultInputFor(state.input.method);
  const params = new URLSearchParams();
  if (state.style !== DEFAULT_STYLE) params.set(STYLE_KEY, state.style);
  for (const [name, { key }] of entries) {
    if (state.input[name] !== defaults[name]) params.set(key, encodeValue(state.input[name]));
  }
  if (state.bakeAt) params.set(BAKE_AT_KEY, state.bakeAt);
  if ([...params.keys()].length === 0) return '';

  const versioned = new URLSearchParams({
    [VERSION_KEY]: String(LINK_VERSION),
    [MODEL_KEY]: String(MODEL_VERSION),
  });
  params.forEach((value, key) => versioned.set(key, value));
  // A colon is fine in a fragment; leaving it unescaped keeps the bake time readable.
  return versioned.toString().replace(/%3A/gi, ':');
};

/** Why a restored recipe may not show what it showed when the link was made. */
export type LinkNotice = 'olderModel' | 'newerVersion';

const versionOf = (raw: string | null): number => {
  const version = Number(raw);
  return Number.isInteger(version) && version >= 1 ? version : 1;
};

/**
 * The state a fragment describes, or undefined when there is nothing to
 * restore. The link's values go on top of its own version's defaults, then
 * through every migration up to the current version. Unknown keys and
 * malformed values are dropped; range checks are left to the recipe, which
 * clamps every input anyway.
 */
export const decodeShare = (
  hash: string,
  method: Method
): (SharedState & { notice?: LinkNotice }) | undefined => {
  const link = new URLSearchParams(hash.replace(/^#/, ''));
  if ([...link.keys()].length === 0) return undefined;

  // Links without a version predate versioning, which started at 1.
  const linkVersion = versionOf(link.get(VERSION_KEY));
  const modelVersion = versionOf(link.get(MODEL_KEY));

  // A link from a newer page (this one is an old copy, say from a cache) can
  // only be read on today's terms, best effort.
  const baseVersion = Math.min(linkVersion, LINK_VERSION);
  const params = new URLSearchParams(LINK_DEFAULTS[baseVersion][method]);
  link.forEach((value, key) => params.set(key, value));
  for (let version = baseVersion; version < LINK_VERSION; version++) {
    MIGRATIONS[version]?.(params);
  }

  const input: Record<string, unknown> = { ...defaultInputFor(method) };
  for (const [name, { key, field }] of entries) {
    const raw = params.get(key);
    if (raw === null) continue;
    const value = decodeValue(raw, field);
    if (value !== undefined) input[name] = value;
  }

  const style = params.get(STYLE_KEY);
  const bakeAt = params.get(BAKE_AT_KEY) ?? '';
  const notice: LinkNotice | undefined =
    linkVersion > LINK_VERSION || modelVersion > MODEL_VERSION
      ? 'newerVersion'
      : modelVersion < MODEL_VERSION
      ? 'olderModel'
      : undefined;

  return {
    input: input as unknown as RecipeInput,
    style: (PIZZA_STYLES as readonly string[]).includes(style ?? '') ? (style as PizzaStyle) : DEFAULT_STYLE,
    bakeAt: BAKE_AT_PATTERN.test(bakeAt) ? bakeAt : '',
    notice,
  };
};
