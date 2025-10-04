import { useState, useEffect } from 'react';
import { Calculator } from './components/Calculator';
import { RecipeDisplay } from './components/RecipeDisplay';
import { Header } from './components/Header';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-8">
          <Calculator onRecipeCalculate={setRecipe} />
          {recipe && <RecipeDisplay recipe={recipe} />}
        </div>
      </main>
    </div>
  );
}

export default App;
