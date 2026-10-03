import { useTranslation } from 'react-i18next';
import { BookOpen, HelpCircle } from 'lucide-react';
import {
  calculateRecipe,
  defaultInputFor,
  resolveStarterPercent,
  resolveYeastPercent,
  variantFields,
} from '../lib/recipe';
import {
  PREFERMENTS,
  isPrefermentMethod,
  prefermentYeastPercent,
  startsCold,
  type Method,
  type YeastType,
} from '../lib/fermentation';
import { formatHours, formatQuantity, type UnitSystem } from '../lib/units';
import { round } from '../lib/math';
import { guideContent, type GuideSection } from '../guideContent';

interface GuideProps {
  method: Method;
  unitSystem: UnitSystem;
}

const TABLE_ROOM_TEMP_C = 20;
const TABLE_COLD_TEMP_C = 4;

/** Schedules for the direct-dough yeast table, as `[room hours, fridge hours]`. */
const DOUGH_SCHEDULES: readonly (readonly [number, number])[] = [
  [6, 0],
  [8, 0],
  [12, 0],
  [5, 24],
  [5, 48],
  [5, 72],
];


interface TableRow {
  key: string;
  label: string;
  /** One value per column after the schedule, in percent. */
  values: number[];
}

const headingClass = 'mb-3 text-xl font-bold text-gray-900 dark:text-white';
const paragraphClass = 'mb-3 leading-relaxed text-gray-700 dark:text-gray-300';

function Sections({ sections, columns }: { sections: GuideSection[]; columns: string }) {
  if (sections.length === 0) return null;
  return (
    <div className={`mb-8 grid gap-8 ${columns}`}>
      {sections.map(({ heading, paragraphs }) => (
        <section key={heading}>
          <h3 className={headingClass}>{heading}</h3>
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className={`${paragraphClass} text-sm`}>
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </div>
  );
}

/**
 * Explanatory text under the calculator. It is what search engines index, so
 * it is rendered into the static page; the yeast table is computed by the same
 * model as the calculator rather than typed in, so the two can never disagree.
 */
export function Guide({ method, unitSystem }: GuideProps) {
  const { t } = useTranslation();
  const temperature = (celsius: number) => formatQuantity(celsius, 'temperature', unitSystem);
  const content = guideContent(t, method);

  // A preferment's table: room-only times at its classic temperature, then
  // one row per fridge variant, each worked out for the default batch.
  const rows: TableRow[] = isPrefermentMethod(method)
    ? [
        ...PREFERMENTS[method].tableHours.map((hours) => {
          const tempC = PREFERMENTS[method].variants[0].schedule.roomTempC;
          const schedule = { roomHours: hours, roomTempC: tempC, coldHours: 0, coldTempC: 4, coldFirst: false };
          return {
            key: `${hours}`,
            label: t('guide.yeastTable.roomOnly', {
              hours: formatHours(hours),
              temp: temperature(tempC),
            }),
            // Room only, so the batch weight does not enter.
            values: [
              round(prefermentYeastPercent(method, 'fresh', schedule, 0), 2),
              round(prefermentYeastPercent(method, 'instant', schedule, 0), 2),
            ],
          };
        }),
        ...PREFERMENTS[method].variants
          .filter(({ schedule }) => schedule.coldHours > 0)
          .map((variant) => {
            const input = { ...defaultInputFor(method), ...variantFields(method, variant) };
            const yeastFor = (yeastType: YeastType) =>
              round(calculateRecipe({ ...input, yeastType }).preferment?.yeastPercent ?? 0, 2);
            const { schedule } = variant;
            const phases = [
              schedule.roomHours > 0 &&
                t('results.schedule.room', { hours: formatHours(schedule.roomHours), temp: temperature(schedule.roomTempC) }),
              t('results.schedule.cold', { hours: formatHours(schedule.coldHours), temp: temperature(schedule.coldTempC) }),
            ].filter((phase): phase is string => typeof phase === 'string');
            return {
              key: variant.id,
              label: `${t(`methods.${method}.variants.${variant.id}.label`)}: ${(
                startsCold(schedule) ? [...phases].reverse() : phases
              ).join(t('results.schedule.then'))}`,
              values: [yeastFor('fresh'), yeastFor('instant')],
            };
          }),
      ]
    : DOUGH_SCHEDULES.map(([roomHours, coldHours]) => {
        const input = {
          ...defaultInputFor(method),
          roomFermentTime: roomHours,
          roomFermentTemp: TABLE_ROOM_TEMP_C,
          coldFermentTime: coldHours,
          coldFermentTemp: TABLE_COLD_TEMP_C,
        };
        return {
          key: `${roomHours}-${coldHours}`,
          label:
            coldHours > 0
              ? t('guide.yeastTable.withCold', {
                  cold: formatHours(coldHours),
                  coldTemp: temperature(TABLE_COLD_TEMP_C),
                  room: formatHours(roomHours),
                  roomTemp: temperature(TABLE_ROOM_TEMP_C),
                })
              : t('guide.yeastTable.roomOnly', {
                  hours: formatHours(roomHours),
                  temp: temperature(TABLE_ROOM_TEMP_C),
                }),
          // Sourdough is leavened by the starter, so that is the one figure to give.
          values:
            method === 'sourdough'
              ? [round(resolveStarterPercent(input).percent, 1)]
              : [
                  round(resolveYeastPercent({ ...input, yeastType: 'fresh' }), 2),
                  round(resolveYeastPercent({ ...input, yeastType: 'instant' }), 2),
                ],
        };
      });
  const columns =
    method === 'sourdough'
      ? [t('guide.yeastTable.starter')]
      : [t('guide.yeastTable.fresh'), t('guide.yeastTable.instant')];

  return (
    <article className="mt-12 rounded-2xl border border-orange-100 bg-white p-8 shadow-xl transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
        <BookOpen className="h-6 w-6 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
        {content.title}
      </h2>
      <p className={`${paragraphClass} mb-8`}>{content.intro}</p>

      <Sections sections={content.methodSections} columns="lg:grid-cols-2" />
      <Sections sections={content.sharedSections} columns="lg:grid-cols-3" />

      <section className="border-t border-gray-200 pt-8 dark:border-gray-600">
        <h3 className={headingClass}>{t(`pages.${method}.tableHeading`)}</h3>
        <p className={`${paragraphClass} text-sm`}>{t(`pages.${method}.tableIntro`)}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600 dark:border-gray-600 dark:text-gray-300">
                <th scope="col" className="py-2 pr-4 font-semibold">
                  {t('guide.yeastTable.schedule')}
                </th>
                {columns.map((column) => (
                  <th key={column} scope="col" className="py-2 pl-4 text-right font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              {rows.map(({ key, label, values }) => (
                <tr key={key} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                  <td className="py-2 pr-4">{label}</td>
                  {values.map((value, index) => (
                    <td key={index} className="py-2 pl-4 text-right tabular-nums">
                      {value} %
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 border-t border-gray-200 pt-8 dark:border-gray-600">
        <h3 className={`${headingClass} flex items-center gap-2`}>
          <HelpCircle className="h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
          {t('guide.faq.heading')}
        </h3>
        <dl className="space-y-5">
          {content.faq.map(({ question, answer }) => (
            <div key={question}>
              <dt className="font-semibold text-gray-900 dark:text-white">{question}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{answer}</dd>
            </div>
          ))}
        </dl>
      </section>
    </article>
  );
}
