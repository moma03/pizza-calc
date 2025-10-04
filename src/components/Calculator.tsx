import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Clock, Thermometer } from 'lucide-react';
import { Recipe } from '../App';
import type { UnitSystem } from './UnitSystemToggle';
import { 
  calculatePizzaRecipe, 
  pizzaStylePresets, 
  type PizzaStyle, 
  type YeastType, 
  type PizzaRecipeParams  
} from '../helpers/pizzaCalculation';

interface CalculatorProps {
  onRecipeCalculate: (recipe: Recipe) => void;
  unitSystem: UnitSystem;
}

export function Calculator({ onRecipeCalculate, unitSystem }: CalculatorProps) {
  const { t } = useTranslation();
  const [numberOfPizzas, setNumberOfPizzas] = useState<number | string>(4);
  const [pizzaStyle, setPizzaStyle] = useState<PizzaStyle>('neapolitan');
  const [doughBallWeight, setDoughBallWeight] = useState<number | string>(250);
  const [waterPercent, setWaterPercent] = useState<number | string>(60);
  const [saltPercent, setSaltPercent] = useState<number | string>(2.5);
  const [yeastType, setYeastType] = useState<YeastType>('instant');
  const [yeastPercent, setYeastPercent] = useState<number | string>(0.3);
  const [oilPercent, setOilPercent] = useState<number | string>(0);
  const [sugarPercent, setSugarPercent] = useState<number | string>(0);
  const [coldFermentTemp, setColdFermentTemp] = useState<number | string>(4);
  const [coldFermentTime, setColdFermentTime] = useState<number | string>(24);
  const [roomFermentTemp, setRoomFermentTemp] = useState<number | string>(20);
  const [roomFermentTime, setRoomFermentTime] = useState<number | string>(2);
  const [autoCalculateYeast, setAutoCalculateYeast] = useState(true);

  // Helper function to safely convert input values to numbers with defaults
  const getNumericValue = (value: number | string, defaultValue: number): number => {
    if (typeof value === 'number') return value;
    if (value === '' || value === null || value === undefined) return defaultValue;
    const parsed = parseFloat(value.toString());
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // Helper function to handle input changes that can be empty
  const handleNumericInput = (
    value: string, 
    setter: (value: number | string) => void,
    min?: number,
    max?: number
  ) => {
    if (value === '') {
      setter('');
      return;
    }
    
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      let finalValue = parsed;
      if (min !== undefined) finalValue = Math.max(min, finalValue);
      if (max !== undefined) finalValue = Math.min(max, finalValue);
      setter(finalValue);
    }
  };

  // Helper function to handle blur events (when user leaves input field)
  const handleInputBlur = (
    value: number | string,
    setter: (value: number | string) => void,
    defaultValue: number,
    min?: number,
    max?: number
  ) => {
    if (value === '' || value === null || value === undefined) {
      setter(defaultValue);
      return;
    }
    
    const parsed = parseFloat(value.toString());
    if (isNaN(parsed)) {
      setter(defaultValue);
      return;
    }
    
    let finalValue = parsed;
    if (min !== undefined) finalValue = Math.max(min, finalValue);
    if (max !== undefined) finalValue = Math.min(max, finalValue);
    setter(finalValue);
  };

  useEffect(() => {
    const preset = pizzaStylePresets[pizzaStyle];
    setWaterPercent(preset.waterPercent);
    setSaltPercent(preset.saltPercent);
    setDoughBallWeight(preset.doughBallWeight);
    setColdFermentTime(preset.coldFermentTime);
    setColdFermentTemp(preset.coldFermentTemp);
    setRoomFermentTime(preset.roomFermentTime);
    setRoomFermentTemp(preset.roomFermentTemp);
  }, [pizzaStyle]);

  useEffect(() => {
    calculateRecipe();
  }, [numberOfPizzas, doughBallWeight, waterPercent, saltPercent, yeastPercent, yeastType, oilPercent, sugarPercent, coldFermentTemp, coldFermentTime, roomFermentTemp, roomFermentTime, autoCalculateYeast]);

  const calculateRecipe = () => {
    try {
      const params: PizzaRecipeParams = {
        numberOfPizzas: getNumericValue(numberOfPizzas, 4),
        doughBallWeight: getNumericValue(doughBallWeight, 250),
        waterPercent: getNumericValue(waterPercent, 65),
        saltPercent: getNumericValue(saltPercent, 2.5),
        yeastType,
        yeastPercent: !autoCalculateYeast ? getNumericValue(yeastPercent, 0.2) : undefined,
        autoCalculateYeast,
        coldFermentTemp: getNumericValue(coldFermentTemp, 4),
        coldFermentTime: getNumericValue(coldFermentTime, 24),
        roomFermentTemp: getNumericValue(roomFermentTemp, 20),
        roomFermentTime: getNumericValue(roomFermentTime, 2),
        addOil: getNumericValue(oilPercent, 0) > 0,
        oilPercent: getNumericValue(oilPercent, 0),
        addSugar: getNumericValue(sugarPercent, 0) > 0,
        sugarPercent: getNumericValue(sugarPercent, 0)
      };

      const calculatedRecipe = calculatePizzaRecipe(params);
      
      onRecipeCalculate({
        flour: calculatedRecipe.flour,
        water: calculatedRecipe.water,
        salt: calculatedRecipe.salt,
        yeast: calculatedRecipe.yeast,
        oil: calculatedRecipe.oil,
        sugar: calculatedRecipe.sugar,
        totalDough: calculatedRecipe.totalDough,
        doughBallWeight: calculatedRecipe.doughBallWeight,
        coldFermentTime: calculatedRecipe.coldFermentTime,
        coldFermentTemp: calculatedRecipe.coldFermentTemp,
        roomFermentTime: calculatedRecipe.roomFermentTime,
        roomFermentTemp: calculatedRecipe.roomFermentTemp,
      });
      
      // Update the yeast percentage display for manual mode
      if (!autoCalculateYeast) {
        setYeastPercent(calculatedRecipe.yeastPercent);
      }
    } catch (error) {
      console.error('Error calculating recipe:', error);
      // Fallback to basic calculation if there's an error
      const numPizzas = getNumericValue(numberOfPizzas, 4);
      const numDoughWeight = getNumericValue(doughBallWeight, 250);
      const numWater = getNumericValue(waterPercent, 65);
      const numSalt = getNumericValue(saltPercent, 2.5);
      const numOil = getNumericValue(oilPercent, 2);
      const numSugar = getNumericValue(sugarPercent, 1);
      
      const totalDough = numPizzas * numDoughWeight;
      const flourBase = 100;
      const basicYeastPercent = 0.2; // 0.2% as fallback
      
      const totalPercent = flourBase + numWater + numSalt + basicYeastPercent +
        numOil + numSugar;

      const flour = (totalDough / totalPercent) * flourBase;
      const water = (flour * numWater) / 100;
      const salt = (flour * numSalt) / 100;
      const yeast = (flour * basicYeastPercent) / 100;

      onRecipeCalculate({
        flour: Math.round(flour),
        water: Math.round(water),
        salt: Math.round(salt * 10) / 10,
        yeast: Math.round(yeast * 10) / 10,
        oil: numOil > 0 ? (flour * numOil) / 100 : undefined,
        sugar: numSugar > 0 ? (flour * numSugar) / 100 : undefined,
        totalDough,
        doughBallWeight: numDoughWeight,
        coldFermentTime: getNumericValue(coldFermentTime, 24),
        coldFermentTemp: getNumericValue(coldFermentTemp, 4),
        roomFermentTime: getNumericValue(roomFermentTime, 2),
        roomFermentTemp: getNumericValue(roomFermentTemp, 20),
      });
    }
  };



  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-orange-100 dark:border-gray-700 transition-colors duration-300">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <span>{t('calculator.recipeSettings')}</span>
      </h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('calculator.numberOfPizzas')}
          </label>
          <input
            type="number"
            min="1"
            max="50"
            value={numberOfPizzas}
            onChange={(e) => handleNumericInput(e.target.value, setNumberOfPizzas, 1, 50)}
            onBlur={() => handleInputBlur(numberOfPizzas, setNumberOfPizzas, 4, 1, 50)}
            placeholder="4"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('calculator.pizzaStyle')}
          </label>
          <select
            value={pizzaStyle}
            onChange={(e) => setPizzaStyle(e.target.value as PizzaStyle)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {Object.entries(pizzaStylePresets).map(([key, value]) => (
              <option key={key} value={key}>
                {t(`calculator.pizzaStyles.${key}`) || value.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            {t('calculator.doughBallWeight')} ({unitSystem === 'metric' ? 'g' : 'oz'})
            <Tooltip text={t('calculator.doughBallWeightTooltip')} />
          </label>
          <input
            type="number"
            min="100"
            max="500"
            value={doughBallWeight}
            onChange={(e) => handleNumericInput(e.target.value, setDoughBallWeight, 100, 500)}
            onBlur={() => handleInputBlur(doughBallWeight, setDoughBallWeight, 250, 100, 500)}
            placeholder={t('placeholders.doughWeight')}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              {t('calculator.waterPercent')}
              <Tooltip text={t('calculator.waterPercentTooltip')} />
            </label>
            <input
              type="number"
              min="50"
              max="90"
              step="0.5"
              value={waterPercent}
              onChange={(e) => handleNumericInput(e.target.value, setWaterPercent, 50, 90)}
              onBlur={() => handleInputBlur(waterPercent, setWaterPercent, 65, 50, 90)}
              placeholder={t('placeholders.hydration')}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('calculator.saltPercent')}
            </label>
            <input
              type="number"
              min="1"
              max="4"
              step="0.1"
              value={saltPercent}
              onChange={(e) => handleNumericInput(e.target.value, setSaltPercent, 1, 4)}
              onBlur={() => handleInputBlur(saltPercent, setSaltPercent, 2.5, 1, 4)}
              placeholder={t('placeholders.salt')}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            {t('calculator.fermentationSettings')}
          </h3>

          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <input
              type="checkbox"
              id="autoCalculateYeast"
              checked={autoCalculateYeast}
              onChange={(e) => setAutoCalculateYeast(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="autoCalculateYeast" className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('calculator.autoCalculateYeast')}
            </label>
          </div>

          {autoCalculateYeast && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {t('calculator.fermentation.cold')}
                </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {t('calculator.fermentation.temperature')} ({unitSystem === 'metric' ? '°C' : '°F'})
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  step="1"
                  value={coldFermentTemp}
                  onChange={(e) => handleNumericInput(e.target.value, setColdFermentTemp, 0, 15)}
                  onBlur={() => handleInputBlur(coldFermentTemp, setColdFermentTemp, 4, 0, 15)}
                  placeholder="4"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {t('calculator.fermentation.time')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="96"
                  step="1"
                  value={coldFermentTime}
                  onChange={(e) => handleNumericInput(e.target.value, setColdFermentTime, 0, 96)}
                  onBlur={() => handleInputBlur(coldFermentTime, setColdFermentTime, 24, 0, 96)}
                  placeholder="24"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              {t('calculator.fermentation.roomTemperature')}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {t('calculator.fermentation.temperature')} ({unitSystem === 'metric' ? '°C' : '°F'})
                </label>
                <input
                  type="number"
                  min="15"
                  max="30"
                  step="1"
                  value={roomFermentTemp}
                  onChange={(e) => handleNumericInput(e.target.value, setRoomFermentTemp, 15, 30)}
                  onBlur={() => handleInputBlur(roomFermentTemp, setRoomFermentTemp, 20, 15, 30)}
                  placeholder="20"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {t('calculator.fermentation.time')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={roomFermentTime}
                  onChange={(e) => handleNumericInput(e.target.value, setRoomFermentTime, 0, 24)}
                  onBlur={() => handleInputBlur(roomFermentTime, setRoomFermentTime, 2, 0, 24)}
                  placeholder="2"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('calculator.yeastType')}
          </label>
          <select
            value={yeastType}
            onChange={(e) => setYeastType(e.target.value as YeastType)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="instant">{t('calculator.yeastTypes.instant')}</option>
            <option value="active">{t('calculator.yeastTypes.active')}</option>
            <option value="fresh">{t('calculator.yeastTypes.fresh')}</option>
          </select>
        </div>
            </>
          )}

        {!autoCalculateYeast && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              {t('calculator.yeastPercent')}
              <Tooltip text={t('calculator.yeastPercentTooltip')} />
            </label>
            <input
              type="number"
              min="0.1"
              max="3"
              step="0.1"
              value={yeastPercent}
              onChange={(e) => setYeastPercent(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        )}

        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">{t('calculator.optionalIngredients')}</h3>

          <div className="relative">
            <label htmlFor="oilPercent" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('calculator.oilPercent')}
              <div className="group relative">
                <Info size={16} className="text-gray-400 dark:text-gray-500 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-10">
                  {t('calculator.oilPercentTooltip')}
                </div>
              </div>
            </label>
            <input
              type="number"
              id="oilPercent"
              min="0"
              max="10"
              step="0.5"
              value={oilPercent}
              onChange={(e) => handleNumericInput(e.target.value, setOilPercent, 0, 10)}
              onBlur={() => handleInputBlur(oilPercent, setOilPercent, 0, 0, 10)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="0"
            />
          </div>

          <div className="relative">
            <label htmlFor="sugarPercent" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('calculator.sugarPercent')}
              <div className="group relative">
                <Info size={16} className="text-gray-400 dark:text-gray-500 cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-10">
                  {t('calculator.sugarPercentTooltip')}
                </div>
              </div>
            </label>
            <input
              type="number"
              id="sugarPercent"
              min="0"
              max="5"
              step="0.5"
              value={sugarPercent}
              onChange={(e) => handleNumericInput(e.target.value, setSugarPercent, 0, 5)}
              onBlur={() => handleInputBlur(sugarPercent, setSugarPercent, 0, 0, 5)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="0"
            />
          </div>
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
        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400 transition"
      >
        <Info className="w-4 h-4" />
      </button>
      {show && (
        <div className="absolute z-10 left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg whitespace-nowrap shadow-lg">
          {text}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
        </div>
      )}
    </div>
  );
}
