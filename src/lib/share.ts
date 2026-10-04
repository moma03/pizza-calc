import { YEAST_TYPES, type Method } from './fermentation';
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
const DEFAULT_STYLE: PizzaStyle = 'neapolitan';
const BAKE_AT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

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

/**
 * The URL fragment for a state, without the `#`: only what differs from the
 * page's defaults, so a fresh page has no fragment and a tweaked one stays
 * short. It lives after the `#` on purpose — browsers never send that part to
 * the server, so a recipe link reveals nothing beyond the page it is on.
 */
export const encodeShare = (state: SharedState): string => {
  const defaults = defaultInputFor(state.input.method);
  const params = new URLSearchParams();
  if (state.style !== DEFAULT_STYLE) params.set(STYLE_KEY, state.style);
  for (const [name, { key }] of entries) {
    if (state.input[name] !== defaults[name]) params.set(key, encodeValue(state.input[name]));
  }
  if (state.bakeAt) params.set(BAKE_AT_KEY, state.bakeAt);
  // A colon is fine in a fragment; leaving it unescaped keeps the bake time readable.
  return params.toString().replace(/%3A/gi, ':');
};

/**
 * The state a fragment describes, on top of the method's defaults, or
 * undefined when there is nothing to restore. Unknown keys and malformed
 * values are dropped; range checks are left to the recipe, which clamps
 * every input anyway.
 */
export const decodeShare = (hash: string, method: Method): SharedState | undefined => {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if ([...params.keys()].length === 0) return undefined;

  const input: Record<string, unknown> = { ...defaultInputFor(method) };
  for (const [name, { key, field }] of entries) {
    const raw = params.get(key);
    if (raw === null) continue;
    const value = decodeValue(raw, field);
    if (value !== undefined) input[name] = value;
  }

  const style = params.get(STYLE_KEY);
  const bakeAt = params.get(BAKE_AT_KEY) ?? '';
  return {
    input: input as unknown as RecipeInput,
    style: (PIZZA_STYLES as readonly string[]).includes(style ?? '') ? (style as PizzaStyle) : DEFAULT_STYLE,
    bakeAt: BAKE_AT_PATTERN.test(bakeAt) ? bakeAt : '',
  };
};
