import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module
const mockGoalCreate = vi.fn();
const mockGoalFindFirst = vi.fn();
const mockActivityFindMany = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    goal: {
      create: (...args: unknown[]) => mockGoalCreate(...args),
      findFirst: (...args: unknown[]) => mockGoalFindFirst(...args),
    },
    activity: {
      findMany: (...args: unknown[]) => mockActivityFindMany(...args),
    },
  },
}));

import { createGoal, getActiveGoal, getGoalProgress } from '@/lib/dal/goals';

/**
 * Tests for the goals data access layer.
 * All Prisma calls are mocked. Special attention to divide-by-zero edge case.
 */
describe('Goals DAL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── createGoal ────────────────────────────────────────────────────────────

  describe('createGoal', () => {
    it('should create a goal with the correct data', async () => {
      const goalData = {
        targetReduction: 20,
        baselineCo2: 500,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      };
      const mockResult = { id: 'goal1', ...goalData, userId: 'user1' };
      mockGoalCreate.mockResolvedValue(mockResult);

      const result = await createGoal('user1', goalData);

      expect(mockGoalCreate).toHaveBeenCalledTimes(1);
      const callArg = mockGoalCreate.mock.calls[0][0];
      expect(callArg.data.userId).toBe('user1');
      expect(callArg.data.targetReduction).toBe(20);
      expect(callArg.data.baselineCo2).toBe(500);
      expect(callArg.data.startDate).toEqual(goalData.startDate);
      expect(callArg.data.endDate).toEqual(goalData.endDate);
      expect(result).toEqual(mockResult);
    });

    it('should handle different target reductions', async () => {
      mockGoalCreate.mockResolvedValue({ id: 'goal2' });

      await createGoal('user1', {
        targetReduction: 100,
        baselineCo2: 1000,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30'),
      });

      const callArg = mockGoalCreate.mock.calls[0][0];
      expect(callArg.data.targetReduction).toBe(100);
    });
  });

  // ── getActiveGoal ─────────────────────────────────────────────────────────

  describe('getActiveGoal', () => {
    it('should query for active goals with endDate in the future', async () => {
      mockGoalFindFirst.mockResolvedValue(null);
      await getActiveGoal('user1');

      expect(mockGoalFindFirst).toHaveBeenCalledTimes(1);
      const callArg = mockGoalFindFirst.mock.calls[0][0];
      expect(callArg.where.userId).toBe('user1');
      expect(callArg.where.endDate.gte).toBeInstanceOf(Date);
      expect(callArg.orderBy).toEqual({ createdAt: 'desc' });
    });

    it('should return the goal when found', async () => {
      const mockGoal = { id: 'goal1', userId: 'user1', targetReduction: 20 };
      mockGoalFindFirst.mockResolvedValue(mockGoal);

      const result = await getActiveGoal('user1');
      expect(result).toEqual(mockGoal);
    });

    it('should return null when no active goal exists', async () => {
      mockGoalFindFirst.mockResolvedValue(null);
      const result = await getActiveGoal('user1');
      expect(result).toBeNull();
    });
  });

  // ── getGoalProgress ───────────────────────────────────────────────────────

  describe('getGoalProgress', () => {
    it('should return null when no active goal exists', async () => {
      mockGoalFindFirst.mockResolvedValue(null);
      const result = await getGoalProgress('user1');
      expect(result).toBeNull();
    });

    it('should calculate progress correctly when on track', async () => {
      const goal = {
        id: 'goal1',
        userId: 'user1',
        targetReduction: 20,
        baselineCo2: 500,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        createdAt: new Date(),
      };
      mockGoalFindFirst.mockResolvedValue(goal);
      // Current month activities sum to 300 kg
      mockActivityFindMany.mockResolvedValue([
        { co2Amount: 150 },
        { co2Amount: 150 },
      ]);

      const result = await getGoalProgress('user1');
      expect(result).not.toBeNull();
      // targetCo2 = 500 * (1 - 20/100) = 400
      // progress = ((500 - 300) / (500 - 400)) * 100 = (200 / 100) * 100 = 200 → capped at 100
      expect(result!.targetCo2).toBe(400);
      expect(result!.currentMonthTotal).toBe(300);
      expect(result!.progress).toBe(100); // Capped at 100
      expect(result!.isOnTrack).toBe(true);
    });

    it('should report not on track when exceeding target', async () => {
      const goal = {
        id: 'goal2',
        userId: 'user1',
        targetReduction: 20,
        baselineCo2: 500,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        createdAt: new Date(),
      };
      mockGoalFindFirst.mockResolvedValue(goal);
      // Current month activities sum to 450 kg (above target of 400)
      mockActivityFindMany.mockResolvedValue([
        { co2Amount: 250 },
        { co2Amount: 200 },
      ]);

      const result = await getGoalProgress('user1');
      expect(result).not.toBeNull();
      // targetCo2 = 400, currentMonthTotal = 450
      // progress = ((500 - 450) / (500 - 400)) * 100 = (50 / 100) * 100 = 50
      expect(result!.progress).toBe(50);
      expect(result!.isOnTrack).toBe(false);
    });

    it('should clamp progress to 0 when emissions far exceed baseline', async () => {
      const goal = {
        id: 'goal3',
        userId: 'user1',
        targetReduction: 10,
        baselineCo2: 100,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        createdAt: new Date(),
      };
      mockGoalFindFirst.mockResolvedValue(goal);
      // Current month 200 kg, far exceeding baseline of 100
      mockActivityFindMany.mockResolvedValue([{ co2Amount: 200 }]);

      const result = await getGoalProgress('user1');
      expect(result).not.toBeNull();
      // targetCo2 = 100 * (1 - 10/100) = 90
      // progress = ((100 - 200) / (100 - 90)) * 100 = (-100/10) * 100 = -1000 → capped at 0
      expect(result!.progress).toBe(0);
    });

    it('should handle 100% targetReduction (divide-by-zero edge case)', async () => {
      const goal = {
        id: 'goal4',
        userId: 'user1',
        targetReduction: 100,
        baselineCo2: 500,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        createdAt: new Date(),
      };
      mockGoalFindFirst.mockResolvedValue(goal);
      mockActivityFindMany.mockResolvedValue([{ co2Amount: 100 }]);

      const result = await getGoalProgress('user1');
      expect(result).not.toBeNull();
      // targetCo2 = 500 * (1 - 100/100) = 0
      // progress = ((500 - 100) / (500 - 0)) * 100 = (400/500) * 100 = 80
      expect(result!.targetCo2).toBe(0);
      expect(result!.progress).toBe(80);
    });

    it('should handle zero emissions in current month', async () => {
      const goal = {
        id: 'goal5',
        userId: 'user1',
        targetReduction: 50,
        baselineCo2: 400,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        createdAt: new Date(),
      };
      mockGoalFindFirst.mockResolvedValue(goal);
      mockActivityFindMany.mockResolvedValue([]);

      const result = await getGoalProgress('user1');
      expect(result).not.toBeNull();
      // targetCo2 = 400 * 0.5 = 200
      // currentMonthTotal = 0
      // progress = ((400 - 0) / (400 - 200)) * 100 = (400/200) * 100 = 200 → capped at 100
      expect(result!.currentMonthTotal).toBe(0);
      expect(result!.progress).toBe(100);
      expect(result!.isOnTrack).toBe(true);
    });

    it('should round currentMonthTotal to 2 decimal places', async () => {
      const goal = {
        id: 'goal6',
        userId: 'user1',
        targetReduction: 10,
        baselineCo2: 100,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        createdAt: new Date(),
      };
      mockGoalFindFirst.mockResolvedValue(goal);
      mockActivityFindMany.mockResolvedValue([
        { co2Amount: 1.111 },
        { co2Amount: 2.222 },
      ]);

      const result = await getGoalProgress('user1');
      expect(result!.currentMonthTotal).toBe(3.33);
    });

    it('should round targetCo2 to 2 decimal places', async () => {
      const goal = {
        id: 'goal7',
        userId: 'user1',
        targetReduction: 33,
        baselineCo2: 100,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2026-12-31'),
        createdAt: new Date(),
      };
      mockGoalFindFirst.mockResolvedValue(goal);
      mockActivityFindMany.mockResolvedValue([]);

      const result = await getGoalProgress('user1');
      // targetCo2 = 100 * (1 - 0.33) = 67
      expect(result!.targetCo2).toBe(67);
    });
  });
});
