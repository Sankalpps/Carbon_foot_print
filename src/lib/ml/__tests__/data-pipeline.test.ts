import { describe, it, expect } from 'vitest';
import {
  normalizeData,
  denormalizeData,
  createWindows,
  aggregateDailyEmissions,
  createMultiFeatureWindows,
  prepareTrainingData,
} from '@/lib/ml/data-pipeline';

/**
 * Tests for the ML data pipeline module.
 * Covers normalization, denormalization, sliding windows,
 * multi-feature windows, daily emission aggregation, and the full pipeline.
 */
describe('Data Pipeline', () => {
  // ── normalizeData ─────────────────────────────────────────────────────────

  describe('normalizeData', () => {
    it('should normalize data to [0, 1] range', () => {
      const { normalized } = normalizeData([0, 50, 100]);
      expect(normalized[0]).toBe(0);
      expect(normalized[1]).toBe(0.5);
      expect(normalized[2]).toBe(1);
    });

    it('should return correct normalization params', () => {
      const { params } = normalizeData([10, 20, 30]);
      expect(params.min).toBe(10);
      expect(params.max).toBe(30);
    });

    it('should handle single-value array (range = 0, uses fallback 1)', () => {
      const { normalized, params } = normalizeData([5]);
      expect(params.min).toBe(5);
      expect(params.max).toBe(5);
      // (5 - 5) / 1 = 0
      expect(normalized[0]).toBe(0);
    });

    it('should handle all-same values', () => {
      const { normalized } = normalizeData([7, 7, 7]);
      // All should be 0 since (7-7)/1 = 0
      expect(normalized).toEqual([0, 0, 0]);
    });

    it('should use provided params when given', () => {
      const { normalized, params } = normalizeData([50], { min: 0, max: 100 });
      expect(params.min).toBe(0);
      expect(params.max).toBe(100);
      expect(normalized[0]).toBe(0.5);
    });

    it('should handle negative values', () => {
      const { normalized } = normalizeData([-10, 0, 10]);
      expect(normalized[0]).toBe(0);
      expect(normalized[1]).toBe(0.5);
      expect(normalized[2]).toBe(1);
    });
  });

  // ── denormalizeData ───────────────────────────────────────────────────────

  describe('denormalizeData', () => {
    it('should reverse normalization', () => {
      const params = { min: 0, max: 100 };
      const result = denormalizeData([0, 0.5, 1], params);
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(50);
      expect(result[2]).toBe(100);
    });

    it('should handle min/max being equal (range fallback to 1)', () => {
      const params = { min: 5, max: 5 };
      const result = denormalizeData([0], params);
      // 0 * 1 + 5 = 5
      expect(result[0]).toBe(5);
    });

    it('should be the inverse of normalizeData', () => {
      const original = [10, 25, 50, 75, 100];
      const { normalized, params } = normalizeData(original);
      const restored = denormalizeData(normalized, params);
      for (let i = 0; i < original.length; i++) {
        expect(restored[i]).toBeCloseTo(original[i], 10);
      }
    });

    it('should handle empty array', () => {
      expect(denormalizeData([], { min: 0, max: 100 })).toEqual([]);
    });
  });

  // ── createWindows ─────────────────────────────────────────────────────────

  describe('createWindows', () => {
    it('should create sliding windows correctly', () => {
      const data = [1, 2, 3, 4, 5];
      const { inputs, targets } = createWindows(data, 3);
      expect(inputs).toEqual([
        [1, 2, 3],
        [2, 3, 4],
      ]);
      expect(targets).toEqual([4, 5]);
    });

    it('should return empty arrays when data is too short', () => {
      const data = [1, 2];
      const { inputs, targets } = createWindows(data, 3);
      expect(inputs).toEqual([]);
      expect(targets).toEqual([]);
    });

    it('should return single window when data has exactly windowSize+1 items', () => {
      const data = [10, 20, 30, 40];
      const { inputs, targets } = createWindows(data, 3);
      expect(inputs).toEqual([[10, 20, 30]]);
      expect(targets).toEqual([40]);
    });

    it('should handle windowSize of 1', () => {
      const data = [1, 2, 3];
      const { inputs, targets } = createWindows(data, 1);
      expect(inputs).toEqual([[1], [2]]);
      expect(targets).toEqual([2, 3]);
    });

    it('should return empty arrays for empty data', () => {
      const { inputs, targets } = createWindows([], 3);
      expect(inputs).toEqual([]);
      expect(targets).toEqual([]);
    });
  });

  // ── createMultiFeatureWindows ─────────────────────────────────────────────

  describe('createMultiFeatureWindows', () => {
    it('should create multi-feature windows with target from last column', () => {
      const data = [
        [1, 2, 10],
        [3, 4, 20],
        [5, 6, 30],
        [7, 8, 40],
      ];
      const { inputs, targets } = createMultiFeatureWindows(data, 2);
      expect(inputs).toHaveLength(2);
      expect(inputs[0]).toEqual([
        [1, 2, 10],
        [3, 4, 20],
      ]);
      expect(targets).toEqual([30, 40]);
    });

    it('should return empty for insufficient data', () => {
      const data = [[1, 2]];
      const { inputs, targets } = createMultiFeatureWindows(data, 2);
      expect(inputs).toHaveLength(0);
      expect(targets).toHaveLength(0);
    });
  });

  // ── aggregateDailyEmissions ───────────────────────────────────────────────

  describe('aggregateDailyEmissions', () => {
    it('should aggregate activities into daily totals', () => {
      const date = new Date('2025-06-01T10:00:00Z');
      const activities = [
        { category: 'transport', co2Amount: 10, date },
        { category: 'food', co2Amount: 5, date },
        { category: 'transport', co2Amount: 3, date },
      ];
      const result = aggregateDailyEmissions(activities);
      expect(result).toHaveLength(1);
      expect(result[0].transport).toBe(13);
      expect(result[0].food).toBe(5);
      expect(result[0].total).toBe(18);
    });

    it('should return empty array for no activities', () => {
      expect(aggregateDailyEmissions([])).toEqual([]);
    });

    it('should fill gaps between dates with zero entries', () => {
      const activities = [
        { category: 'transport', co2Amount: 10, date: new Date('2025-06-01T10:00:00Z') },
        { category: 'transport', co2Amount: 5, date: new Date('2025-06-03T10:00:00Z') },
      ];
      const result = aggregateDailyEmissions(activities);
      expect(result).toHaveLength(3); // June 1, 2, 3
      expect(result[1].total).toBe(0); // June 2 gap-filled
    });

    it('should sort results by date', () => {
      const activities = [
        { category: 'transport', co2Amount: 10, date: new Date('2025-06-03T10:00:00Z') },
        { category: 'food', co2Amount: 5, date: new Date('2025-06-01T10:00:00Z') },
      ];
      const result = aggregateDailyEmissions(activities);
      expect(result[0].date).toBe('2025-06-01');
      expect(result[result.length - 1].date).toBe('2025-06-03');
    });

    it('should handle all four categories in one day', () => {
      const date = new Date('2025-06-01T10:00:00Z');
      const activities = [
        { category: 'transport', co2Amount: 10, date },
        { category: 'energy', co2Amount: 20, date },
        { category: 'food', co2Amount: 30, date },
        { category: 'shopping', co2Amount: 40, date },
      ];
      const result = aggregateDailyEmissions(activities);
      expect(result[0].transport).toBe(10);
      expect(result[0].energy).toBe(20);
      expect(result[0].food).toBe(30);
      expect(result[0].shopping).toBe(40);
      expect(result[0].total).toBe(100);
    });

    it('should handle single activity', () => {
      const activities = [
        { category: 'energy', co2Amount: 42, date: new Date('2025-06-15T12:00:00Z') },
      ];
      const result = aggregateDailyEmissions(activities);
      expect(result).toHaveLength(1);
      expect(result[0].energy).toBe(42);
      expect(result[0].total).toBe(42);
    });
  });

  // ── prepareTrainingData ───────────────────────────────────────────────────

  describe('prepareTrainingData', () => {
    it('should return null when not enough data', () => {
      const activities = [
        { category: 'transport', co2Amount: 10, date: new Date('2025-06-01') },
      ];
      const result = prepareTrainingData(activities, 7);
      expect(result).toBeNull();
    });

    it('should return training data when enough data is available', () => {
      // Need at least windowSize + 7 daily data points
      const activities = Array.from({ length: 20 }, (_, i) => ({
        category: 'transport',
        co2Amount: 10 + i,
        date: new Date(2025, 5, i + 1), // June 1-20
      }));
      const result = prepareTrainingData(activities, 7);
      expect(result).not.toBeNull();
      expect(result!.featureNames).toEqual(['transport', 'energy', 'food', 'shopping', 'total']);
      expect(result!.inputs.length).toBeGreaterThan(0);
      expect(result!.targets.length).toBeGreaterThan(0);
      expect(result!.normParams).toHaveProperty('min');
      expect(result!.normParams).toHaveProperty('max');
    });
  });
});
