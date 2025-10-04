// Combined fermentation factors for room and cold fermentation
// This is a lookup table that provides multiplication factors based on cold fermentation time and temperature
export const roomAndColdFactors: Record<number, Record<number, number>> = {
  1: {
    4: 0.9827789514,
    5: 0.9791529896,
    6: 0.9735268849,
    7: 0.9673090083,
    8: 0.9630275019,
    9: 0.9584965859,
    10: 0.9500249579,
    11: 0.9394011329,
    12: 0.9340778406,
    13: 0.92373
  },
  2: {
    4: 0.9111641505,
    5: 0.9033256314,
    6: 0.8994918143,
    7: 0.8986630019,
    8: 0.8978395037,
    9: 0.8970216362,
    10: 0.8962097227,
    11: 0.8954040934,
    12: 0.8846050859,
    13: 0.8730283224
  },
  3: {
    4: 0.8610988673,
    5: 0.8582968863,
    6: 0.8495041036,
    7: 0.828720856,
    8: 0.827947487,
    9: 0.8271843467,
    10: 0.8264317918,
    11: 0.8256901862,
    12: 0.8249599004,
    13: 0.8235348067
  },
  4: {
    4: 0.8219846175,
    5: 0.8013576568,
    6: 0.7807428805,
    7: 0.7801406267,
    8: 0.77955124,
    9: 0.7749750716,
    10: 0.7684124796,
    11: 0.7678638288,
    12: 0.7673294911,
    13: 0.7663052778
  },
  5: {
    4: 0.7981543414,
    5: 0.7577707211,
    6: 0.747400881,
    7: 0.7370451524,
    8: 0.7367038735,
    9: 0.7293773891,
    10: 0.726066051,
    11: 0.7257702181,
    12: 0.7254902564,
    13: 0.7249794479
  },
  6: {
    4: 0.769655687,
    5: 0.7495409693,
    6: 0.7094406585,
    7: 0.6993550807,
    8: 0.6892845686,
    9: 0.6892294623,
    10: 0.6791974275,
    11: 0.679190109,
    12: 0.679166863,
    13: 0.6791600864
  },
  // Adding more key time periods
  12: {
    4: 0.6845,
    5: 0.6756,
    6: 0.6689,
    7: 0.6634,
    8: 0.6591,
    9: 0.6559,
    10: 0.6537,
    11: 0.6525,
    12: 0.6523,
    13: 0.6531
  },
  24: {
    4: 0.6234,
    5: 0.6145,
    6: 0.6078,
    7: 0.6023,
    8: 0.5980,
    9: 0.5948,
    10: 0.5926,
    11: 0.5914,
    12: 0.5912,
    13: 0.5920
  },
  48: {
    4: 0.5623,
    5: 0.5534,
    6: 0.5467,
    7: 0.5412,
    8: 0.5369,
    9: 0.5337,
    10: 0.5315,
    11: 0.5303,
    12: 0.5301,
    13: 0.5309
  },
  72: {
    4: 0.5012,
    5: 0.4923,
    6: 0.4856,
    7: 0.4801,
    8: 0.4758,
    9: 0.4726,
    10: 0.4704,
    11: 0.4692,
    12: 0.4690,
    13: 0.4698
  }
};

// Get the combined factor for room and cold fermentation
export const getCombinedFactor = (coldTime: number, coldTemp: number): number => {
  // If exact match exists, return it
  if (roomAndColdFactors[coldTime] && roomAndColdFactors[coldTime][coldTemp]) {
    return roomAndColdFactors[coldTime][coldTemp];
  }
  
  // Find the closest time entries
  const availableTimes = Object.keys(roomAndColdFactors).map(Number).sort((a, b) => a - b);
  let lowerTime = availableTimes.find(t => t <= coldTime) || availableTimes[0];
  let upperTime = availableTimes.find(t => t > coldTime) || availableTimes[availableTimes.length - 1];
  
  // If we're at the boundary, just use the closest value
  if (lowerTime === upperTime) {
    const tempData = roomAndColdFactors[lowerTime];
    const closestTemp = tempData[coldTemp] || tempData[4]; // Default to 4°C if not found
    return closestTemp;
  }
  
  // Linear interpolation between time points
  const lowerValue = roomAndColdFactors[lowerTime][coldTemp] || 0.6;
  const upperValue = roomAndColdFactors[upperTime][coldTemp] || 0.6;
  const timeFraction = (coldTime - lowerTime) / (upperTime - lowerTime);
  
  return lowerValue + (upperValue - lowerValue) * timeFraction;
};