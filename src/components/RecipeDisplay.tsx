import { Recipe } from '../App';
import { useTranslation } from 'react-i18next';
import type { UnitSystem } from './UnitSystemToggle';
import { convertWeight, convertTemperature } from '../helpers/convert';
import { ChefHat, Scale, Droplets, Flame, Clock } from 'lucide-react';

interface RecipeDisplayProps {
  recipe: Recipe;
  unitSystem: UnitSystem;
}

export function RecipeDisplay({ recipe, unitSystem }: RecipeDisplayProps) {
  const { t } = useTranslation();
  
  const formatWeight = (grams: number, decimals: number = 0) => {
    if (unitSystem === 'imperial') {
      const oz = convertWeight(grams, 'metric', 'imperial', true);
      const precision = oz < 1 ? 2 : decimals > 0 ? 2 : 1;
      return { value: parseFloat(oz.toFixed(precision)), unit: 'oz' };
    }
    if (decimals > 0) {
      return { value: parseFloat(grams.toFixed(decimals)), unit: 'g' };
    }
    return { value: Math.round(grams), unit: 'g' };
  };
  
  const formatTemp = (celsius: number) => {
    if (unitSystem === 'imperial') {
      const fahrenheit = Math.round(convertTemperature(celsius, 'celsius', 'fahrenheit'));
      return { value: fahrenheit, unit: '°F' };
    }
    return { value: celsius, unit: '°C' };
  };
  
  const ingredients = [
    { name: t('results.flour'), amount: formatWeight(recipe.flour, 0).value, unit: formatWeight(recipe.flour, 0).unit, icon: ChefHat, color: 'text-amber-600' },
    { name: t('results.water'), amount: formatWeight(recipe.water, 0).value, unit: formatWeight(recipe.water, 0).unit, icon: Droplets, color: 'text-blue-600' },
    { name: t('results.salt'), amount: formatWeight(recipe.salt, 2).value, unit: formatWeight(recipe.salt, 2).unit, icon: Scale, color: 'text-gray-600' },
    { name: t('results.yeast'), amount: formatWeight(recipe.yeast, 2).value, unit: formatWeight(recipe.yeast, 2).unit, icon: Flame, color: 'text-orange-600' },
  ];

  if (recipe.oil !== undefined) {
    ingredients.push({ name: t('results.oil'), amount: formatWeight(recipe.oil, 1).value, unit: formatWeight(recipe.oil, 1).unit, icon: Droplets, color: 'text-yellow-600' });
  }

  if (recipe.sugar !== undefined) {
    ingredients.push({ name: t('results.sugar'), amount: formatWeight(recipe.sugar, 1).value, unit: formatWeight(recipe.sugar, 1).unit, icon: Scale, color: 'text-pink-600' });
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-orange-100 dark:border-gray-700 transition-colors duration-300">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('results.title')}</h2>

      <div className="space-y-4 mb-8">
        {ingredients.map((ingredient) => {
          const Icon = ingredient.icon;
          return (
            <div
              key={ingredient.name}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-100 dark:border-gray-600 hover:border-orange-200 dark:hover:border-orange-400 transition"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-gray-50 dark:bg-gray-600 ${ingredient.color} dark:text-opacity-90`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{ingredient.name}</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{ingredient.amount}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">{ingredient.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t('results.totalDough')}</span>
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatWeight(recipe.totalDough, 0).value} {formatWeight(recipe.totalDough, 0).unit}
            </span>
          </div>
          <div className="flex flex-col p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{t('results.perPizza')}</span>
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatWeight(recipe.doughBallWeight, 0).value} {formatWeight(recipe.doughBallWeight, 0).unit}
            </span>
          </div>
        </div>

        {(recipe.coldFermentTime > 0 || recipe.roomFermentTime > 0) && (
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold text-gray-700 dark:text-gray-200">{t('results.totalFermentationTime')}</span>
              </div>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {recipe.coldFermentTime + recipe.roomFermentTime}h
              </span>
            </div>
            
            <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              {recipe.coldFermentTime > 0 && (
                <div 
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600 flex items-center justify-center text-white text-xs font-semibold transition-all"
                  style={{ width: `${(recipe.coldFermentTime / (recipe.coldFermentTime + recipe.roomFermentTime)) * 100}%` }}
                >
                  <span className="px-2">
                    {recipe.coldFermentTime}h
                  </span>
                </div>
              )}
              {recipe.roomFermentTime > 0 && (
                <div 
                  className="absolute top-0 h-full bg-gradient-to-r from-orange-400 to-orange-500 dark:from-orange-500 dark:to-orange-600 flex items-center justify-center text-white text-xs font-semibold transition-all"
                  style={{ 
                    left: `${(recipe.coldFermentTime / (recipe.coldFermentTime + recipe.roomFermentTime)) * 100}%`,
                    width: `${(recipe.roomFermentTime / (recipe.coldFermentTime + recipe.roomFermentTime)) * 100}%` 
                  }}
                >
                  <span className="px-2">
                    {recipe.roomFermentTime}h
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex gap-4 mt-3 text-xs">
              {recipe.coldFermentTime > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-400 to-blue-500"></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {t('results.coldFermentation')} ({formatTemp(recipe.coldFermentTemp).value}{formatTemp(recipe.coldFermentTemp).unit})
                  </span>
                </div>
              )}
              {recipe.roomFermentTime > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gradient-to-r from-orange-400 to-orange-500"></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {t('results.roomFermentation')} ({formatTemp(recipe.roomFermentTemp).value}{formatTemp(recipe.roomFermentTemp).unit})
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3">{t('results.instructions')}</h3>
        <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex gap-2">
            <span className="font-semibold text-orange-600 dark:text-orange-400">1.</span>
            <span>{t('results.step1')}</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-orange-600 dark:text-orange-400">2.</span>
            <span>{t('results.step2')}</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-orange-600 dark:text-orange-400">3.</span>
            <span>{t('results.step3')}</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-orange-600 dark:text-orange-400">4.</span>
            <span>
              {t('results.step4Prefix')}
              {recipe.coldFermentTime > 0 ? t('results.step4Cold', { 
                temp: `${formatTemp(recipe.coldFermentTemp).value}${formatTemp(recipe.coldFermentTemp).unit}`, 
                time: recipe.coldFermentTime 
              }) : ''}
              {recipe.coldFermentTime > 0 && recipe.roomFermentTime > 0 ? t('results.step4Both') : ''}
              {recipe.roomFermentTime > 0 ? t('results.step4Room', { 
                temp: `${formatTemp(recipe.roomFermentTemp).value}${formatTemp(recipe.roomFermentTemp).unit}`, 
                time: recipe.roomFermentTime 
              }) : ''}.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-orange-600 dark:text-orange-400">5.</span>
            <span>{t('results.divideInstructions', { 
              portions: Math.round(recipe.totalDough / recipe.doughBallWeight), 
              weight: formatWeight(recipe.doughBallWeight, 0).value,
              unit: formatWeight(recipe.doughBallWeight, 0).unit
            })}</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-orange-600 dark:text-orange-400">6.</span>
            <span>{t('results.step6')}</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
