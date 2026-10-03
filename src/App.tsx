import { useCallback, useState, useSyncExternalStore } from 'react';
import { Calculator } from './components/Calculator';
import { RecipeDisplay } from './components/RecipeDisplay';
import { Guide } from './components/Guide';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { UnitSystemToggle } from './components/UnitSystemToggle';
import { DEFAULT_INPUT, calculateRecipe, type Recipe } from './lib/recipe';
import type { UnitSystem } from './lib/units';
import type { Route } from './routes';

const UNIT_SYSTEM_KEY = 'unitSystem';

/**
 * The unit system lives in localStorage, read through `useSyncExternalStore`
 * so the prerendered page and its hydration both start metric and the stored
 * choice takes over straight after. The in-memory copy keeps a choice working
 * for the visit even when storage is blocked.
 */
let chosenUnitSystem: UnitSystem | undefined;
const unitSystemListeners = new Set<() => void>();

const readUnitSystem = (): UnitSystem => {
  if (chosenUnitSystem) return chosenUnitSystem;
  try {
    return localStorage.getItem(UNIT_SYSTEM_KEY) === 'imperial' ? 'imperial' : 'metric';
  } catch {
    return 'metric';
  }
};

const writeUnitSystem = (next: UnitSystem) => {
  chosenUnitSystem = next;
  try {
    localStorage.setItem(UNIT_SYSTEM_KEY, next);
  } catch {
    // Private browsing or blocked storage: the choice just will not persist.
  }
  unitSystemListeners.forEach((listener) => listener());
};

const subscribeUnitSystem = (listener: () => void) => {
  unitSystemListeners.add(listener);
  return () => {
    unitSystemListeners.delete(listener);
  };
};

const serverUnitSystem = (): UnitSystem => 'metric';

interface AppProps {
  route: Route;
}

export default function App({ route }: AppProps) {
  // Computed up front rather than waiting for the calculator's first effect, so
  // the prerendered page already carries a complete recipe.
  const [recipe, setRecipe] = useState<Recipe>(() => calculateRecipe(DEFAULT_INPUT));
  const unitSystem = useSyncExternalStore(subscribeUnitSystem, readUnitSystem, serverUnitSystem);

  // Stable identity so the calculator's effect only reruns on real input changes.
  const handleRecipeChange = useCallback((next: Recipe) => setRecipe(next), []);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 transition-colors duration-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Header method={route.method} />
        <div className="flex items-center gap-3">
          <UnitSystemToggle value={unitSystem} onChange={writeUnitSystem} />
          <LanguageSwitcher route={route} />
        </div>
      </div>
      <main className="container mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <Calculator onRecipeChange={handleRecipeChange} unitSystem={unitSystem} />
          <RecipeDisplay recipe={recipe} unitSystem={unitSystem} />
        </div>
        <Guide unitSystem={unitSystem} />
      </main>
      <Footer />
    </div>
  );
}
