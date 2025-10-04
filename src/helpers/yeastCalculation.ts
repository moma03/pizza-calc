// Yeast calculation based on fermentation time and temperature
export const getTotalYeast = (
  coldFermentationTime: number,
  roomIncubation: number,
  combineAndCold: number,
  roomFermentationTime: number,
  coldIncubation: number
): number => {
  if (coldFermentationTime === 0) {
    return roomIncubation * 1.26;
  } else if (roomFermentationTime === 0) {
    return coldIncubation;
  } else if (coldFermentationTime >= 1 && coldFermentationTime < 5) {
    return roomIncubation * combineAndCold * 1.2;
  } else if (coldFermentationTime >= 5 && coldFermentationTime < 13) {
    return roomIncubation * combineAndCold * 1.3;
  } else if (coldFermentationTime >= 13 && coldFermentationTime < 20) {
    return roomIncubation * combineAndCold * 1.5;
  } else if (coldFermentationTime >= 20 && coldFermentationTime < 35) {
    return roomIncubation * combineAndCold * 1.48;
  } else if (coldFermentationTime >= 35 && coldFermentationTime < 50) {
    return roomIncubation * combineAndCold * 1.51;
  } else if (coldFermentationTime >= 50 && coldFermentationTime < 60) {
    return roomIncubation * combineAndCold * 1.49;
  } else if (coldFermentationTime >= 60 && coldFermentationTime < 80) {
    return roomIncubation * combineAndCold * 1.467;
  } else if (coldFermentationTime >= 80 && coldFermentationTime <= 100) {
    return combineAndCold * roomIncubation * 1.457;
  } else {
    return 0; // Default return if none of the conditions are met
  }
};

// Convert yeast amounts between different types // Not used currently
export const convertYeastType = (
  yeastAmount: number,
  fromType: 'instant' | 'active' | 'fresh',
  toType: 'instant' | 'active' | 'fresh'
): number => {
  if (fromType === toType) return yeastAmount;
  
  // Convert everything to instant dry yeast first, then to target type
  let instantAmount = yeastAmount;
  
  // Convert from source type to instant
  if (fromType === 'fresh') {
    instantAmount = yeastAmount / 2.5; // Fresh yeast to instant
  } else if (fromType === 'active') {
    instantAmount = yeastAmount / 1.25; // Active dry to instant
  }
  
  // Convert from instant to target type
  if (toType === 'fresh') {
    return instantAmount * 2.5; // Instant to fresh yeast
  } else if (toType === 'active') {
    return instantAmount * 1.25; // Instant to active dry
  }
  
  return instantAmount;
};