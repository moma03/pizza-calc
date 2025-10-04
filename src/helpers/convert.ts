// Unit conversion utilities

export const convertWeight = (
  value: number,
  from: 'metric' | 'imperial',
  to: 'metric' | 'imperial',
  toFixed: boolean = false
): number => {
  let returnValue = value;
  
  if (from === 'metric' && to === 'imperial') {
    returnValue = value / 28.34952; // grams to ounces
  }
  
  if (from === 'imperial' && to === 'metric') {
    returnValue = value * 28.34952; // ounces to grams
  }
  
  if (toFixed) {
    return parseFloat(returnValue.toFixed(2));
  }
  
  return returnValue;
};

export const convertVolume = (
  value: number,
  from: 'metric' | 'imperial',
  to: 'metric' | 'imperial',
  toFixed: boolean = false
): number => {
  let returnValue = value;
  
  if (from === 'metric' && to === 'imperial') {
    returnValue = value * 0.033814; // ml to fl oz
  }
  
  if (from === 'imperial' && to === 'metric') {
    returnValue = value / 0.033814; // fl oz to ml
  }
  
  if (toFixed) {
    return parseFloat(returnValue.toFixed(2));
  }
  
  return returnValue;
};

export const convertTemperature = (
  value: number,
  from: 'celsius' | 'fahrenheit',
  to: 'celsius' | 'fahrenheit'
): number => {
  if (from === to) return value;
  
  if (from === 'celsius' && to === 'fahrenheit') {
    return (value * 9/5) + 32;
  }
  
  if (from === 'fahrenheit' && to === 'celsius') {
    return (value - 32) * 5/9;
  }
  
  return value;
};