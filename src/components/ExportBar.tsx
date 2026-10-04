import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarPlus, Check, Link2, Printer } from 'lucide-react';
import { buildCalendar, downloadFile } from '../lib/calendar';
import type { Method } from '../lib/fermentation';
import { stepStart, type IngredientLine, type Plan, type StepKey } from '../plan';

interface ExportBarProps {
  plan: Plan;
  method: Method;
  bakeAt: string;
  /** Path and fragment of the link to this recipe. */
  sharePath: string;
}

/** Minutes a calendar entry blocks out: baking takes a while, the rest is a quick task. */
const EVENT_MINUTES: Partial<Record<StepKey, number>> = { bake: 45, knead: 30 };

const listLines = (heading: string, lines: IngredientLine[]): string =>
  [heading, ...lines.map(({ label, amount }) => `• ${label}: ${amount}`)].join('\n');

const buttonClass =
  'inline-flex items-center gap-2 rounded-lg border border-orange-300 bg-white px-3 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-700 dark:bg-gray-800 dark:text-orange-200 dark:hover:bg-gray-700';

/**
 * Ways to take the recipe away from the page: a link that restores every
 * setting, a calendar file with one reminder per step, and a print layout to
 * save as PDF. All of it happens in the browser.
 */
export function ExportBar({ plan, method, bakeAt, sharePath }: ExportBarProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const shareUrl = () => new URL(sharePath, window.location.origin).href;

  const copyLink = async () => {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard access (insecure context, denied permission): let the
      // visitor copy it by hand.
      window.prompt(t('results.export.copyLink'), url);
    }
  };

  const addToCalendar = () => {
    const url = shareUrl();
    const linkLine = `${t('results.export.recipeLink')} ${url}`;
    const events = plan.steps.flatMap((step) => {
      const start = stepStart(bakeAt, plan, step.at);
      if (!start) return [];
      // The steps that need weighing carry their ingredient list along.
      const ingredients =
        step.key === 'preferment' || step.key === 'feed'
          ? listLines(plan.stageName, plan.stageIngredients)
          : step.key === 'knead'
          ? listLines(t('results.export.finalDough'), plan.ingredients)
          : undefined;
      return [
        {
          title: step.title,
          description: [step.text, ingredients, linkLine].filter(Boolean).join('\n\n'),
          start,
          durationMinutes: EVENT_MINUTES[step.key] ?? 15,
        },
      ];
    });

    const calendar = buildCalendar(events, {
      calendarName: t(`pages.${method}.heading`),
      url,
    });
    downloadFile(calendar, `pizza-${method}-${bakeAt.slice(0, 10)}.ics`, 'text/calendar;charset=utf-8');
  };

  return (
    <div className="mt-6 border-t border-orange-200 pt-4 dark:border-orange-800 print:hidden">
      <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
        {t('results.export.heading')}
      </h4>
      <p className="mb-3 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
        {t('results.export.linkNote')}
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copyLink} className={buttonClass}>
          {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
          <span aria-live="polite">{t(copied ? 'results.export.copied' : 'results.export.copyLink')}</span>
        </button>
        <button type="button" onClick={addToCalendar} disabled={!bakeAt} className={buttonClass}>
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          {t('results.export.calendar')}
        </button>
        <button type="button" onClick={() => window.print()} className={buttonClass}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          {t('results.export.print')}
        </button>
      </div>
      {!bakeAt && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('results.export.calendarHint')}</p>
      )}
    </div>
  );
}
