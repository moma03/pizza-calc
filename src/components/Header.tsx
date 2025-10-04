import { Pizza } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function Header() {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center gap-3">
      <Pizza className="w-8 h-8 text-orange-600 dark:text-orange-400" />
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('nav.title')}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{t('nav.subtitle')}</p>
      </div>
    </div>
  );
}
