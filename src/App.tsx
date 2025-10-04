import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator } from './components/Calculator';
import { RecipeDisplay } from './components/RecipeDisplay';
import { Header } from './components/Header';
import LanguageSwitcher from './components/LanguageSwitcher';
import { UnitSystemToggle, type UnitSystem } from './components/UnitSystemToggle';
import './i18n';

export interface Recipe {
  flour: number;
  water: number;
  salt: number;
  yeast: number;
  oil?: number;
  sugar?: number;
  totalDough: number;
  doughBallWeight: number;
  coldFermentTime: number;
  coldFermentTemp: number;
  roomFermentTime: number;
  roomFermentTemp: number;
}

function App() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="flex justify-between items-center px-4 py-4">
        <Header />
        <div className="flex items-center gap-3">
          <UnitSystemToggle onChange={setUnitSystem} />
          <LanguageSwitcher />
        </div>
      </div>
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8">
          <Calculator onRecipeCalculate={setRecipe} unitSystem={unitSystem} />
          {recipe && <RecipeDisplay recipe={recipe} unitSystem={unitSystem} />}
        </div>
      </main>
    </div>
  );
}

export default App;
