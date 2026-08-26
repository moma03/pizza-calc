import { useCallback, useEffect, useState } from 'react';
import { Calculator } from './components/Calculator';
import { RecipeDisplay } from './components/RecipeDisplay';
import { Header } from './components/Header';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { UnitSystemToggle } from './components/UnitSystemToggle';
import type { Recipe } from './lib/recipe';
import type { UnitSystem } from './lib/units';

const UNIT_SYSTEM_KEY = 'unitSystem';

const readStoredUnitSystem = (): UnitSystem => {
  try {
    return localStorage.getItem(UNIT_SYSTEM_KEY) === 'imperial' ? 'imperial' : 'metric';
  } catch {
    return 'metric';
  }
};

export default function App() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(readStoredUnitSystem);

  useEffect(() => {
    try {
      localStorage.setItem(UNIT_SYSTEM_KEY, unitSystem);
    } catch {
      // Private browsing or blocked storage: the choice just will not persist.
    }
  }, [unitSystem]);

  // Stable identity so the calculator's effect only reruns on real input changes.
  const handleRecipeChange = useCallback((next: Recipe) => setRecipe(next), []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 transition-colors duration-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Header />
        <div className="flex items-center gap-3">
          <UnitSystemToggle value={unitSystem} onChange={setUnitSystem} />
          <LanguageSwitcher />
        </div>
      </div>
      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Calculator onRecipeChange={handleRecipeChange} unitSystem={unitSystem} />
          {recipe && <RecipeDisplay recipe={recipe} unitSystem={unitSystem} />}
        </div>
      </main>
    </div>
  );
}
