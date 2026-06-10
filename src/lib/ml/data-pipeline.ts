/**
 * ML Data Pipeline - Preprocessing utilities for TensorFlow.js models.
 * Handles normalization, windowing, and tensor preparation.
 */

interface DailyEmission {
  date: string;
  transport: number;
  energy: number;
  food: number;
  shopping: number;
  total: number;
}

export interface NormalizationParams {
  min: number;
  max: number;
}

/**
 * Normalize data to [0, 1] range using Min-Max scaling.
 */
export function normalizeData(data: number[], params?: NormalizationParams): { normalized: number[]; params: NormalizationParams } {
  const min = params?.min ?? Math.min(...data);
  const max = params?.max ?? Math.max(...data);
  const range = max - min || 1; // Prevent division by zero

  return {
    normalized: data.map((v) => (v - min) / range),
    params: { min, max },
  };
}

/**
 * Reverse normalization to get original scale values.
 */
export function denormalizeData(data: number[], params: NormalizationParams): number[] {
  const range = params.max - params.min || 1;
  return data.map((v) => v * range + params.min);
}

/**
 * Create sliding windows for time series prediction.
 * @param data - Sequential data points
 * @param windowSize - Number of past data points to use as input
 * @returns Array of { input: number[], target: number }
 */
export function createWindows(
  data: number[],
  windowSize: number
): { inputs: number[][]; targets: number[] } {
  const inputs: number[][] = [];
  const targets: number[] = [];

  for (let i = 0; i <= data.length - windowSize - 1; i++) {
    inputs.push(data.slice(i, i + windowSize));
    targets.push(data[i + windowSize]);
  }

  return { inputs, targets };
}

/**
 * Create multi-feature sliding windows.
 * Each window contains [windowSize x numFeatures] data.
 */
export function createMultiFeatureWindows(
  data: number[][],
  windowSize: number
): { inputs: number[][][]; targets: number[] } {
  const inputs: number[][][] = [];
  const targets: number[] = [];

  // Assume last column is the target (total CO₂)
  for (let i = 0; i <= data.length - windowSize - 1; i++) {
    inputs.push(data.slice(i, i + windowSize));
    targets.push(data[i + windowSize][data[0].length - 1]); // total column
  }

  return { inputs, targets };
}

/**
 * Aggregate activities into daily emission totals by category.
 */
export function aggregateDailyEmissions(
  activities: { category: string; co2Amount: number; date: Date }[]
): DailyEmission[] {
  const dailyMap: Record<string, DailyEmission> = {};

  for (const activity of activities) {
    const dateKey = activity.date.toISOString().split('T')[0];

    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {
        date: dateKey,
        transport: 0,
        energy: 0,
        food: 0,
        shopping: 0,
        total: 0,
      };
    }

    const day = dailyMap[dateKey];
    const cat = activity.category as keyof Omit<DailyEmission, 'date' | 'total'>;
    if (cat in day) {
      (day[cat] as number) += activity.co2Amount;
    }
    day.total += activity.co2Amount;
  }

  // Sort by date and fill gaps
  const dates = Object.keys(dailyMap).sort();
  if (dates.length === 0) return [];

  const result: DailyEmission[] = [];
  const start = new Date(dates[0]);
  const end = new Date(dates[dates.length - 1]);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split('T')[0];
    result.push(
      dailyMap[key] ?? {
        date: key,
        transport: 0,
        energy: 0,
        food: 0,
        shopping: 0,
        total: 0,
      }
    );
  }

  return result;
}

/**
 * Full preprocessing pipeline: activities → normalized windowed tensors.
 */
export function prepareTrainingData(
  activities: { category: string; co2Amount: number; date: Date }[],
  windowSize: number = 7
): {
  inputs: number[][][];
  targets: number[];
  normParams: NormalizationParams;
  featureNames: string[];
  dailyData: DailyEmission[];
} | null {
  const daily = aggregateDailyEmissions(activities);

  if (daily.length < windowSize + 7) {
    return null; // Not enough data
  }

  // Extract features: [transport, energy, food, shopping, total]
  const featureNames = ['transport', 'energy', 'food', 'shopping', 'total'];
  const rawData = daily.map((d) => [d.transport, d.energy, d.food, d.shopping, d.total]);

  // Normalize each feature column
  const totalCol = rawData.map((r) => r[4]);
  const { params: normParams } = normalizeData(totalCol);

  // Normalize all columns using total's params for simplicity
  const normalizedData = rawData.map((row) =>
    row.map((val) => (val - normParams.min) / (normParams.max - normParams.min || 1))
  );

  // Create windows
  const { inputs, targets } = createMultiFeatureWindows(normalizedData, windowSize);

  return { inputs, targets, normParams, featureNames, dailyData: daily };
}
