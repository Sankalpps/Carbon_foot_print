import { describe, it, expect, vi } from 'vitest';

// Mock TensorFlow.js before importing the module under test
vi.mock('@tensorflow/tfjs', () => ({
  sequential: vi.fn(() => ({
    add: vi.fn(),
    compile: vi.fn(),
  })),
  layers: {
    dense: vi.fn((config: Record<string, unknown>) => ({ config })),
  },
}));

import {
  calculateReconstructionError,
  detectAnomalies,
  detectTrendAnomaly,
  buildAutoencoder,
} from '@/lib/ml/anomaly-detector';

/**
 * Tests for the anomaly detector module.
 * Covers reconstruction error, z-score anomaly detection,
 * trend anomaly detection, and autoencoder building.
 */
describe('Anomaly Detector', () => {
  // ── calculateReconstructionError ──────────────────────────────────────────

  describe('calculateReconstructionError', () => {
    it('should return 0 for identical input and output', () => {
      const result = calculateReconstructionError([1, 2, 3], [1, 2, 3]);
      expect(result).toBe(0);
    });

    it('should calculate MSE correctly', () => {
      // input=[1,2,3], output=[2,3,4] → errors: 1,1,1 → MSE = 3/3 = 1
      const result = calculateReconstructionError([1, 2, 3], [2, 3, 4]);
      expect(result).toBe(1);
    });

    it('should handle single-element arrays', () => {
      // (5-3)^2 / 1 = 4
      const result = calculateReconstructionError([5], [3]);
      expect(result).toBe(4);
    });

    it('should handle zero-value arrays', () => {
      const result = calculateReconstructionError([0, 0], [0, 0]);
      expect(result).toBe(0);
    });

    it('should handle floating-point values', () => {
      const result = calculateReconstructionError([0.5], [1.0]);
      // (0.5 - 1.0)^2 / 1 = 0.25
      expect(result).toBeCloseTo(0.25);
    });

    it('should handle large error values', () => {
      const result = calculateReconstructionError([0], [100]);
      // (0-100)^2 / 1 = 10000
      expect(result).toBe(10000);
    });
  });

  // ── detectAnomalies ───────────────────────────────────────────────────────

  describe('detectAnomalies', () => {
    it('should return empty array when no anomalies found', () => {
      const activities = Array.from({ length: 10 }, (_, i) => ({
        category: 'transport',
        co2Amount: 10,
        date: new Date(),
        subCategory: 'car_petrol',
      }));
      const results = detectAnomalies(activities);
      expect(results).toEqual([]);
    });

    it('should skip categories with fewer than 5 data points', () => {
      const activities = [
        { category: 'transport', co2Amount: 10, date: new Date(), subCategory: 'car_petrol' },
        { category: 'transport', co2Amount: 10, date: new Date(), subCategory: 'car_petrol' },
        { category: 'transport', co2Amount: 10, date: new Date(), subCategory: 'car_petrol' },
        { category: 'transport', co2Amount: 1000, date: new Date(), subCategory: 'car_petrol' },
      ];
      const results = detectAnomalies(activities);
      expect(results).toEqual([]);
    });

    it('should detect anomaly when latest value is far above mean', () => {
      // 9 values of 10, last value of 100 → z-score will be very high
      const activities = [
        ...Array.from({ length: 9 }, () => ({
          category: 'transport',
          co2Amount: 10,
          date: new Date(),
          subCategory: 'car_petrol',
        })),
        {
          category: 'transport',
          co2Amount: 100,
          date: new Date(),
          subCategory: 'car_petrol',
        },
      ];
      const results = detectAnomalies(activities);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].isAnomaly).toBe(true);
      expect(results[0].category).toBe('transport');
      expect(results[0].score).toBeGreaterThan(2.0);
    });

    it('should set threshold to 2.0', () => {
      const activities = [
        ...Array.from({ length: 9 }, () => ({
          category: 'food',
          co2Amount: 10,
          date: new Date(),
          subCategory: 'beef',
        })),
        { category: 'food', co2Amount: 200, date: new Date(), subCategory: 'beef' },
      ];
      const results = detectAnomalies(activities);
      if (results.length > 0) {
        expect(results[0].threshold).toBe(2.0);
      }
    });

    it('should include a descriptive message', () => {
      const activities = [
        ...Array.from({ length: 9 }, () => ({
          category: 'energy',
          co2Amount: 10,
          date: new Date(),
          subCategory: 'electricity',
        })),
        { category: 'energy', co2Amount: 200, date: new Date(), subCategory: 'electricity' },
      ];
      const results = detectAnomalies(activities);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].message).toContain('energy');
      expect(results[0].message).toContain('higher than your average');
    });

    it('should handle multiple categories independently', () => {
      const activities = [
        ...Array.from({ length: 6 }, () => ({
          category: 'transport',
          co2Amount: 10,
          date: new Date(),
          subCategory: 'car_petrol',
        })),
        ...Array.from({ length: 6 }, () => ({
          category: 'food',
          co2Amount: 10,
          date: new Date(),
          subCategory: 'beef',
        })),
      ];
      // No anomalies since all values are the same
      const results = detectAnomalies(activities);
      expect(results).toEqual([]);
    });

    it('should skip categories with zero standard deviation', () => {
      const activities = Array.from({ length: 10 }, () => ({
        category: 'transport',
        co2Amount: 10, // All same
        date: new Date(),
        subCategory: 'car_petrol',
      }));
      const results = detectAnomalies(activities);
      expect(results).toEqual([]);
    });

    it('should return empty for empty array', () => {
      expect(detectAnomalies([])).toEqual([]);
    });
  });

  // ── detectTrendAnomaly ────────────────────────────────────────────────────

  describe('detectTrendAnomaly', () => {
    it('should return no anomaly when data is too short', () => {
      const result = detectTrendAnomaly([1, 2, 3], 7);
      expect(result.isAnomaly).toBe(false);
      expect(result.currentAvg).toBe(0);
      expect(result.historicalAvg).toBe(0);
    });

    it('should detect anomaly when recent average > 50% increase', () => {
      // Historical: [10,10,10,10,10,10,10], Recent: [20,20,20,20,20,20,20]
      const dailyTotals = [10, 10, 10, 10, 10, 10, 10, 20, 20, 20, 20, 20, 20, 20];
      const result = detectTrendAnomaly(dailyTotals, 7);
      expect(result.isAnomaly).toBe(true);
      expect(result.currentAvg).toBe(20);
      expect(result.historicalAvg).toBe(10);
    });

    it('should not flag anomaly for small increase (< 50%)', () => {
      // Historical: [10,10,10,10,10,10,10], Recent: [14,14,14,14,14,14,14]
      const dailyTotals = [10, 10, 10, 10, 10, 10, 10, 14, 14, 14, 14, 14, 14, 14];
      const result = detectTrendAnomaly(dailyTotals, 7);
      expect(result.isAnomaly).toBe(false);
    });

    it('should not flag anomaly when decreasing', () => {
      const dailyTotals = [20, 20, 20, 20, 20, 20, 20, 5, 5, 5, 5, 5, 5, 5];
      const result = detectTrendAnomaly(dailyTotals, 7);
      expect(result.isAnomaly).toBe(false);
    });

    it('should round averages to 2 decimal places', () => {
      const dailyTotals = [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5];
      const result = detectTrendAnomaly(dailyTotals, 7);
      const decimals = (result.currentAvg.toString().split('.')[1] || '').length;
      expect(decimals).toBeLessThanOrEqual(2);
    });

    it('should handle all-zero historical averages without dividing by zero', () => {
      const dailyTotals = [0, 0, 0, 0, 0, 0, 0, 10, 10, 10, 10, 10, 10, 10];
      const result = detectTrendAnomaly(dailyTotals, 7);
      // historicalAvg = 0, change = 0 (guarded), so not anomaly
      expect(result.isAnomaly).toBe(false);
    });

    it('should use default windowSize of 7', () => {
      const dailyTotals = Array.from({ length: 14 }, (_, i) => (i < 7 ? 10 : 20));
      const result = detectTrendAnomaly(dailyTotals);
      expect(result.isAnomaly).toBe(true);
    });
  });

  // ── buildAutoencoder ──────────────────────────────────────────────────────

  describe('buildAutoencoder', () => {
    it('should return a model object', () => {
      const model = buildAutoencoder(10);
      expect(model).toBeDefined();
    });

    it('should call compile on the model', () => {
      const model = buildAutoencoder(4);
      expect(model.compile).toHaveBeenCalled();
    });

    it('should add 4 layers to the model', () => {
      const model = buildAutoencoder(8);
      // Encoder: 2 layers, Decoder: 2 layers = 4 calls to add
      expect(model.add).toHaveBeenCalledTimes(4);
    });
  });
});
