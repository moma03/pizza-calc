import { useTranslation } from 'react-i18next';
import { BookOpen, HelpCircle } from 'lucide-react';
import { DEFAULT_INPUT, resolveYeastPercent } from '../lib/recipe';
import { formatHours, formatQuantity, type UnitSystem } from '../lib/units';
import { round } from '../lib/math';

interface GuideProps {
  unitSystem: UnitSystem;
}

export interface GuideSection {
  heading: string;
  paragraphs: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

const TABLE_ROOM_TEMP_C = 20;
const TABLE_COLD_TEMP_C = 4;

/** Schedules for the yeast table, as `[room hours, fridge hours]`. */
const TABLE_SCHEDULES: readonly (readonly [number, number])[] = [
  [6, 0],
  [8, 0],
  [12, 0],
  [5, 24],
  [5, 48],
  [5, 72],
];

/**
 * Explanatory text under the calculator. It is what search engines index, so
 * it is rendered into the static page; the yeast table is computed by the same
 * model as the calculator rather than typed in, so the two can never disagree.
 */
export function Guide({ unitSystem }: GuideProps) {
  const { t } = useTranslation();
  const temperature = (celsius: number) => formatQuantity(celsius, 'temperature', unitSystem);

  const sections = t('guide.sections', { returnObjects: true }) as GuideSection[];
  const faq = t('guide.faq.items', { returnObjects: true }) as FaqItem[];

  const rows = TABLE_SCHEDULES.map(([roomHours, coldHours]) => {
    const input = {
      ...DEFAULT_INPUT,
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
      fresh: round(resolveYeastPercent({ ...input, yeastType: 'fresh' }), 2),
      instant: round(resolveYeastPercent({ ...input, yeastType: 'instant' }), 2),
    };
  });

  const headingClass = 'mb-3 text-xl font-bold text-gray-900 dark:text-white';
  const paragraphClass = 'mb-3 leading-relaxed text-gray-700 dark:text-gray-300';

  return (
    <article className="mt-12 rounded-2xl border border-orange-100 bg-white p-8 shadow-xl transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
        <BookOpen className="h-6 w-6 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden="true" />
        {t('guide.title')}
      </h2>
      <p className={`${paragraphClass} mb-8`}>{t('guide.intro')}</p>

      <div className="grid gap-8 lg:grid-cols-3">
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

      <section className="mt-8 border-t border-gray-200 pt-8 dark:border-gray-600">
        <h3 className={headingClass}>{t('guide.yeastTable.heading')}</h3>
        <p className={`${paragraphClass} text-sm`}>{t('guide.yeastTable.intro')}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600 dark:border-gray-600 dark:text-gray-300">
                <th scope="col" className="py-2 pr-4 font-semibold">
                  {t('guide.yeastTable.schedule')}
                </th>
                <th scope="col" className="py-2 pr-4 text-right font-semibold">
                  {t('guide.yeastTable.fresh')}
                </th>
                <th scope="col" className="py-2 text-right font-semibold">
                  {t('guide.yeastTable.instant')}
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              {rows.map(({ key, label, fresh, instant }) => (
                <tr key={key} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                  <td className="py-2 pr-4">{label}</td>
                  <td className="py-2 pr-4 text-right tabular-nums">{fresh} %</td>
                  <td className="py-2 text-right tabular-nums">{instant} %</td>
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
          {faq.map(({ question, answer }) => (
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
