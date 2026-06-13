import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module
const mockCreate = vi.fn();
const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();
const mockDelete = vi.fn();
const mockCount = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    activity: {
      create: (...args: unknown[]) => mockCreate(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

import {
  createActivity,
  getActivities,
  getActivityStats,
  getMonthlyBreakdown,
  deleteActivity,
  getActivityCount,
} from '@/lib/dal/activities';

/**
 * Tests for the activities data access layer.
 * All Prisma calls are mocked to isolate business logic.
 */
describe('Activities DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── createActivity ────────────────────────────────────────────────────────

  describe('createActivity', () => {
    it('should create an activity with calculated CO₂', async () => {
      const mockResult = { id: '1', co2Amount: 5.25 };
      mockCreate.mockResolvedValue(mockResult);

      const result = await createActivity('user1', {
        category: 'transport',
        subCategory: 'car_petrol',
        amount: 25,
        unit: 'km',
        date: new Date('2025-06-01'),
        notes: '',
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.data.userId).toBe('user1');
      expect(callArg.data.co2Amount).toBe(5.25); // 0.21 * 25
      expect(callArg.data.unit).toBe('km');
      expect(result).toEqual(mockResult);
    });

    it('should pass gridIntensity as null if not provided', async () => {
      mockCreate.mockResolvedValue({ id: '2' });

      await createActivity('user1', {
        category: 'energy',
        subCategory: 'electricity',
        amount: 100,
        unit: 'kWh',
        date: new Date(),
        notes: '',
      });

      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.data.gridIntensity).toBeNull();
    });

    it('should pass gridIntensity when provided', async () => {
      mockCreate.mockResolvedValue({ id: '3' });

      await createActivity(
        'user1',
        {
          category: 'energy',
          subCategory: 'electricity',
          amount: 100,
          unit: 'kWh',
          date: new Date(),
          notes: '',
        },
        450
      );

      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.data.gridIntensity).toBe(450);
    });

    it('should pass notes as null when empty string', async () => {
      mockCreate.mockResolvedValue({ id: '4' });

      await createActivity('user1', {
        category: 'food',
        subCategory: 'beef',
        amount: 2,
        unit: 'kg',
        date: new Date(),
        notes: '',
      });

      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.data.notes).toBeNull();
    });

    it('should pass notes when provided', async () => {
      mockCreate.mockResolvedValue({ id: '5' });

      await createActivity('user1', {
        category: 'food',
        subCategory: 'beef',
        amount: 2,
        unit: 'kg',
        date: new Date(),
        notes: 'Dinner steak',
      });

      const callArg = mockCreate.mock.calls[0][0];
      expect(callArg.data.notes).toBe('Dinner steak');
    });
  });

  // ── getActivities ─────────────────────────────────────────────────────────

  describe('getActivities', () => {
    it('should call findMany with userId', async () => {
      mockFindMany.mockResolvedValue([]);
      await getActivities('user1');
      expect(mockFindMany).toHaveBeenCalledTimes(1);
      const callArg = mockFindMany.mock.calls[0][0];
      expect(callArg.where.userId).toBe('user1');
    });

    it('should apply category filter when provided', async () => {
      mockFindMany.mockResolvedValue([]);
      await getActivities('user1', { category: 'transport' });
      const callArg = mockFindMany.mock.calls[0][0];
      expect(callArg.where.category).toBe('transport');
    });

    it('should apply date range when startDate and endDate provided', async () => {
      mockFindMany.mockResolvedValue([]);
      const start = new Date('2025-01-01');
      const end = new Date('2025-12-31');
      await getActivities('user1', { startDate: start, endDate: end });
      const callArg = mockFindMany.mock.calls[0][0];
      expect(callArg.where.date.gte).toEqual(start);
      expect(callArg.where.date.lte).toEqual(end);
    });

    it('should use default limit of 50 and offset of 0', async () => {
      mockFindMany.mockResolvedValue([]);
      await getActivities('user1');
      const callArg = mockFindMany.mock.calls[0][0];
      expect(callArg.take).toBe(50);
      expect(callArg.skip).toBe(0);
    });

    it('should use custom limit and offset', async () => {
      mockFindMany.mockResolvedValue([]);
      await getActivities('user1', { limit: 10, offset: 20 });
      const callArg = mockFindMany.mock.calls[0][0];
      expect(callArg.take).toBe(10);
      expect(callArg.skip).toBe(20);
    });

    it('should default to ordering by date desc', async () => {
      mockFindMany.mockResolvedValue([]);
      await getActivities('user1');
      const callArg = mockFindMany.mock.calls[0][0];
      expect(callArg.orderBy).toEqual({ date: 'desc' });
    });

    it('should allow custom order by co2Amount asc', async () => {
      mockFindMany.mockResolvedValue([]);
      await getActivities('user1', { orderBy: 'co2Amount', order: 'asc' });
      const callArg = mockFindMany.mock.calls[0][0];
      expect(callArg.orderBy).toEqual({ co2Amount: 'asc' });
    });
  });

  // ── getActivityStats ──────────────────────────────────────────────────────

  describe('getActivityStats', () => {
    it('should return aggregated stats for a month', async () => {
      mockFindMany.mockResolvedValue([
        { co2Amount: 10 },
        { co2Amount: 20 },
        { co2Amount: 30 },
      ]);

      const result = await getActivityStats('user1', 'month');
      expect(result.totalCO2).toBe(60);
      expect(result.totalActivities).toBe(3);
    });

    it('should default to month period', async () => {
      mockFindMany.mockResolvedValue([]);
      const result = await getActivityStats('user1');
      expect(result.totalActivities).toBe(0);
      expect(result.totalCO2).toBe(0);
    });

    it('should handle empty activities', async () => {
      mockFindMany.mockResolvedValue([]);
      const result = await getActivityStats('user1', 'week');
      expect(result.totalCO2).toBe(0);
      expect(result.totalActivities).toBe(0);
    });

    it('should round totalCO2 to 2 decimal places', async () => {
      mockFindMany.mockResolvedValue([
        { co2Amount: 1.111 },
        { co2Amount: 2.222 },
      ]);
      const result = await getActivityStats('user1');
      expect(result.totalCO2).toBe(3.33);
    });
  });

  // ── getMonthlyBreakdown ───────────────────────────────────────────────────

  describe('getMonthlyBreakdown', () => {
    it('should return labels and data arrays', async () => {
      mockFindMany.mockResolvedValue([]);
      const result = await getMonthlyBreakdown('user1', 6);
      expect(result.labels).toHaveLength(6);
      expect(result.data).toHaveLength(6);
    });

    it('should fill missing months with 0', async () => {
      mockFindMany.mockResolvedValue([]);
      const result = await getMonthlyBreakdown('user1', 3);
      expect(result.data.every((d) => d === 0)).toBe(true);
    });

    it('should aggregate activities by month', async () => {
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      mockFindMany.mockResolvedValue([
        { date: now, co2Amount: 10 },
        { date: now, co2Amount: 20 },
      ]);
      const result = await getMonthlyBreakdown('user1', 1);
      // The current month should have 30
      expect(result.data[0]).toBe(30);
    });
  });

  // ── deleteActivity ────────────────────────────────────────────────────────

  describe('deleteActivity', () => {
    it('should delete activity when user owns it', async () => {
      mockFindUnique.mockResolvedValue({ id: 'act1', userId: 'user1' });
      mockDelete.mockResolvedValue({ id: 'act1' });

      const result = await deleteActivity('user1', 'act1');
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'act1' } });
      expect(result).toEqual({ id: 'act1' });
    });

    it('should throw when activity not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      await expect(deleteActivity('user1', 'nonexistent')).rejects.toThrow(
        'Activity not found or unauthorized'
      );
    });

    it('should throw when user does not own the activity', async () => {
      mockFindUnique.mockResolvedValue({ id: 'act1', userId: 'other_user' });
      await expect(deleteActivity('user1', 'act1')).rejects.toThrow(
        'Activity not found or unauthorized'
      );
    });

    it('should not call delete if ownership check fails', async () => {
      mockFindUnique.mockResolvedValue(null);
      try {
        await deleteActivity('user1', 'act1');
      } catch {
        // expected
      }
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  // ── getActivityCount ──────────────────────────────────────────────────────

  describe('getActivityCount', () => {
    it('should return count for a user', async () => {
      mockCount.mockResolvedValue(42);
      const result = await getActivityCount('user1');
      expect(result).toBe(42);
      expect(mockCount).toHaveBeenCalledWith({ where: { userId: 'user1' } });
    });

    it('should return 0 for user with no activities', async () => {
      mockCount.mockResolvedValue(0);
      const result = await getActivityCount('empty_user');
      expect(result).toBe(0);
    });
  });
});
