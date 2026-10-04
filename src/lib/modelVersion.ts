import { METHODS, PREFERMENTS, isPrefermentMethod } from './fermentation';
import { calculateRecipe, defaultInputFor, variantFields, type RecipeInput } from './recipe';

/**
 * Version of the fermentation model: every formula and calibration that turns
 * a schedule into amounts. Recipe links carry it, so a link made before a
 * change can warn that its amounts may now differ (docs/calculation-pipeline.md §6).
 *
 * Bump it whenever the results change. The build checks the reference
 * recipes below against `MODEL_FINGERPRINT` and refuses to run on a mismatch,
 * printing the new fingerprint to put here.
 */
export const MODEL_VERSION = 1;

/**
 * Results of the reference recipes at `MODEL_VERSION`, one line per recipe:
 * name, final yeast %, preferment yeast %, starter %, feed ratio, suggested
 * room hours, effective fridge hours. See `modelFingerprint()`.
 */
const MODEL_FINGERPRINT: readonly string[] = [
  'direct:0.6319:-:-:-:-:23.798',
  'direct-room8:0.6982:-:-:-:-:0.000',
  'direct-cold72:0.3717:-:-:-:-:71.764',
  'direct-beforeCold:0.6592:-:-:-:-:21.412',
  'poolish:0.3019:0.3103:-:-:-:23.798',
  'poolish-room8:0.3682:0.3103:-:-:-:0.000',
  'poolish-cold72:0.0417:0.3103:-:-:-:71.764',
  'poolish-beforeCold:0.3292:0.3103:-:-:-:21.412',
  'poolish-room:0.3019:0.3103:-:-:-:23.798',
  'poolish-fridge:0.3019:0.6285:-:-:-:23.798',
  'biga:0.0000:0.9859:-:-:-:23.798',
  'biga-room8:0.0000:0.9859:-:-:4.5:0.000',
  'biga-cold72:0.0000:0.9859:-:-:2:71.764',
  'biga-beforeCold:0.0000:0.9859:-:-:-:21.412',
  'biga-classic:0.0000:0.9859:-:-:-:23.798',
  'biga-cold:0.0000:1.8147:-:-:-:23.798',
  'biga-long:0.0000:0.3445:-:-:-:23.798',
  'sourdough:0.0000:-:22.116:2:-:23.798',
  'sourdough-room8:0.0000:-:24.436:2:-:0.000',
  'sourdough-cold72:0.0000:-:13.009:2:-:71.764',
  'sourdough-beforeCold:0.0000:-:23.073:2:-:21.412',
];

/**
 * The recipes the fingerprint is taken over: every method at its defaults,
 * same-day and long schedules, and every preferment variant — enough that any
 * change to a formula or a calibration shows up in at least one of them.
 */
const referenceInputs = (): [string, RecipeInput][] =>
  METHODS.flatMap((method): [string, RecipeInput][] => {
    const base = defaultInputFor(method);
    const cases: [string, RecipeInput][] = [
      [`${method}`, base],
      [`${method}-room8`, { ...base, roomFermentTime: 8, coldFermentTime: 0 }],
      [`${method}-cold72`, { ...base, coldFermentTime: 72, roomFermentTime: 5 }],
      [`${method}-beforeCold`, { ...base, ballingPoint: 'beforeCold' }],
    ];
    if (isPrefermentMethod(method)) {
      for (const variant of PREFERMENTS[method].variants) {
        cases.push([`${method}-${variant.id}`, { ...base, ...variantFields(method, variant) }]);
      }
    }
    return cases;
  });

/**
 * Every amount the model decides, for every reference recipe, rounded so
 * floating-point noise between machines does not count as a change.
 */
export const modelFingerprint = (): string[] =>
  referenceInputs()
    .map(([name, input]) => {
      const recipe = calculateRecipe(input);
      return [
        name,
        recipe.yeastPercent.toFixed(4),
        recipe.preferment?.yeastPercent.toFixed(4) ?? '-',
        recipe.starter?.percent.toFixed(3) ?? '-',
        recipe.starter?.feed.ratio ?? '-',
        recipe.prefermentSurplus ? recipe.prefermentSurplus.suggestedRoomHours ?? 'none' : '-',
        recipe.effectiveColdTime.toFixed(3),
      ].join(':');
    });

/**
 * Throws at build time when the model's results changed without a new
 * `MODEL_VERSION`, with the fingerprint to record for it.
 */
export const checkModelFingerprint = () => {
  const current = modelFingerprint();
  const changed = current.filter((line, index) => line !== MODEL_FINGERPRINT[index]);
  if (changed.length === 0 && current.length === MODEL_FINGERPRINT.length) return;

  throw new Error(
    `The fermentation model's results changed. Recipe links made before this ` +
      `change would show different amounts without a warning. Bump MODEL_VERSION in ` +
      `src/lib/modelVersion.ts to ${MODEL_VERSION + 1} and set MODEL_FINGERPRINT to:\n` +
      `[\n${current.map((line) => `  '${line}',`).join('\n')}\n]\n` +
      `Changed: ${changed.map((line) => line.split(':')[0]).join(', ')}`
  );
};
