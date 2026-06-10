/**
 * Anomaly Detection - Autoencoder-based pattern learning.
 * Detects unusual emission spikes in user's activity data.
 */
import * as tf from '@tensorflow/tfjs';
import { normalizeData } from './data-pipeline';

const ANOMALY_THRESHOLD = 2.0; // Standard deviations above mean reconstruction error

export interface AnomalyResult {
  isAnomaly: boolean;
  score: number;
  threshold: number;
  category: string;
  message: string;
}

/**
 * Build an autoencoder model for anomaly detection.
 */
export function buildAutoencoder(inputDim: number): tf.Sequential {
  const model = tf.sequential();

  // Encoder
  model.add(tf.layers.dense({ units: Math.ceil(inputDim / 2), activation: 'relu', inputShape: [inputDim] }));
  model.add(tf.layers.dense({ units: Math.ceil(inputDim / 4), activation: 'relu' }));

  // Decoder
  model.add(tf.layers.dense({ units: Math.ceil(inputDim / 2), activation: 'relu' }));
  model.add(tf.layers.dense({ units: inputDim, activation: 'sigmoid' }));

  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

  return model;
}

/**
 * Calculate reconstruction error for anomaly scoring.
 */
export function calculateReconstructionError(input: number[], output: number[]): number {
  let sumSquaredError = 0;
  for (let i = 0; i < input.length; i++) {
    sumSquaredError += Math.pow(input[i] - output[i], 2);
  }
  return sumSquaredError / input.length;
}

/**
 * Detect anomalies in activity data using statistical analysis.
 * Uses a simpler z-score approach for efficiency (no model training needed).
 */
export function detectAnomalies(
  activities: { category: string; co2Amount: number; date: Date; subCategory: string }[]
): AnomalyResult[] {
  const results: AnomalyResult[] = [];

  // Group by category
  const categoryData: Record<string, number[]> = {};
  for (const activity of activities) {
    if (!categoryData[activity.category]) {
      categoryData[activity.category] = [];
    }
    categoryData[activity.category].push(activity.co2Amount);
  }

  // Check each category for anomalies
  for (const [category, values] of Object.entries(categoryData)) {
    if (values.length < 5) continue; // Need enough data

    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length
    );

    if (stdDev === 0) continue;

    const latestValue = values[values.length - 1];
    const zScore = (latestValue - mean) / stdDev;

    if (zScore > ANOMALY_THRESHOLD) {
      const percentAbove = Math.round(((latestValue - mean) / mean) * 100);
      results.push({
        isAnomaly: true,
        score: zScore,
        threshold: ANOMALY_THRESHOLD,
        category,
        message: `Your ${category} emissions are ${percentAbove}% higher than your average. This is unusual for your pattern.`,
      });
    }
  }

  return results;
}

/**
 * Simple moving average for trend detection.
 */
export function detectTrendAnomaly(
  dailyTotals: number[],
  windowSize: number = 7
): { isAnomaly: boolean; currentAvg: number; historicalAvg: number } {
  if (dailyTotals.length < windowSize * 2) {
    return { isAnomaly: false, currentAvg: 0, historicalAvg: 0 };
  }

  const recentWindow = dailyTotals.slice(-windowSize);
  const previousWindow = dailyTotals.slice(-windowSize * 2, -windowSize);

  const currentAvg = recentWindow.reduce((s, v) => s + v, 0) / windowSize;
  const historicalAvg = previousWindow.reduce((s, v) => s + v, 0) / windowSize;

  const change = historicalAvg > 0 ? (currentAvg - historicalAvg) / historicalAvg : 0;

  return {
    isAnomaly: change > 0.5, // 50% increase
    currentAvg: Math.round(currentAvg * 100) / 100,
    historicalAvg: Math.round(historicalAvg * 100) / 100,
  };
}
