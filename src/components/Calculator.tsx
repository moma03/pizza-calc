import { useState, useEffect } from 'react';
import { Info, Clock, Thermometer } from 'lucide-react';
import { Recipe } from '../App';

interface CalculatorProps {
  onRecipeCalculate: (recipe: Recipe) => void;
}

type PizzaStyle = 'neapolitan' | 'newyork' | 'roman' | 'custom';
type YeastType = 'instant' | 'fresh' | 'active';

const pizzaStylePresets = {
  neapolitan: {
    name: 'Neapolitan',
    waterPercent: 60,
    saltPercent: 2.5,
    doughBallWeight: 250,
  },
  newyork: {
    name: 'New York',
    waterPercent: 62,
    saltPercent: 2,
    doughBallWeight: 280,
  },
  roman: {
    name: 'Roman',
    waterPercent: 75,
    saltPercent: 2.5,
    doughBallWeight: 200,
  },
  custom: {
    name: 'Custom',
    waterPercent: 65,
    saltPercent: 2,
    doughBallWeight: 250,
  },
};

export function Calculator({ onRecipeCalculate }: CalculatorProps) {
  const [numberOfPizzas, setNumberOfPizzas] = useState(4);
  const [pizzaStyle, setPizzaStyle] = useState<PizzaStyle>('neapolitan');
  const [doughBallWeight, setDoughBallWeight] = useState(250);
  const [waterPercent, setWaterPercent] = useState(60);
  const [saltPercent, setSaltPercent] = useState(2.5);
  const [yeastType, setYeastType] = useState<YeastType>('instant');
  const [yeastPercent, setYeastPercent] = useState(0.3);
  const [addOil, setAddOil] = useState(false);
  const [oilPercent, setOilPercent] = useState(2);
  const [addSugar, setAddSugar] = useState(false);
  const [sugarPercent, setSugarPercent] = useState(1);
  const [coldFermentTemp, setColdFermentTemp] = useState(4);
  const [coldFermentTime, setColdFermentTime] = useState(24);
  const [roomFermentTemp, setRoomFermentTemp] = useState(20);
  const [roomFermentTime, setRoomFermentTime] = useState(2);
  const [autoCalculateYeast, setAutoCalculateYeast] = useState(true);

  useEffect(() => {
    const preset = pizzaStylePresets[pizzaStyle];
    setWaterPercent(preset.waterPercent);
    setSaltPercent(preset.saltPercent);
    setDoughBallWeight(preset.doughBallWeight);
  }, [pizzaStyle]);

  useEffect(() => {
    calculateRecipe();
  }, [numberOfPizzas, doughBallWeight, waterPercent, saltPercent, yeastPercent, yeastType, addOil, oilPercent, addSugar, sugarPercent, coldFermentTemp, coldFermentTime, roomFermentTemp, roomFermentTime, autoCalculateYeast]);

  const calculateRecipe = () => {
    const totalDough = numberOfPizzas * doughBallWeight;

    const flourBase = 100;
    let calculatedYeastPercent = yeastPercent;

    if (autoCalculateYeast) {
      calculatedYeastPercent = calculateYeastForTimeAndTemp(
        coldFermentTime,
        coldFermentTemp,
        roomFermentTime,
        roomFermentTemp
      );
    }

    const totalPercent = flourBase + waterPercent + saltPercent + calculatedYeastPercent +
      (addOil ? oilPercent : 0) + (addSugar ? sugarPercent : 0);

    const flour = (totalDough / totalPercent) * flourBase;
    const water = (flour * waterPercent) / 100;
    const salt = (flour * saltPercent) / 100;
    let yeast = (flour * calculatedYeastPercent) / 100;

    if (yeastType === 'fresh') {
      yeast = yeast * 3;
    } else if (yeastType === 'active') {
      yeast = yeast * 1.25;
    }

    const oil = addOil ? (flour * oilPercent) / 100 : undefined;
    const sugar = addSugar ? (flour * sugarPercent) / 100 : undefined;

    onRecipeCalculate({
      flour: Math.round(flour * 10) / 10,
      water: Math.round(water * 10) / 10,
      salt: Math.round(salt * 10) / 10,
      yeast: Math.round(yeast * 10) / 10,
      oil: oil ? Math.round(oil * 10) / 10 : undefined,
      sugar: sugar ? Math.round(sugar * 10) / 10 : undefined,
      totalDough: Math.round(totalDough * 10) / 10,
      doughBallWeight,
      coldFermentTime,
      coldFermentTemp,
      roomFermentTime,
      roomFermentTemp,
    });
  };

  const calculateYeastForTimeAndTemp = (
    coldHours: number,
    coldTemp: number,
    roomHours: number,
    roomTemp: number
  ): number => {
    const baseTemp = 20;
    const baseYeast = 0.3;

    const coldTempFactor = Math.pow(2, (coldTemp - baseTemp) / 10);
    const coldEquivalentHours = coldHours * coldTempFactor;

    const roomTempFactor = Math.pow(2, (roomTemp - baseTemp) / 10);
    const roomEquivalentHours = roomHours * roomTempFactor;

    const totalEquivalentHours = coldEquivalentHours + roomEquivalentHours;

    let calculatedYeast = baseYeast * (24 / Math.max(1, totalEquivalentHours));

    calculatedYeast = Math.max(0.05, Math.min(3, calculatedYeast));

    return Math.round(calculatedYeast * 100) / 100;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-orange-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <span>Recipe Settings</span>
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Number of Pizzas
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={numberOfPizzas}
            onChange={(e) => setNumberOfPizzas(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Pizza Style
          </label>
          <select
            value={pizzaStyle}
            onChange={(e) => setPizzaStyle(e.target.value as PizzaStyle)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          >
            {Object.entries(pizzaStylePresets).map(([key, value]) => (
              <option key={key} value={key}>
                {value.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            Dough Ball Weight (g)
            <Tooltip text="Weight of dough per pizza" />
          </label>
          <input
            type="number"
            min="100"
            max="500"
            value={doughBallWeight}
            onChange={(e) => setDoughBallWeight(Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              Water %
              <Tooltip text="Hydration percentage based on flour weight" />
            </label>
            <input
              type="number"
              min="50"
              max="90"
              step="0.5"
              value={waterPercent}
              onChange={(e) => setWaterPercent(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Salt %
            </label>
            <input
              type="number"
              min="1"
              max="4"
              step="0.1"
              value={saltPercent}
              onChange={(e) => setSaltPercent(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Fermentation Settings
          </h3>

          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <input
              type="checkbox"
              id="autoCalculateYeast"
              checked={autoCalculateYeast}
              onChange={(e) => setAutoCalculateYeast(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="autoCalculateYeast" className="flex-1 text-sm font-medium text-gray-700">
              Auto-calculate yeast based on time & temperature
            </label>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-blue-600" />
              Cold Fermentation
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  step="1"
                  value={coldFermentTemp}
                  onChange={(e) => setColdFermentTemp(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Time (hours)
                </label>
                <input
                  type="number"
                  min="0"
                  max="96"
                  step="1"
                  value={coldFermentTime}
                  onChange={(e) => setColdFermentTime(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-600" />
              Room Temperature Fermentation
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  min="15"
                  max="30"
                  step="1"
                  value={roomFermentTemp}
                  onChange={(e) => setRoomFermentTemp(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Time (hours)
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={roomFermentTime}
                  onChange={(e) => setRoomFermentTime(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Yeast Type
          </label>
          <select
            value={yeastType}
            onChange={(e) => setYeastType(e.target.value as YeastType)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
          >
            <option value="instant">Instant Dry Yeast</option>
            <option value="active">Active Dry Yeast</option>
            <option value="fresh">Fresh Yeast</option>
          </select>
        </div>

        {!autoCalculateYeast && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              Yeast %
              <Tooltip text="Percentage relative to flour weight" />
            </label>
            <input
              type="number"
              min="0.1"
              max="3"
              step="0.1"
              value={yeastPercent}
              onChange={(e) => setYeastPercent(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
            />
          </div>
        )}

        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="font-semibold text-gray-700">Optional Ingredients</h3>

          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              id="addOil"
              checked={addOil}
              onChange={(e) => setAddOil(e.target.checked)}
              className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
            />
            <label htmlFor="addOil" className="flex-1 text-sm font-medium text-gray-700">
              Add Oil
            </label>
            {addOil && (
              <input
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                value={oilPercent}
                onChange={(e) => setOilPercent(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                placeholder="%"
              />
            )}
          </div>

          <div className="flex items-center gap-4">
            <input
              type="checkbox"
              id="addSugar"
              checked={addSugar}
              onChange={(e) => setAddSugar(e.target.checked)}
              className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
            />
            <label htmlFor="addSugar" className="flex-1 text-sm font-medium text-gray-700">
              Add Sugar
            </label>
            {addSugar && (
              <input
                type="number"
                min="0.5"
                max="5"
                step="0.5"
                value={sugarPercent}
                onChange={(e) => setSugarPercent(Number(e.target.value))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                placeholder="%"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-gray-400 hover:text-gray-600 transition"
      >
        <Info className="w-4 h-4" />
      </button>
      {show && (
        <div className="absolute z-10 left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg">
          {text}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
