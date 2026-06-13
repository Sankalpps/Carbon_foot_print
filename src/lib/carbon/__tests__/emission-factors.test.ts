import { describe, it, expect } from 'vitest';
import {
  EMISSION_FACTORS,
  getEmissionFactor,
  getFactorsByCategory,
  getUnit,
  CATEGORY_META,
} from '@/lib/carbon/emission-factors';

/**
 * Tests for the emission factors database and helper functions.
 * Validates factor counts, data integrity, category grouping, and unit lookups.
 */
describe('Emission Factors', () => {
  // ── EMISSION_FACTORS array ────────────────────────────────────────────────

  describe('EMISSION_FACTORS', () => {
    it('should contain exactly 21 entries', () => {
      expect(EMISSION_FACTORS).toHaveLength(21);
    });

    it('every factor should have all required fields', () => {
      for (const ef of EMISSION_FACTORS) {
        expect(ef).toHaveProperty('category');
        expect(ef).toHaveProperty('subCategory');
        expect(ef).toHaveProperty('displayName');
        expect(ef).toHaveProperty('factor');
        expect(ef).toHaveProperty('unit');
        expect(ef).toHaveProperty('icon');
      }
    });

    it('all factors should have non-negative factor values', () => {
      for (const ef of EMISSION_FACTORS) {
        expect(ef.factor).toBeGreaterThanOrEqual(0);
      }
    });

    it('all subCategory values should be unique', () => {
      const subs = EMISSION_FACTORS.map((ef) => ef.subCategory);
      expect(new Set(subs).size).toBe(subs.length);
    });

    it('every factor should have a non-empty displayName', () => {
      for (const ef of EMISSION_FACTORS) {
        expect(ef.displayName.length).toBeGreaterThan(0);
      }
    });

    it('every factor should have a non-empty unit', () => {
      for (const ef of EMISSION_FACTORS) {
        expect(ef.unit.length).toBeGreaterThan(0);
      }
    });

    it('every factor should have a non-empty icon', () => {
      for (const ef of EMISSION_FACTORS) {
        expect(ef.icon.length).toBeGreaterThan(0);
      }
    });
  });

  // ── getEmissionFactor ─────────────────────────────────────────────────────

  describe('getEmissionFactor', () => {
    it('should return the correct factor for car_petrol', () => {
      const factor = getEmissionFactor('car_petrol');
      expect(factor).toBeDefined();
      expect(factor!.factor).toBe(0.21);
      expect(factor!.category).toBe('transport');
      expect(factor!.unit).toBe('km');
    });

    it('should return the correct factor for beef', () => {
      const factor = getEmissionFactor('beef');
      expect(factor).toBeDefined();
      expect(factor!.factor).toBe(27.0);
    });

    it('should return undefined for nonexistent sub-category', () => {
      expect(getEmissionFactor('nonexistent')).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(getEmissionFactor('')).toBeUndefined();
    });

    it('should return the correct factor for furniture', () => {
      const factor = getEmissionFactor('furniture');
      expect(factor).toBeDefined();
      expect(factor!.factor).toBe(80.0);
      expect(factor!.category).toBe('shopping');
    });
  });

  // ── getFactorsByCategory ──────────────────────────────────────────────────

  describe('getFactorsByCategory', () => {
    it('should return 8 items for transport', () => {
      expect(getFactorsByCategory('transport')).toHaveLength(8);
    });

    it('should return 3 items for energy', () => {
      expect(getFactorsByCategory('energy')).toHaveLength(3);
    });

    it('should return 7 items for food', () => {
      expect(getFactorsByCategory('food')).toHaveLength(7);
    });

    it('should return 3 items for shopping', () => {
      expect(getFactorsByCategory('shopping')).toHaveLength(3);
    });

    it('all returned factors should belong to the requested category', () => {
      const transportFactors = getFactorsByCategory('transport');
      for (const ef of transportFactors) {
        expect(ef.category).toBe('transport');
      }
    });
  });

  // ── getUnit ───────────────────────────────────────────────────────────────

  describe('getUnit', () => {
    it('should return "km" for car_petrol', () => {
      expect(getUnit('car_petrol')).toBe('km');
    });

    it('should return "kWh" for electricity', () => {
      expect(getUnit('electricity')).toBe('kWh');
    });

    it('should return "kg" for beef', () => {
      expect(getUnit('beef')).toBe('kg');
    });

    it('should return "items" for clothing', () => {
      expect(getUnit('clothing')).toBe('items');
    });

    it('should return "units" for nonexistent sub-category', () => {
      expect(getUnit('nonexistent')).toBe('units');
    });

    it('should return "units" for empty string', () => {
      expect(getUnit('')).toBe('units');
    });
  });

  // ── CATEGORY_META ─────────────────────────────────────────────────────────

  describe('CATEGORY_META', () => {
    it('should have all 4 categories', () => {
      expect(Object.keys(CATEGORY_META)).toHaveLength(4);
      expect(CATEGORY_META).toHaveProperty('transport');
      expect(CATEGORY_META).toHaveProperty('energy');
      expect(CATEGORY_META).toHaveProperty('food');
      expect(CATEGORY_META).toHaveProperty('shopping');
    });

    it('each category should have label, icon, and color', () => {
      for (const meta of Object.values(CATEGORY_META)) {
        expect(meta).toHaveProperty('label');
        expect(meta).toHaveProperty('icon');
        expect(meta).toHaveProperty('color');
        expect(typeof meta.label).toBe('string');
        expect(typeof meta.icon).toBe('string');
        expect(typeof meta.color).toBe('string');
      }
    });

    it('transport label should be "Transport"', () => {
      expect(CATEGORY_META.transport.label).toBe('Transport');
    });

    it('energy label should be "Energy"', () => {
      expect(CATEGORY_META.energy.label).toBe('Energy');
    });
  });
});
