export interface ColdFermentationFactor {
  resultFactor: number;
  timeFactor: number;
}

export const coldFermentationFactors: Record<number, ColdFermentationFactor> = {
  4: {
    resultFactor: 0.044,
    timeFactor: -1.19
  },
  5: {
    resultFactor: 0.043,
    timeFactor: -1.21
  },
  6: {
    resultFactor: 0.042,
    timeFactor: -1.22
  },
  7: {
    resultFactor: 0.041,
    timeFactor: -1.23,
  },
  8: {
    resultFactor: 0.04,
    timeFactor: -1.24
  },
  9: {
    resultFactor: 0.039,
    timeFactor: -1.25,
  },
  10: {
    resultFactor: 0.038,
    timeFactor: -1.26
  },
  11: {
    resultFactor: 0.037,
    timeFactor: -1.27
  },
  12: {
    resultFactor: 0.036,
    timeFactor: -1.28
  },
  13: {
    resultFactor: 0.035,
    timeFactor: -1.29
  }
};
