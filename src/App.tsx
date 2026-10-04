import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator } from './components/Calculator';
import { RecipeDisplay } from './components/RecipeDisplay';
import { Guide } from './components/Guide';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { UnitSystemToggle } from './components/UnitSystemToggle';
import {
  calculateRecipe,
  defaultInputFor,
  type PizzaStyle,
  type Recipe,
  type RecipeInput,
} from './lib/recipe';
import { encodeShare, type SharedState } from './lib/share';
import type { Method } from './lib/fermentation';
import { pageHref } from './navigation';
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
  /** Settings from a recipe link; the page's defaults when absent. */
  initialState?: SharedState;
}

export default function App({ route: initialRoute, initialState }: AppProps) {
  const { t } = useTranslation();
  const [route, setRoute] = useState(initialRoute);
  const [initial] = useState<SharedState>(
    () =>
      initialState ?? {
        input: defaultInputFor(initialRoute.method),
        style: 'neapolitan',
        bakeAt: '',
      }
  );
  // Computed up front rather than waiting for the calculator's first effect, so
  // the prerendered page already carries a complete recipe.
  const [recipe, setRecipe] = useState<Recipe>(() => calculateRecipe(initial.input));
  const [form, setForm] = useState({ input: initial.input, style: initial.style });
  const [bakeAt, setBakeAt] = useState(initial.bakeAt);
  const unitSystem = useSyncExternalStore(subscribeUnitSystem, readUnitSystem, serverUnitSystem);

  // Stable identity so the calculator's effects only rerun on real input changes.
  const handleRecipeChange = useCallback((next: Recipe) => setRecipe(next), []);
  const handleInputChange = useCallback(
    (input: RecipeInput, style: PizzaStyle) => setForm({ input, style }),
    []
  );

  // Keep the address bar a link to exactly this recipe: the method's page plus
  // whatever differs from its defaults after the `#` (src/lib/share.ts).
  const hash = encodeShare({ ...form, bakeAt });
  const sharePath = `${pageHref(route)}${hash ? `#${hash}` : ''}`;
  useEffect(() => {
    if (sharePath !== `${window.location.pathname}${window.location.hash}`) {
      window.history.replaceState(null, '', sharePath);
    }
  }, [sharePath]);

  /**
   * Switching method in the form switches page too, without a reload: every
   * method has its own URL, so the address stays shareable and a reload lands
   * on the matching prerendered page.
   */
  const handleMethodChange = (method: Method) => {
    const next = { ...route, method };
    setRoute(next);
    document.title = t(`pages.${method}.title`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 transition-colors duration-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 print:bg-none">
      {/* On paper only the recipe is printed; see the print rules in index.css. */}
      <div className="container mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 print:hidden">
        <Header method={route.method} />
        <div className="flex items-center gap-3">
          <UnitSystemToggle value={unitSystem} onChange={writeUnitSystem} />
          <LanguageSwitcher route={route} />
        </div>
      </div>
      <main className="container mx-auto w-full max-w-7xl flex-1 px-4 py-8 print:max-w-none print:p-0">
        <div className="grid gap-8 lg:grid-cols-2 print:block">
          <Calculator
            initialInput={initial.input}
            initialStyle={initial.style}
            onRecipeChange={handleRecipeChange}
            onInputChange={handleInputChange}
            onMethodChange={handleMethodChange}
            unitSystem={unitSystem}
          />
          <RecipeDisplay
            recipe={recipe}
            unitSystem={unitSystem}
            bakeAt={bakeAt}
            onBakeAtChange={setBakeAt}
            sharePath={sharePath}
          />
        </div>
        <Guide method={route.method} unitSystem={unitSystem} />
      </main>
      <Footer />
    </div>
  );
}
