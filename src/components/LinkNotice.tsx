import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X } from 'lucide-react';
import type { LinkNotice as Notice } from '../lib/share';

interface LinkNoticeProps {
  notice?: Notice;
}

/**
 * Shown when a recipe link was made with a different version of the model,
 * so the amounts on screen may not be the ones the baker saw — and may
 * already have mixed a preferment with (docs/calculation-pipeline.md §6).
 */
export function LinkNotice({ notice }: LinkNoticeProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  if (!notice || dismissed) return null;

  return (
    <div
      role="alert"
      className="mb-8 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100 print:hidden"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="flex-1 leading-relaxed">
        <p className="font-semibold">{t(`linkNotice.${notice}.title`)}</p>
        <p className="mt-1">{t(`linkNotice.${notice}.body`)}</p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t('linkNotice.dismiss')}
        className="h-fit rounded p-1 transition hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:hover:bg-amber-900/50"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
