// Room temperature fermentation factors
export const roomFermentationFactors: Record<number, number> = {
  14: 0.33,
  15: 0.3,
  16: 0.245,
  17: 0.205,
  18: 0.17,
  19: 0.14,
  20: 0.113,
  21: 0.1,
  22: 0.08,
  23: 0.0683,
  24: 0.0538,
  25: 0.0472,
  26: 0.0389,
  27: 0.0309,
  28: 0.0264,
  29: 0.0218,
  30: 0.019,
  31: 0.0147,
  32: 0.012,
  33: 0.0098,
  34: 0.008,
  35: 0.007,
  36: 0.0061,
  37: 0.005,
  38: 0.004,
  39: 0.00315,
  40: 0.00265
};

// Cold fermentation factors
export const coldFermentationFactors: Record<number, { resultFactor: number; timeFactor: number }> = {
  4: { resultFactor: 0.044, timeFactor: -1.19 },
  5: { resultFactor: 0.043, timeFactor: -1.21 },
  6: { resultFactor: 0.042, timeFactor: -1.22 },
  7: { resultFactor: 0.041, timeFactor: -1.23 },
  8: { resultFactor: 0.04, timeFactor: -1.24 },
  9: { resultFactor: 0.039, timeFactor: -1.25 },
  10: { resultFactor: 0.038, timeFactor: -1.26 },
  11: { resultFactor: 0.037, timeFactor: -1.27 },
  12: { resultFactor: 0.036, timeFactor: -1.28 },
  13: { resultFactor: 0.035, timeFactor: -1.29 }
};