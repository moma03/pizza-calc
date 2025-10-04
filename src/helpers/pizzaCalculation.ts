import { roomFermentationFactors } from './roomFermentationFactors';
import { coldFermentationFactors } from './coldFermentationFactors';
import { roomAndCold } from './roomAndCold';
import { getTotalYeast } from './yeastCalculation';

export type PizzaStyle = 'neapolitan' | 'newyork' | 'roman' | 'custom';
export type YeastType = 'instant' | 'active' | 'fresh';

export interface PizzaRecipeParams {
  numberOfPizzas: number;
  doughBallWeight: number;
  waterPercent: number;
  saltPercent: number;
  yeastType: YeastType;
  yeastPercent?: number; // Manual yeast percentage if auto-calculation is disabled
  autoCalculateYeast: boolean;
  coldFermentTemp: number;
  coldFermentTime: number;
  roomFermentTemp: number;
  roomFermentTime: number;
  addOil?: boolean;
  oilPercent?: number;
  addSugar?: boolean;
  sugarPercent?: number;
}

export interface CalculatedRecipe {
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
  yeastPercent: number;
}

export const calculatePizzaRecipe = (params: PizzaRecipeParams): CalculatedRecipe => {
  const {
    numberOfPizzas,
    doughBallWeight,
    waterPercent,
    saltPercent,
    yeastType,
    yeastPercent: manualYeastPercent,
    autoCalculateYeast,
    coldFermentTemp,
    coldFermentTime,
    roomFermentTemp,
    roomFermentTime,
    addOil = false,
    oilPercent = 0,
    addSugar = false,
    sugarPercent = 0
  } = params;

  const totalWeight = numberOfPizzas * doughBallWeight;

  // Calculate yeast based on fermentation settings
  let roomIncubation = 0;
  let coldIncubation = 0;
  let combined = 0;
  let totalYeast = 0;
  let yeastPercentage = 0;

  if (autoCalculateYeast && (coldFermentTime > 0 || roomFermentTime > 0)) {
    // Room incubation calculation
    if (roomFermentationFactors[roomFermentTemp]) {
      roomIncubation = roomFermentationFactors[roomFermentTemp] * Math.pow(roomFermentTime, -1.45);
    }

    // Cold incubation calculation
    if (coldFermentationFactors[coldFermentTemp]) {
      const timeFactor = coldFermentationFactors[coldFermentTemp].timeFactor;
      const resultFactor = coldFermentationFactors[coldFermentTemp].resultFactor;
      const coldTime = coldFermentTime;

      coldIncubation = resultFactor * (Math.pow(coldTime, timeFactor) / (Math.pow(9.8233, timeFactor) + Math.pow(coldTime, timeFactor)));
    }

    // Combined and cold percentage
    if (roomAndCold[coldFermentTime] && roomAndCold[coldFermentTime][coldFermentTemp]) {
      combined = parseFloat(parseFloat(roomAndCold[coldFermentTime][coldFermentTemp]).toFixed(10));
    }

    roomIncubation = parseFloat(roomIncubation.toFixed(10));
    coldIncubation = parseFloat(coldIncubation.toFixed(10));
    totalYeast = parseFloat(getTotalYeast(coldFermentTime, roomIncubation, combined, roomFermentTime, coldIncubation).toFixed(12));

    // Convert to the appropriate yeast type percentage
    if (yeastType === 'fresh') {
      yeastPercentage = parseFloat((totalYeast * 100).toFixed(4));
    } else if (yeastType === 'instant') {
      let value = (totalYeast / 2.5) * 100;
      yeastPercentage = parseFloat(value.toFixed(4));
    } else if (yeastType === 'active') {
      // Active dry yeast is approximately 1.25x instant dry yeast
      let instantValue = (totalYeast / 2.5) * 100;
      yeastPercentage = parseFloat((instantValue * 1.25).toFixed(4));
    }
  } else if (manualYeastPercent !== undefined) {
    yeastPercentage = manualYeastPercent;
  } else {
    // Default yeast percentages if not auto-calculating
    if (yeastType === 'fresh') {
      yeastPercentage = 0.5;
    } else if (yeastType === 'active') {
      yeastPercentage = 0.2;
    } else {
      yeastPercentage = 0.16; // instant
    }
  }

  // Calculate ingredient weights based on total percentages (Neapolitan-style calculation)
  const flourPercentage = 100;
  const percentageTotal = flourPercentage + waterPercent + saltPercent + yeastPercentage + 
    (addOil ? oilPercent : 0) + (addSugar ? sugarPercent : 0);

  const ingredientFactor = totalWeight / percentageTotal;

  // No rounding during calculation - keep full precision for accurate totals
  const flourGrams = ingredientFactor * flourPercentage;
  const waterGrams = ingredientFactor * waterPercent;
  const saltGrams = ingredientFactor * saltPercent;
  const yeastGrams = ingredientFactor * yeastPercentage;
  const oilGrams = addOil ? ingredientFactor * oilPercent : undefined;
  const sugarGrams = addSugar ? ingredientFactor * sugarPercent : undefined;

  return {
    flour: flourGrams,
    water: waterGrams,
    salt: saltGrams,
    yeast: yeastGrams,
    oil: oilGrams,
    sugar: sugarGrams,
    totalDough: totalWeight,
    doughBallWeight,
    coldFermentTime,
    coldFermentTemp,
    roomFermentTime,
    roomFermentTemp,
    yeastPercent: yeastPercentage
  };
};

// Pizza style presets with accurate recipes based on traditional methods
export const pizzaStylePresets = {
  neapolitan: {
    name: 'Neapolitan',
    waterPercent: 65,
    saltPercent: 2.5,
    doughBallWeight: 230,
    coldFermentTime: 24,
    coldFermentTemp: 4,
    roomFermentTime: 2,
    roomFermentTemp: 20
  },
  newyork: {
    name: 'New York',
    waterPercent: 62,
    saltPercent: 2,
    doughBallWeight: 240,
    coldFermentTime: 72,
    coldFermentTemp: 4,
    roomFermentTime: 2,
    roomFermentTemp: 20
  },
  roman: {
    name: 'Roman',
    waterPercent: 75,
    saltPercent: 2.5,
    doughBallWeight: 150,
    coldFermentTime: 48,
    coldFermentTemp: 4,
    roomFermentTime: 3,
    roomFermentTemp: 22
  },
  custom: {
    name: 'Custom',
    waterPercent: 65,
    saltPercent: 2.5,
    doughBallWeight: 250,
    coldFermentTime: 24,
    coldFermentTemp: 4,
    roomFermentTime: 2,
    roomFermentTemp: 20
  }
};
