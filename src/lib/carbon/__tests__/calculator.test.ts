import { describe, it, expect } from 'vitest';
import {
  calculateCO2,
  calculateWithRealTimeGrid,
  getEquivalents,
  getCategoryBreakdown,
  getSubCategoryTotals,
  getAllCategories,
  GLOBAL_MONTHLY_AVERAGE_KG,
} from '@/lib/carbon/calculator';

/**
 * Tests for the carbon calculator module.
 * Covers CO₂ calculation, real-time grid, equivalents,
 * category breakdown, sub-category totals, and category listing.
 */
describe('Carbon Calculator', () => {
  // ── calculateCO2 ──────────────────────────────────────────────────────────

  describe('calculateCO2', () => {
    it('should calculate CO₂ for car_petrol correctly (0.21 * 25 = 5.25)', () => {
      const result = calculateCO2('car_petrol', 25);
      expect(result).toBe(5.25);
    });

    it('should calculate CO₂ for bicycle (factor 0.0) as 0', () => {
      const result = calculateCO2('bicycle', 100);
      expect(result).toBe(0);
    });

    it('should return 0 for an unknown sub-category', () => {
      const result = calculateCO2('flying_car', 100);
      expect(result).toBe(0);
    });

    it('should return 0 when amount is 0', () => {
      const result = calculateCO2('car_petrol', 0);
      expect(result).toBe(0);
    });

    it('should handle very large amounts without error', () => {
      const result = calculateCO2('car_petrol', 1_000_000);
      // 0.21 * 1_000_000 = 210_000
      expect(result).toBe(210000);
    });

    it('should calculate CO₂ for beef correctly (27.0 * 2 = 54)', () => {
      const result = calculateCO2('beef', 2);
      expect(result).toBe(54);
    });

    it('should calculate CO₂ for electricity correctly (0.42 * 100 = 42)', () => {
      const result = calculateCO2('electricity', 100);
      expect(result).toBe(42);
    });

    it('should calculate CO₂ for electronics correctly (50.0 * 1 = 50)', () => {
      const result = calculateCO2('electronics', 1);
      expect(result).toBe(50);
    });

    it('should handle fractional amounts', () => {
      const result = calculateCO2('car_petrol', 0.5);
      // 0.21 * 0.5 = 0.105
      expect(result).toBe(0.105);
    });
  });

  // ── calculateWithRealTimeGrid ─────────────────────────────────────────────

  describe('calculateWithRealTimeGrid', () => {
    it('should convert gCO₂/kWh to kgCO₂ correctly', () => {
      // 100 kWh * 500 gCO₂/kWh = 50000 gCO₂ = 50 kgCO₂
      const result = calculateWithRealTimeGrid(100, 500);
      expect(result).toBe(50);
    });

    it('should return 0 when amount is 0', () => {
      expect(calculateWithRealTimeGrid(0, 500)).toBe(0);
    });

    it('should return 0 when grid intensity is 0', () => {
      expect(calculateWithRealTimeGrid(100, 0)).toBe(0);
    });

    it('should handle small values precisely', () => {
      // 1 kWh * 200 gCO₂/kWh = 200 g = 0.2 kg
      expect(calculateWithRealTimeGrid(1, 200)).toBe(0.2);
    });

    it('should handle large grid intensity', () => {
      // 10 kWh * 1000 gCO₂/kWh = 10000 g = 10 kg
      expect(calculateWithRealTimeGrid(10, 1000)).toBe(10);
    });
  });

  // ── getEquivalents ────────────────────────────────────────────────────────

  describe('getEquivalents', () => {
    it('should compute correct tree-years', () => {
      const eq = getEquivalents(220);
      // 220 / 22 = 10.0
      expect(eq.trees).toBe(10);
    });

    it('should compute correct driving km', () => {
      const eq = getEquivalents(210);
      // 210 / 0.21 = 1000
      expect(eq.driving).toBe(1000);
    });

    it('should compute correct flights (as string)', () => {
      const eq = getEquivalents(120);
      // 120 / 120 = 1.0
      expect(eq.flights).toBe('1.0');
    });

    it('should compute correct smartphone charges', () => {
      const eq = getEquivalents(0.008);
      // 0.008 / 0.008 = 1
      expect(eq.smartphones).toBe(1);
    });

    it('should handle 0 kg CO₂', () => {
      const eq = getEquivalents(0);
      expect(eq.trees).toBe(0);
      expect(eq.driving).toBe(0);
      expect(eq.flights).toBe('0.0');
      expect(eq.smartphones).toBe(0);
    });

    it('should handle fractional CO₂ values', () => {
      const eq = getEquivalents(22);
      expect(eq.trees).toBe(1);
    });
  });

  // ── getCategoryBreakdown ──────────────────────────────────────────────────

  describe('getCategoryBreakdown', () => {
    it('should group activities by category and compute percentages', () => {
      const activities = [
        { category: 'transport', co2Amount: 50 },
        { category: 'transport', co2Amount: 50 },
        { category: 'food', co2Amount: 100 },
      ];
      const breakdown = getCategoryBreakdown(activities);

      expect(breakdown).toHaveLength(2);
      // Sorted by total desc: food(100) first, transport(100) second (or order by total)
      const totalPercent = breakdown.reduce((s, b) => s + b.percentage, 0);
      expect(totalPercent).toBe(100);
    });

    it('should return an empty array for no activities', () => {
      expect(getCategoryBreakdown([])).toEqual([]);
    });

    it('should return 100% for a single category', () => {
      const activities = [{ category: 'energy', co2Amount: 42 }];
      const breakdown = getCategoryBreakdown(activities);
      expect(breakdown).toHaveLength(1);
      expect(breakdown[0].percentage).toBe(100);
    });

    it('should include label, icon, and color from CATEGORY_META', () => {
      const activities = [{ category: 'transport', co2Amount: 10 }];
      const breakdown = getCategoryBreakdown(activities);
      expect(breakdown[0].label).toBe('Transport');
      expect(breakdown[0].icon).toBe('🚗');
      expect(breakdown[0].color).toBe('hsl(200, 85%, 55%)');
    });

    it('should sort categories by total descending', () => {
      const activities = [
        { category: 'food', co2Amount: 10 },
        { category: 'transport', co2Amount: 50 },
        { category: 'shopping', co2Amount: 30 },
      ];
      const breakdown = getCategoryBreakdown(activities);
      expect(breakdown[0].category).toBe('transport');
      expect(breakdown[1].category).toBe('shopping');
      expect(breakdown[2].category).toBe('food');
    });

    it('should use fallback meta for unknown categories', () => {
      const activities = [{ category: 'unknown_cat', co2Amount: 5 }];
      const breakdown = getCategoryBreakdown(activities);
      expect(breakdown[0].label).toBe('unknown_cat');
      expect(breakdown[0].icon).toBe('📊');
      expect(breakdown[0].color).toBe('#888');
    });
  });

  // ── getSubCategoryTotals ──────────────────────────────────────────────────

  describe('getSubCategoryTotals', () => {
    it('should aggregate emissions by subCategory', () => {
      const activities = [
        { subCategory: 'car_petrol', co2Amount: 10 },
        { subCategory: 'car_petrol', co2Amount: 15 },
        { subCategory: 'bus', co2Amount: 5 },
      ];
      const totals = getSubCategoryTotals(activities);
      const petrol = totals.find((t) => t.subCategory === 'car_petrol');
      expect(petrol?.total).toBe(25);
    });

    it('should sort by total descending', () => {
      const activities = [
        { subCategory: 'bus', co2Amount: 5 },
        { subCategory: 'car_petrol', co2Amount: 20 },
      ];
      const totals = getSubCategoryTotals(activities);
      expect(totals[0].subCategory).toBe('car_petrol');
      expect(totals[1].subCategory).toBe('bus');
    });

    it('should return an empty array for no activities', () => {
      expect(getSubCategoryTotals([])).toEqual([]);
    });

    it('should include displayName and icon from emission factors', () => {
      const activities = [{ subCategory: 'beef', co2Amount: 27 }];
      const totals = getSubCategoryTotals(activities);
      expect(totals[0].displayName).toBe('Beef');
      expect(totals[0].icon).toBe('🥩');
    });

    it('should use fallback for unknown subCategory', () => {
      const activities = [{ subCategory: 'unknown_sub', co2Amount: 5 }];
      const totals = getSubCategoryTotals(activities);
      expect(totals[0].displayName).toBe('unknown_sub');
      expect(totals[0].icon).toBe('📊');
    });
  });

  // ── getAllCategories ───────────────────────────────────────────────────────

  describe('getAllCategories', () => {
    it('should return all 4 categories', () => {
      const categories = getAllCategories();
      expect(categories).toHaveLength(4);
    });

    it('should include transport, energy, food, shopping', () => {
      const categories = getAllCategories();
      const names = categories.map((c) => c.category);
      expect(names).toContain('transport');
      expect(names).toContain('energy');
      expect(names).toContain('food');
      expect(names).toContain('shopping');
    });

    it('should have subCategories for each category', () => {
      const categories = getAllCategories();
      for (const cat of categories) {
        expect(cat.subCategories.length).toBeGreaterThan(0);
        for (const sub of cat.subCategories) {
          expect(sub).toHaveProperty('value');
          expect(sub).toHaveProperty('label');
          expect(sub).toHaveProperty('icon');
          expect(sub).toHaveProperty('unit');
          expect(sub).toHaveProperty('factor');
        }
      }
    });

    it('transport should have 8 sub-categories', () => {
      const categories = getAllCategories();
      const transport = categories.find((c) => c.category === 'transport');
      expect(transport?.subCategories).toHaveLength(8);
    });

    it('each category should have label, icon, and color', () => {
      const categories = getAllCategories();
      for (const cat of categories) {
        expect(cat.label).toBeDefined();
        expect(cat.icon).toBeDefined();
        expect(cat.color).toBeDefined();
      }
    });
  });

  // ── GLOBAL_MONTHLY_AVERAGE_KG ─────────────────────────────────────────────

  describe('GLOBAL_MONTHLY_AVERAGE_KG', () => {
    it('should be 392', () => {
      expect(GLOBAL_MONTHLY_AVERAGE_KG).toBe(392);
    });
  });
});
