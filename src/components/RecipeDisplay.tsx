import { Recipe } from '../App';
import { ChefHat, Scale, Droplets, Flame, Clock, Thermometer } from 'lucide-react';

interface RecipeDisplayProps {
  recipe: Recipe;
}

export function RecipeDisplay({ recipe }: RecipeDisplayProps) {
  const ingredients = [
    { name: 'Flour', amount: recipe.flour, unit: 'g', icon: ChefHat, color: 'text-amber-600' },
    { name: 'Water', amount: recipe.water, unit: 'g', icon: Droplets, color: 'text-blue-600' },
    { name: 'Salt', amount: recipe.salt, unit: 'g', icon: Scale, color: 'text-gray-600' },
    { name: 'Yeast', amount: recipe.yeast, unit: 'g', icon: Flame, color: 'text-orange-600' },
  ];

  if (recipe.oil !== undefined) {
    ingredients.push({ name: 'Oil', amount: recipe.oil, unit: 'g', icon: Droplets, color: 'text-yellow-600' });
  }

  if (recipe.sugar !== undefined) {
    ingredients.push({ name: 'Sugar', amount: recipe.sugar, unit: 'g', icon: Scale, color: 'text-pink-600' });
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-orange-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Recipe</h2>

      <div className="space-y-4 mb-8">
        {ingredients.map((ingredient) => {
          const Icon = ingredient.icon;
          return (
            <div
              key={ingredient.name}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-orange-200 transition"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-gray-50 ${ingredient.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="font-semibold text-gray-700">{ingredient.name}</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">{ingredient.amount}</span>
                <span className="text-sm text-gray-500 ml-1">{ingredient.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-gray-200 pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col p-4 bg-orange-50 rounded-xl">
            <span className="text-sm font-medium text-gray-600 mb-1">Total Dough</span>
            <span className="text-2xl font-bold text-orange-600">{recipe.totalDough} g</span>
          </div>
          <div className="flex flex-col p-4 bg-amber-50 rounded-xl">
            <span className="text-sm font-medium text-gray-600 mb-1">Per Pizza</span>
            <span className="text-2xl font-bold text-amber-600">{recipe.doughBallWeight} g</span>
          </div>
        </div>

        <div className="space-y-3">
          {recipe.coldFermentTime > 0 && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-700">Cold Fermentation</span>
              </div>
              <div className="text-sm text-gray-600">
                {recipe.coldFermentTime}h at {recipe.coldFermentTemp}°C
              </div>
            </div>
          )}
          {recipe.roomFermentTime > 0 && (
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <span className="font-semibold text-gray-700">Room Temperature Fermentation</span>
              </div>
              <div className="text-sm text-gray-600">
                {recipe.roomFermentTime}h at {recipe.roomFermentTemp}°C
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
        <h3 className="font-bold text-gray-900 mb-3">Instructions</h3>
        <ol className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="font-semibold text-orange-600">1.</span>
            <span>Mix flour and water until no dry flour remains. Rest for 30 minutes (autolyse).</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-orange-600">2.</span>
            <span>Add salt and yeast. Mix until fully incorporated.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-orange-600">3.</span>
            <span>Knead for 10-15 minutes until smooth and elastic.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-orange-600">4.</span>
            <span>Bulk fermentation: {recipe.coldFermentTime > 0 ? `Cold ferment at ${recipe.coldFermentTemp}°C for ${recipe.coldFermentTime}h` : ''}{recipe.coldFermentTime > 0 && recipe.roomFermentTime > 0 ? ', then ' : ''}{recipe.roomFermentTime > 0 ? `let rise at ${recipe.roomFermentTemp}°C for ${recipe.roomFermentTime}h` : ''}.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-orange-600">5.</span>
            <span>Divide into {Math.round(recipe.totalDough / recipe.doughBallWeight)} equal portions of {recipe.doughBallWeight}g each.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-orange-600">6.</span>
            <span>Shape into tight balls and let rest for 2-4 hours at room temperature before using.</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
