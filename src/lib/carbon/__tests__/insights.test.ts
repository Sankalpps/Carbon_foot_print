import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateInsights,
  getComparison,
  getTrendAnalysis,
  getAchievements,
  getSmartScheduling,
} from '@/lib/carbon/insights';
import type { Insight, Achievement } from '@/lib/carbon/insights';

/**
 * Tests for the insights module.
 * Covers insight generation, global comparison, trend analysis,
 * achievements/gamification, and smart scheduling.
 */
describe('Carbon Insights', () => {
  // ── generateInsights ──────────────────────────────────────────────────────

  describe('generateInsights', () => {
    it('should return empty array for no activities', () => {
      expect(generateInsights([])).toEqual([]);
    });

    it('should generate category tips for the highest-impact category', () => {
      const activities = [
        { id: '1', category: 'transport', subCategory: 'car_petrol', co2Amount: 100, date: new Date() },
        { id: '2', category: 'food', subCategory: 'beef', co2Amount: 10, date: new Date() },
      ];
      const insights = generateInsights(activities);
      expect(insights.length).toBeGreaterThan(0);
      // Transport is highest, so transport tips should appear
      const transportInsights = insights.filter((i) => i.category === 'transport');
      expect(transportInsights.length).toBeGreaterThan(0);
    });

    it('should generate beef-specific insight when beef is top sub-category', () => {
      const activities = [
        { id: '1', category: 'food', subCategory: 'beef', co2Amount: 100, date: new Date() },
        { id: '2', category: 'food', subCategory: 'poultry', co2Amount: 5, date: new Date() },
      ];
      const insights = generateInsights(activities);
      const beefInsight = insights.find((i) => i.id === 'food-beef-switch');
      expect(beefInsight).toBeDefined();
      expect(beefInsight!.title).toBe('Switch from beef to poultry');
    });

    it('should generate car_petrol-specific insight when car_petrol is top sub-category', () => {
      const activities = [
        { id: '1', category: 'transport', subCategory: 'car_petrol', co2Amount: 200, date: new Date() },
      ];
      const insights = generateInsights(activities);
      const carInsight = insights.find((i) => i.id === 'transport-car-bus');
      expect(carInsight).toBeDefined();
      expect(carInsight!.title).toBe('Try public transport for commuting');
    });

    it('should return at most 6 insights', () => {
      // Create enough activities to trigger many insights
      const activities = [
        { id: '1', category: 'transport', subCategory: 'car_petrol', co2Amount: 200, date: new Date() },
        { id: '2', category: 'food', subCategory: 'beef', co2Amount: 100, date: new Date() },
        { id: '3', category: 'energy', subCategory: 'electricity', co2Amount: 50, date: new Date() },
        { id: '4', category: 'shopping', subCategory: 'electronics', co2Amount: 30, date: new Date() },
      ];
      const insights = generateInsights(activities);
      expect(insights.length).toBeLessThanOrEqual(6);
    });

    it('should sort insights by priority descending', () => {
      const activities = [
        { id: '1', category: 'transport', subCategory: 'car_petrol', co2Amount: 200, date: new Date() },
        { id: '2', category: 'food', subCategory: 'beef', co2Amount: 5, date: new Date() },
      ];
      const insights = generateInsights(activities);
      for (let i = 1; i < insights.length; i++) {
        expect(insights[i - 1].priority).toBeGreaterThanOrEqual(insights[i].priority);
      }
    });

    it('should include confidence values between 0 and 1', () => {
      const activities = [
        { id: '1', category: 'transport', subCategory: 'car_petrol', co2Amount: 100, date: new Date() },
      ];
      const insights = generateInsights(activities);
      for (const insight of insights) {
        expect(insight.confidence).toBeGreaterThan(0);
        expect(insight.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  // ── getComparison ─────────────────────────────────────────────────────────

  describe('getComparison', () => {
    it('should return "excellent" for very low emissions (< 196 kg)', () => {
      const result = getComparison(100);
      expect(result.status).toBe('excellent');
      expect(result.percentile).toBe('Top 10%');
    });

    it('should return "good" for moderate emissions (196-313 kg)', () => {
      const result = getComparison(250);
      expect(result.status).toBe('good');
      expect(result.percentile).toBe('Top 30%');
    });

    it('should return "average" for near-average emissions (313-470 kg)', () => {
      const result = getComparison(392);
      expect(result.status).toBe('average');
      expect(result.percentile).toBe('Average');
    });

    it('should return "high" for above-average emissions (>= 470 kg)', () => {
      const result = getComparison(600);
      expect(result.status).toBe('high');
      expect(result.percentile).toBe('Above Average');
    });

    it('should calculate vsGlobal percentage correctly', () => {
      // (392 - 392) / 392 * 100 = 0
      const result = getComparison(392);
      expect(result.vsGlobal).toBe(0);
    });

    it('should return negative vsGlobal for below-average', () => {
      const result = getComparison(196);
      // (196 - 392) / 392 * 100 = -50
      expect(result.vsGlobal).toBe(-50);
    });

    it('should handle zero emissions', () => {
      const result = getComparison(0);
      expect(result.status).toBe('excellent');
      expect(result.vsGlobal).toBe(-100);
    });
  });

  // ── getTrendAnalysis ──────────────────────────────────────────────────────

  describe('getTrendAnalysis', () => {
    it('should return "steady" when no recent activity data', () => {
      const result = getTrendAnalysis([]);
      expect(result.direction).toBe('steady');
      expect(result.weekOverWeek).toBe(0);
      expect(result.monthOverMonth).toBe(0);
    });

    it('should return "improving" when month-over-month is < -5%', () => {
      const now = new Date();
      const activities = [
        // Last month: high emissions
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `old-${i}`,
          category: 'transport',
          subCategory: 'car_petrol',
          co2Amount: 50,
          date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        })),
        // This month: low emissions
        ...Array.from({ length: 2 }, (_, i) => ({
          id: `new-${i}`,
          category: 'transport',
          subCategory: 'car_petrol',
          co2Amount: 5,
          date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        })),
      ];
      const result = getTrendAnalysis(activities);
      expect(result.direction).toBe('improving');
    });

    it('should return "worsening" when month-over-month is > 5%', () => {
      const now = new Date();
      const activities = [
        // Last month: low emissions
        ...Array.from({ length: 2 }, (_, i) => ({
          id: `old-${i}`,
          category: 'transport',
          subCategory: 'car_petrol',
          co2Amount: 5,
          date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        })),
        // This month: high emissions
        ...Array.from({ length: 10 }, (_, i) => ({
          id: `new-${i}`,
          category: 'transport',
          subCategory: 'car_petrol',
          co2Amount: 50,
          date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        })),
      ];
      const result = getTrendAnalysis(activities);
      expect(result.direction).toBe('worsening');
    });

    it('should return weekOverWeek = 0 when last week has no data', () => {
      const now = new Date();
      const activities = [
        {
          id: '1',
          category: 'transport',
          subCategory: 'car_petrol',
          co2Amount: 50,
          date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
      ];
      const result = getTrendAnalysis(activities);
      expect(result.weekOverWeek).toBe(0);
    });
  });

  // ── getAchievements ───────────────────────────────────────────────────────

  describe('getAchievements', () => {
    it('should return 6 achievements', () => {
      const achievements = getAchievements([]);
      expect(achievements).toHaveLength(6);
    });

    it('should not earn any achievements with no activities', () => {
      const achievements = getAchievements([]);
      for (const a of achievements) {
        expect(a.earned).toBe(false);
      }
    });

    it('should earn "First Step" with 1 activity', () => {
      const activities = [
        { id: '1', category: 'transport', subCategory: 'car_petrol', co2Amount: 5, date: new Date() },
      ];
      const achievements = getAchievements(activities);
      const firstStep = achievements.find((a) => a.id === 'first-log');
      expect(firstStep?.earned).toBe(true);
      expect(firstStep?.progress).toBe(1);
    });

    it('should earn "Week Warrior" with 7 unique days', () => {
      const now = new Date();
      const activities = Array.from({ length: 7 }, (_, i) => ({
        id: `${i}`,
        category: 'transport',
        subCategory: 'car_petrol',
        co2Amount: 5,
        date: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
      }));
      const achievements = getAchievements(activities);
      const weekWarrior = achievements.find((a) => a.id === 'week-streak');
      expect(weekWarrior?.earned).toBe(true);
    });

    it('should earn "Full Picture" with all 4 categories', () => {
      const activities = [
        { id: '1', category: 'transport', subCategory: 'car_petrol', co2Amount: 5, date: new Date() },
        { id: '2', category: 'energy', subCategory: 'electricity', co2Amount: 5, date: new Date() },
        { id: '3', category: 'food', subCategory: 'beef', co2Amount: 5, date: new Date() },
        { id: '4', category: 'shopping', subCategory: 'clothing', co2Amount: 5, date: new Date() },
      ];
      const achievements = getAchievements(activities);
      const fullPicture = achievements.find((a) => a.id === 'category-explorer');
      expect(fullPicture?.earned).toBe(true);
      expect(fullPicture?.progress).toBe(1);
    });

    it('should earn "Data Champion" with 50 activities', () => {
      const activities = Array.from({ length: 50 }, (_, i) => ({
        id: `${i}`,
        category: 'transport',
        subCategory: 'car_petrol',
        co2Amount: 1,
        date: new Date(),
      }));
      const achievements = getAchievements(activities);
      const dataChamp = achievements.find((a) => a.id === 'data-champion');
      expect(dataChamp?.earned).toBe(true);
    });

    it('should earn "Low Carbon Hero" with low total and > 10 activities', () => {
      const activities = Array.from({ length: 11 }, (_, i) => ({
        id: `${i}`,
        category: 'transport',
        subCategory: 'bicycle',
        co2Amount: 0,
        date: new Date(),
      }));
      const achievements = getAchievements(activities);
      const lowCarbon = achievements.find((a) => a.id === 'low-carbon');
      expect(lowCarbon?.earned).toBe(true);
    });

    it('should earn "Pedal Power" with 10 bicycle trips', () => {
      const activities = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        category: 'transport',
        subCategory: 'bicycle',
        co2Amount: 0,
        date: new Date(),
      }));
      const achievements = getAchievements(activities);
      const cyclist = achievements.find((a) => a.id === 'cyclist');
      expect(cyclist?.earned).toBe(true);
    });

    it('should have progress between 0 and 1 for all achievements', () => {
      const activities = Array.from({ length: 3 }, (_, i) => ({
        id: `${i}`,
        category: 'transport',
        subCategory: 'car_petrol',
        co2Amount: 5,
        date: new Date(),
      }));
      const achievements = getAchievements(activities);
      for (const a of achievements) {
        expect(a.progress).toBeGreaterThanOrEqual(0);
        expect(a.progress).toBeLessThanOrEqual(1);
      }
    });
  });

  // ── getSmartScheduling ────────────────────────────────────────────────────

  describe('getSmartScheduling', () => {
    it('should return 3 best and 3 worst times', () => {
      const forecast = Array.from({ length: 10 }, (_, i) => ({
        time: `${i}:00`,
        intensity: (i + 1) * 50,
      }));
      const result = getSmartScheduling(forecast);
      expect(result.bestTimes).toHaveLength(3);
      expect(result.worstTimes).toHaveLength(3);
    });

    it('should order bestTimes from lowest to highest intensity', () => {
      const forecast = [
        { time: '06:00', intensity: 200 },
        { time: '02:00', intensity: 100 },
        { time: '14:00', intensity: 500 },
        { time: '10:00', intensity: 300 },
        { time: '18:00', intensity: 600 },
      ];
      const result = getSmartScheduling(forecast);
      expect(result.bestTimes[0].intensity).toBe(100);
      expect(result.bestTimes[1].intensity).toBe(200);
      expect(result.bestTimes[2].intensity).toBe(300);
    });

    it('should order worstTimes from highest to lowest intensity', () => {
      const forecast = [
        { time: '06:00', intensity: 200 },
        { time: '02:00', intensity: 100 },
        { time: '14:00', intensity: 500 },
        { time: '10:00', intensity: 300 },
        { time: '18:00', intensity: 600 },
      ];
      const result = getSmartScheduling(forecast);
      expect(result.worstTimes[0].intensity).toBe(600);
      expect(result.worstTimes[1].intensity).toBe(500);
      expect(result.worstTimes[2].intensity).toBe(300);
    });

    it('should handle empty forecast', () => {
      const result = getSmartScheduling([]);
      expect(result.bestTimes).toEqual([]);
      expect(result.worstTimes).toEqual([]);
    });

    it('should handle forecast with fewer than 3 entries', () => {
      const forecast = [
        { time: '06:00', intensity: 200 },
        { time: '18:00', intensity: 600 },
      ];
      const result = getSmartScheduling(forecast);
      expect(result.bestTimes).toHaveLength(2);
      expect(result.worstTimes).toHaveLength(2);
    });

    it('should not mutate the original forecast array', () => {
      const forecast = [
        { time: '18:00', intensity: 600 },
        { time: '06:00', intensity: 200 },
        { time: '02:00', intensity: 100 },
      ];
      const copy = [...forecast];
      getSmartScheduling(forecast);
      expect(forecast).toEqual(copy);
    });
  });
});
